import {
  db,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
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
    const questionData = DAILY_QUESTIONS[questionIndex];

    const newQuestion = {
      questionIndex,
      questionText: questionData.q,
      options: questionData.o,
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

export const submitPrediction = async (coupleId, dateStr, uid, text) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const questionRef = doc(db, 'couples', coupleId, 'dailyQuestions', dateStr);
    await setDoc(questionRef, {
      predictions: {
        [uid]: {
          text,
          predictedAt: new Date().toISOString(),
        },
      },
    }, { merge: true });

    return { error: null };
  } catch (error) {
    console.error('Submit prediction error:', error);
    return { error: error.message };
  }
};

export const getPastAnswers = async (coupleId, questionIndex) => {
  if (!db) return { data: [], error: 'Firebase 미초기화' };

  try {
    const colRef = collection(db, 'couples', coupleId, 'dailyQuestions');
    const q = query(colRef, where('questionIndex', '==', questionIndex));
    const snapshot = await getDocs(q);

    const results = [];
    snapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    // 날짜순 정렬 (id가 dateStr)
    results.sort((a, b) => a.id.localeCompare(b.id));
    return { data: results, error: null };
  } catch (error) {
    console.error('Get past answers error:', error);
    return { data: [], error: error.message };
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
