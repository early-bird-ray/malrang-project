import {
  db,
  collection,
  addDoc,
} from './firebase';
import { earnGrapes } from './grapeService';

// 칭찬 생성 + 포도 적립
export const createPraise = async (coupleId, fromUid, toUid, message, grapeReward = 3) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const praiseRef = collection(db, 'couples', coupleId, 'praises');
    const docRef = await addDoc(praiseRef, {
      fromUid,
      toUid,
      message,
      grapes: grapeReward,
      createdAt: new Date().toISOString(),
    });

    // 보낸 사람에게 포도 적립
    if (grapeReward > 0) {
      await earnGrapes(fromUid, coupleId, grapeReward, 'praise_sent', {
        praiseId: docRef.id,
        toUid,
      });
    }

    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Create praise error:', error);
    return { id: null, error: error.message };
  }
};
