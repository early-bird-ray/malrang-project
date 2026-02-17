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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authorization 헤더에서 Firebase ID 토큰 검증
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다' });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const myUid = decodedToken.uid;

    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ error: '초대 코드가 필요합니다' });
    }

    const code = inviteCode.toUpperCase();

    // 트랜잭션으로 원자적 페어 생성
    const result = await db.runTransaction(async (transaction) => {
      // 1. 초대 코드 검증
      const codeRef = db.collection('inviteCodes').doc(code);
      const codeSnap = await transaction.get(codeRef);

      if (!codeSnap.exists) {
        throw new Error('유효하지 않은 초대 코드입니다');
      }

      const codeData = codeSnap.data();
      if (!codeData.active) {
        throw new Error('이미 사용된 초대 코드입니다');
      }
      if (codeData.ownerUid === myUid) {
        throw new Error('자신의 초대 코드는 사용할 수 없습니다');
      }

      // 2. 양쪽 유저 검증
      const partnerUid = codeData.ownerUid;
      const myRef = db.collection('users').doc(myUid);
      const partnerRef = db.collection('users').doc(partnerUid);

      const [mySnap, partnerSnap] = await Promise.all([
        transaction.get(myRef),
        transaction.get(partnerRef),
      ]);

      if (!mySnap.exists) throw new Error('내 계정을 찾을 수 없습니다');
      if (!partnerSnap.exists) throw new Error('상대방 계정을 찾을 수 없습니다');

      const myData = mySnap.data();
      const partnerData = partnerSnap.data();

      if (myData.activeCoupleId) throw new Error('이미 다른 짝꿍과 연결되어 있습니다');
      if (partnerData.activeCoupleId) throw new Error('상대방이 이미 다른 짝꿍과 연결되어 있습니다');

      // 3. 커플 문서 생성
      const coupleId = `${myUid}_${partnerUid}_${Date.now()}`;
      const coupleRef = db.collection('couples').doc(coupleId);
      const now = new Date().toISOString();

      const coupleData = {
        coupleId,
        members: [myUid, partnerUid],
        memberProfiles: {
          [myUid]: { displayName: myData.displayName || '', photoURL: myData.photoURL || null },
          [partnerUid]: { displayName: partnerData.displayName || '', photoURL: partnerData.photoURL || null },
        },
        status: 'active',
        sharedSurveys: {
          [myUid]: myData.survey || {},
          [partnerUid]: partnerData.survey || {},
        },
        sharedPreferences: {
          [myUid]: { likedWords: '', dislikedWords: '' },
          [partnerUid]: { likedWords: '', dislikedWords: '' },
        },
        previousCoupleId: null,
        createdAt: now,
        updatedAt: now,
        endedAt: null,
        version: 1,
      };

      transaction.set(coupleRef, coupleData);

      // 4. 유저 업데이트
      const historyEntry = { coupleId, startedAt: now, endedAt: null, status: 'active' };

      transaction.update(myRef, {
        activeCoupleId: coupleId,
        coupleHistory: admin.firestore.FieldValue.arrayUnion({ ...historyEntry, partnerUid }),
        updatedAt: now,
      });

      transaction.update(partnerRef, {
        activeCoupleId: coupleId,
        coupleHistory: admin.firestore.FieldValue.arrayUnion({ ...historyEntry, partnerUid: myUid }),
        updatedAt: now,
      });

      // 5. 코드 비활성화
      transaction.update(codeRef, {
        active: false,
        usedByUid: myUid,
        usedAt: now,
      });

      return { coupleId, partnerUid, partnerDisplayName: partnerData.displayName };
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Pair create error:', error);
    return res.status(400).json({ error: error.message });
  }
}
