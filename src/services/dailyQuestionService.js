import {
  db,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from './firebase';
import { DAILY_QUESTIONS, getDailyQuestionIndex } from '../constants/dailyQuestions';

export const getTodayQuestion = async (coupleId, dateStr) => {
  if (!db) return { data: null, error: 'Firebase 미초기화' };

  try {
    const questionRef = doc(db, 'couples', coupleId, 'dailyQuestions', dateStr);
    const snap = await getDoc(questionRef);

    if (snap.exists()) {
      return { data: { id: snap.id, ...snap.data() }, error: null };
    }

    const questionIndex = getDailyQuestionIndex(coupleId, dateStr);
    const questionText = DAILY_QUESTIONS[questionIndex];

    const newQuestion = {
      questionIndex,
      questionText,
      answers: {},
      createdAt: new Date().toISOString(),
    };

    await setDoc(questionRef, newQuestion);
    return { data: { id: dateStr, ...newQuestion }, error: null };
  } catch (error) {
    console.error('Get today question error:', error);
    return { data: null, error: error.message };
  }
};

export const submitAnswer = async (coupleId, dateStr, uid, text) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const questionRef = doc(db, 'couples', coupleId, 'dailyQuestions', dateStr);
    await setDoc(questionRef, {
      answers: {
        [uid]: {
          text,
          answeredAt: new Date().toISOString(),
        },
      },
    }, { merge: true });

    return { error: null };
  } catch (error) {
    console.error('Submit answer error:', error);
    return { error: error.message };
  }
};

export const subscribeToDailyQuestion = (coupleId, dateStr, callback) => {
  if (!db || !coupleId || !dateStr) return () => {};

  const questionRef = doc(db, 'couples', coupleId, 'dailyQuestions', dateStr);
  const unsubscribe = onSnapshot(questionRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Daily question listener error:', error);
  });

  return unsubscribe;
};
