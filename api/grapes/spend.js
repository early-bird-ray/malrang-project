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

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다' });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { amount, reason, coupleId, metadata } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '유효한 금액이 필요합니다' });
    }
    if (!reason) {
      return res.status(400).json({ error: '사유가 필요합니다' });
    }

    // 트랜잭션으로 잔액 검증 + 차감
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(uid);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) {
        throw new Error('유저 정보를 찾을 수 없습니다');
      }

      const userData = userSnap.data();
      const currentPoints = userData.grapePoints || 0;

      if (currentPoints < amount) {
        throw new Error(`포도알이 부족합니다 (보유: ${currentPoints}, 필요: ${amount})`);
      }

      const newPoints = currentPoints - amount;

      transaction.update(userRef, {
        grapePoints: newPoints,
        updatedAt: new Date().toISOString(),
      });

      return { grapePoints: newPoints };
    });

    // 거래 로그 기록 (커플 ID가 있는 경우)
    if (coupleId) {
      try {
        await db.collection('couples').doc(coupleId)
          .collection('grapeTransactions').add({
            userId: uid,
            type: 'spend',
            amount: -amount,
            reason,
            ...(metadata || {}),
            createdAt: new Date().toISOString(),
          });
      } catch (logError) {
        console.error('Transaction log error:', logError);
      }
    }

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Grape spend error:', error);
    return res.status(400).json({ error: error.message });
  }
}
