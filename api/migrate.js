const admin = require('firebase-admin');

// Firebase Admin 초기화 (싱글톤)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// 초대 코드 생성
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'MALL-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 관리자 인증 (간단한 비밀 키)
  const { adminSecret } = req.body;
  if (adminSecret !== process.env.MIGRATION_ADMIN_SECRET) {
    return res.status(403).json({ error: '권한이 없습니다' });
  }

  const results = {
    usersProcessed: 0,
    usersSkipped: 0,
    inviteCodesCreated: 0,
    errors: [],
  };

  try {
    // 모든 유저 문서 가져오기
    const usersSnapshot = await db.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      try {
        const uid = userDoc.id;
        const oldData = userDoc.data();

        // 이미 마이그레이션된 유저 건너뛰기
        if (oldData.inviteCode) {
          results.usersSkipped++;
          continue;
        }

        // 초대 코드 생성 (중복 체크)
        let inviteCode = generateInviteCode();
        let attempts = 0;
        while (attempts < 10) {
          const existing = await db.collection('inviteCodes').doc(inviteCode).get();
          if (!existing.exists) break;
          inviteCode = generateInviteCode();
          attempts++;
        }

        // 기존 데이터에서 새 스키마로 변환
        const userData = oldData.user || {};
        const now = new Date().toISOString();

        const newUserData = {
          uid,
          email: oldData.email || null,
          displayName: userData.name || oldData.displayName || '',
          photoURL: oldData.photoURL || null,
          language: 'ko',
          surveyCompleted: !!oldData.savedSurveyAnswers && Object.keys(oldData.savedSurveyAnswers).length > 0,
          survey: oldData.savedSurveyAnswers || {},
          grapePoints: userData.grapePoints || 0,
          totalGrapesEarned: userData.grapePoints || 0, // 초기값으로 현재 포인트 사용
          mallangCredits: 0,
          activeCoupleId: null,
          coupleHistory: [],
          inviteCode,
          createdAt: oldData.createdAt || now,
          updatedAt: now,
        };

        const batch = db.batch();

        // 유저 문서 업데이트
        batch.set(db.collection('users').doc(uid), newUserData);

        // 초대 코드 문서 생성
        batch.set(db.collection('inviteCodes').doc(inviteCode), {
          code: inviteCode,
          ownerUid: uid,
          active: true,
          usedByUid: null,
          usedAt: null,
          createdAt: now,
        });

        // 기분 기록 마이그레이션 (개인 서브컬렉션으로)
        const moodHistory = oldData.moodHistory || [];
        for (const mood of moodHistory) {
          const moodRef = db.collection('users').doc(uid).collection('moodHistory').doc();
          batch.set(moodRef, {
            ...mood,
            createdAt: mood.date || mood.createdAt || now,
          });
        }

        // AI 변환 기록 마이그레이션 (개인 서브컬렉션으로)
        const conversationHistory = oldData.conversationHistory || [];
        for (const entry of conversationHistory) {
          const histRef = db.collection('users').doc(uid).collection('aiTransformHistory').doc();
          batch.set(histRef, {
            ...entry,
            coupleId: null,
            createdAt: entry.timestamp || entry.createdAt || now,
          });
        }

        await batch.commit();

        results.usersProcessed++;
        results.inviteCodesCreated++;
      } catch (userError) {
        results.errors.push({
          uid: userDoc.id,
          error: userError.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: '마이그레이션 완료',
      results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: '마이그레이션 실패',
      message: error.message,
      results,
    });
  }
}
