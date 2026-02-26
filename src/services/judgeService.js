import {
  db,
  collection,
  addDoc,
  onSnapshot,
} from './firebase';

// 갈등심판 결과 저장
export const saveJudgeRecord = async (coupleId, uid, record) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const colRef = collection(db, 'couples', coupleId, 'judgeRecords');
    const docRef = await addDoc(colRef, {
      ...record,
      uid,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Save judge record error:', error);
    return { id: null, error: error.message };
  }
};

// 갈등심판 기록 실시간 리스너
export const subscribeToJudgeRecords = (coupleId, callback) => {
  if (!db || !coupleId) return () => {};

  const colRef = collection(db, 'couples', coupleId, 'judgeRecords');
  const unsubscribe = onSnapshot(colRef, (snapshot) => {
    const records = [];
    snapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() });
    });
    records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(records);
  }, (error) => {
    console.error('Judge records listener error:', error);
  });

  return unsubscribe;
};
