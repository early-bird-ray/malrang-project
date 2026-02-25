import {
  db,
  doc,
  runTransaction,
} from './firebase';

export const updateStreak = async (coupleId) => {
  if (!db || !coupleId) return { data: null, error: 'Firebase 미초기화' };

  try {
    const result = await runTransaction(db, async (transaction) => {
      const coupleRef = doc(db, 'couples', coupleId);
      const coupleSnap = await transaction.get(coupleRef);

      if (!coupleSnap.exists()) {
        throw new Error('커플 정보를 찾을 수 없습니다');
      }

      const data = coupleSnap.data();
      const streak = data.streak || { current: 0, longest: 0, lastActiveDate: '' };

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      if (streak.lastActiveDate === today) {
        return streak;
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      let newCurrent;
      if (streak.lastActiveDate === yesterdayStr) {
        newCurrent = (streak.current || 0) + 1;
      } else {
        newCurrent = 1;
      }

      const newLongest = Math.max(newCurrent, streak.longest || 0);

      const newStreak = {
        current: newCurrent,
        longest: newLongest,
        lastActiveDate: today,
      };

      transaction.update(coupleRef, { streak: newStreak });

      return newStreak;
    });

    return { data: result, error: null };
  } catch (error) {
    console.error('Update streak error:', error);
    return { data: null, error: error.message };
  }
};
