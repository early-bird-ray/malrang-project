import {
  db,
  doc,
  runTransaction,
  collection,
  addDoc,
} from './firebase';

// 포도 적립 트랜잭션
// 유저 grapePoints/totalGrapesEarned 증가 + 거래 로그 기록
export const earnGrapes = async (uid, coupleId, amount, reason, metadata = {}) => {
  if (!db) return { error: 'Firebase 미초기화' };
  if (amount <= 0) return { error: '적립 금액은 0보다 커야 합니다' };

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. 유저 문서 읽기
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('유저 정보를 찾을 수 없습니다');
      }

      const userData = userSnap.data();
      const newPoints = (userData.grapePoints || 0) + amount;
      const newTotal = (userData.totalGrapesEarned || 0) + amount;

      // 2. 유저 포인트 업데이트
      transaction.update(userRef, {
        grapePoints: newPoints,
        totalGrapesEarned: newTotal,
        updatedAt: new Date().toISOString(),
      });

      return { grapePoints: newPoints, totalGrapesEarned: newTotal };
    });

    // 3. 거래 로그 기록 (트랜잭션 외부 - 로그는 실패해도 포인트 적립은 유지)
    if (coupleId) {
      try {
        const txRef = collection(db, 'couples', coupleId, 'grapeTransactions');
        await addDoc(txRef, {
          userId: uid,
          type: 'earn',
          amount,
          reason,
          ...metadata,
          createdAt: new Date().toISOString(),
        });
      } catch (logError) {
        console.error('Transaction log error (earn):', logError);
      }
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('Earn grapes error:', error);
    return { data: null, error: error.message };
  }
};

// 포도 소비 트랜잭션
// 잔액 검증 → 차감 → 거래 로그 기록
export const spendGrapes = async (uid, coupleId, amount, reason, metadata = {}) => {
  if (!db) return { error: 'Firebase 미초기화' };
  if (amount <= 0) return { error: '소비 금액은 0보다 커야 합니다' };

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. 유저 문서 읽기
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('유저 정보를 찾을 수 없습니다');
      }

      const userData = userSnap.data();
      const currentPoints = userData.grapePoints || 0;

      // 2. 잔액 검증
      if (currentPoints < amount) {
        throw new Error(`포도알이 부족합니다 (보유: ${currentPoints}, 필요: ${amount})`);
      }

      const newPoints = currentPoints - amount;

      // 3. 포인트 차감
      transaction.update(userRef, {
        grapePoints: newPoints,
        updatedAt: new Date().toISOString(),
      });

      return { grapePoints: newPoints };
    });

    // 4. 거래 로그 기록
    if (coupleId) {
      try {
        const txRef = collection(db, 'couples', coupleId, 'grapeTransactions');
        await addDoc(txRef, {
          userId: uid,
          type: 'spend',
          amount: -amount,
          reason,
          ...metadata,
          createdAt: new Date().toISOString(),
        });
      } catch (logError) {
        console.error('Transaction log error (spend):', logError);
      }
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('Spend grapes error:', error);
    return { data: null, error: error.message };
  }
};

// 포도판 생성
export const createGrapeBoard = async (coupleId, boardData) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const boardRef = collection(db, 'couples', coupleId, 'grapeBoards');
    const docRef = await addDoc(boardRef, {
      ...boardData,
      progress: 0,
      completed: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Create grape board error:', error);
    return { id: null, error: error.message };
  }
};

// 포도판 진행 업데이트 (낙관적 잠금)
export const updateGrapeBoardProgress = async (coupleId, boardId, uid, incrementAmount) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const result = await runTransaction(db, async (transaction) => {
      const boardRef = doc(db, 'couples', coupleId, 'grapeBoards', boardId);
      const boardSnap = await transaction.get(boardRef);

      if (!boardSnap.exists()) {
        throw new Error('포도판을 찾을 수 없습니다');
      }

      const boardData = boardSnap.data();
      if (boardData.completed) {
        throw new Error('이미 완료된 포도판입니다');
      }

      const newProgress = (boardData.progress || 0) + incrementAmount;
      const completed = newProgress >= boardData.goal;

      transaction.update(boardRef, {
        progress: newProgress,
        completed,
        version: (boardData.version || 0) + 1,
        updatedAt: new Date().toISOString(),
      });

      return { progress: newProgress, completed, goal: boardData.goal };
    });

    // 완료 시 보너스 포도 적립
    if (result.completed) {
      await earnGrapes(uid, coupleId, 5, 'grape_board_complete', { boardId });
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('Update grape board progress error:', error);
    return { data: null, error: error.message };
  }
};

// 포도판 수정
export const updateGrapeBoard = async (coupleId, boardId, updates) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    await runTransaction(db, async (transaction) => {
      const boardRef = doc(db, 'couples', coupleId, 'grapeBoards', boardId);
      const boardSnap = await transaction.get(boardRef);

      if (!boardSnap.exists()) {
        throw new Error('포도판을 찾을 수 없습니다');
      }

      transaction.update(boardRef, {
        ...updates,
        version: (boardSnap.data().version || 0) + 1,
        updatedAt: new Date().toISOString(),
      });
    });

    return { error: null };
  } catch (error) {
    console.error('Update grape board error:', error);
    return { error: error.message };
  }
};

// 포도판 삭제
export const deleteGrapeBoard = async (coupleId, boardId) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const { deleteDoc } = await import('./firebase');
    const boardRef = doc(db, 'couples', coupleId, 'grapeBoards', boardId);
    await deleteDoc(boardRef);
    return { error: null };
  } catch (error) {
    console.error('Delete grape board error:', error);
    return { error: error.message };
  }
};
