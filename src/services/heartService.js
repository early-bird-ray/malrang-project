import {
  db,
  doc,
  runTransaction,
  collection,
  addDoc,
} from './firebase';

// 하트 적립 트랜잭션
// 유저 heartPoints 증가 + 거래 로그 기록
export const earnHearts = async (uid, coupleId, amount, reason, metadata = {}) => {
  if (!db) return { error: 'Firebase 미초기화' };
  if (amount <= 0) return { error: '적립 금액은 0보다 커야 합니다' };

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('유저 정보를 찾을 수 없습니다');
      }

      const userData = userSnap.data();
      const newPoints = (userData.heartPoints || 0) + amount;
      const newTotal = (userData.totalHeartsEarned || 0) + amount;

      transaction.update(userRef, {
        heartPoints: newPoints,
        totalHeartsEarned: newTotal,
        updatedAt: new Date().toISOString(),
      });

      return { heartPoints: newPoints, totalHeartsEarned: newTotal };
    });

    // 거래 로그 기록 (트랜잭션 외부)
    if (coupleId) {
      try {
        const txRef = collection(db, 'couples', coupleId, 'heartTransactions');
        await addDoc(txRef, {
          userId: uid,
          type: 'earn',
          amount,
          reason,
          ...metadata,
          createdAt: new Date().toISOString(),
        });
      } catch (logError) {
        console.error('Transaction log error (heart earn):', logError);
      }
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('Earn hearts error:', error);
    return { data: null, error: error.message };
  }
};

// 하트 소비 트랜잭션
// 잔액 검증 → 차감 → 거래 로그 기록
export const spendHearts = async (uid, coupleId, amount, reason, metadata = {}) => {
  if (!db) return { error: 'Firebase 미초기화' };
  if (amount <= 0) return { error: '소비 금액은 0보다 커야 합니다' };

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('유저 정보를 찾을 수 없습니다');
      }

      const userData = userSnap.data();
      const currentPoints = userData.heartPoints || 0;

      if (currentPoints < amount) {
        throw new Error(`하트가 부족합니다 (보유: ${currentPoints}, 필요: ${amount})`);
      }

      const newPoints = currentPoints - amount;

      transaction.update(userRef, {
        heartPoints: newPoints,
        updatedAt: new Date().toISOString(),
      });

      return { heartPoints: newPoints };
    });

    // 거래 로그 기록
    if (coupleId) {
      try {
        const txRef = collection(db, 'couples', coupleId, 'heartTransactions');
        await addDoc(txRef, {
          userId: uid,
          type: 'spend',
          amount: -amount,
          reason,
          ...metadata,
          createdAt: new Date().toISOString(),
        });
      } catch (logError) {
        console.error('Transaction log error (heart spend):', logError);
      }
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('Spend hearts error:', error);
    return { data: null, error: error.message };
  }
};
