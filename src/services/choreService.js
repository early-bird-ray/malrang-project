import {
  db,
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from './firebase';
import { earnGrapes } from './grapeService';

// 집안일 생성
export const createChore = async (coupleId, uid, choreData) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const choreRef = collection(db, 'couples', coupleId, 'chores');
    const docRef = await addDoc(choreRef, {
      ...choreData,
      createdByUid: uid,
      completed: false,
      completedAt: null,
      completedByUid: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Create chore error:', error);
    return { id: null, error: error.message };
  }
};

// 집안일 완료 토글 + 포도 적립
export const toggleChoreComplete = async (coupleId, choreId, uid, grapeReward = 2) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const choreRef = doc(db, 'couples', coupleId, 'chores', choreId);
    const choreSnap = await getDoc(choreRef);

    if (!choreSnap.exists()) {
      return { error: '할 일을 찾을 수 없습니다' };
    }

    const choreData = choreSnap.data();
    const wasCompleted = choreData.completed;
    const now = new Date().toISOString();

    await updateDoc(choreRef, {
      completed: !wasCompleted,
      completedAt: !wasCompleted ? now : null,
      completedByUid: !wasCompleted ? uid : null,
      updatedAt: now,
    });

    // 완료 시 포도 적립
    if (!wasCompleted && grapeReward > 0) {
      await earnGrapes(uid, coupleId, grapeReward, 'chore_complete', {
        choreId,
        choreTitle: choreData.title || choreData.text,
      });
    }

    return { completed: !wasCompleted, error: null };
  } catch (error) {
    console.error('Toggle chore complete error:', error);
    return { completed: null, error: error.message };
  }
};

// 집안일 수정
export const updateChore = async (coupleId, choreId, updates) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const choreRef = doc(db, 'couples', coupleId, 'chores', choreId);
    await updateDoc(choreRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return { error: null };
  } catch (error) {
    console.error('Update chore error:', error);
    return { error: error.message };
  }
};

// 집안일 삭제
export const deleteChore = async (coupleId, choreId) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const choreRef = doc(db, 'couples', coupleId, 'chores', choreId);
    await deleteDoc(choreRef);
    return { error: null };
  } catch (error) {
    console.error('Delete chore error:', error);
    return { error: error.message };
  }
};
