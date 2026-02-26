import {
  db,
  collection,
  addDoc,
} from './firebase';
import { earnHearts } from './heartService';

// 칭찬 생성 + 하트 적립 (원자적)
export const createPraise = async (coupleId, fromUid, toUid, message, heartReward = 1) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const praiseRef = collection(db, 'couples', coupleId, 'praises');
    const docRef = await addDoc(praiseRef, {
      fromUid,
      toUid,
      message,
      hearts: heartReward,
      createdAt: new Date().toISOString(),
    });

    // 보낸 사람에게 하트 적립
    if (heartReward > 0) {
      await earnHearts(fromUid, coupleId, heartReward, 'praise_send', {
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
