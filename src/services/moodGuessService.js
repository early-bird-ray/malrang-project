import {
  db,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from './firebase';

export const submitGuess = async (coupleId, dateStr, guesserUid, targetUid, guessedMood) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const guessRef = doc(db, 'couples', coupleId, 'moodGuesses', dateStr);
    await setDoc(guessRef, {
      guesserUid,
      targetUid,
      guessedMood,
      actualMood: null,
      isCorrect: null,
      guessedAt: new Date().toISOString(),
      revealedAt: null,
    });

    return { error: null };
  } catch (error) {
    console.error('Submit guess error:', error);
    return { error: error.message };
  }
};

export const revealGuess = async (coupleId, dateStr, actualMood) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const guessRef = doc(db, 'couples', coupleId, 'moodGuesses', dateStr);
    const snap = await getDoc(guessRef);

    if (!snap.exists()) {
      return { data: null, error: null };
    }

    const guessData = snap.data();
    if (guessData.actualMood !== null) {
      return { data: guessData, error: null };
    }

    const isCorrect = guessData.guessedMood === actualMood;
    await setDoc(guessRef, {
      actualMood,
      isCorrect,
      revealedAt: new Date().toISOString(),
    }, { merge: true });

    return { data: { ...guessData, actualMood, isCorrect }, error: null };
  } catch (error) {
    console.error('Reveal guess error:', error);
    return { data: null, error: error.message };
  }
};

export const subscribeTodayGuess = (coupleId, dateStr, callback) => {
  if (!db || !coupleId || !dateStr) return () => {};

  const guessRef = doc(db, 'couples', coupleId, 'moodGuesses', dateStr);
  const unsubscribe = onSnapshot(guessRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Mood guess listener error:', error);
  });

  return unsubscribe;
};
