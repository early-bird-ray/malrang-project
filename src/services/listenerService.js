import {
  db,
  doc,
  collection,
  onSnapshot,
} from './firebase';

// 리스너 관리 클래스
class ListenerManager {
  constructor() {
    this.listeners = new Map();
  }

  // 리스너 등록
  add(key, unsubscribe) {
    // 기존 리스너가 있으면 해제
    this.remove(key);
    this.listeners.set(key, unsubscribe);
  }

  // 리스너 해제
  remove(key) {
    const unsub = this.listeners.get(key);
    if (unsub) {
      unsub();
      this.listeners.delete(key);
    }
  }

  // 모든 리스너 해제
  removeAll() {
    this.listeners.forEach((unsub) => unsub());
    this.listeners.clear();
  }

  // 특정 프리픽스로 시작하는 리스너 모두 해제
  removeByPrefix(prefix) {
    for (const [key, unsub] of this.listeners) {
      if (key.startsWith(prefix)) {
        unsub();
        this.listeners.delete(key);
      }
    }
  }
}

// 싱글톤 인스턴스
export const listenerManager = new ListenerManager();

// 유저 문서 실시간 구독
export const subscribeToUser = (uid, callback) => {
  if (!db) return () => {};

  const userRef = doc(db, 'users', uid);
  const unsubscribe = onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    }
  }, (error) => {
    console.error('User listener error:', error);
  });

  listenerManager.add(`user:${uid}`, unsubscribe);
  return unsubscribe;
};

// 커플 문서 실시간 구독
export const subscribeToCouple = (coupleId, callback) => {
  if (!db || !coupleId) return () => {};

  const coupleRef = doc(db, 'couples', coupleId);
  const unsubscribe = onSnapshot(coupleRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    }
  }, (error) => {
    console.error('Couple listener error:', error);
  });

  listenerManager.add(`couple:${coupleId}`, unsubscribe);
  return unsubscribe;
};

// 커플 서브컬렉션 실시간 구독 (범용)
const subscribeToCoupleSubcollection = (coupleId, subcollection, callback, sortField = 'createdAt') => {
  if (!db || !coupleId) return () => {};

  const colRef = collection(db, 'couples', coupleId, subcollection);
  const unsubscribe = onSnapshot(colRef, (snapshot) => {
    const items = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    items.sort((a, b) => (b[sortField] || '').localeCompare(a[sortField] || ''));
    callback(items);
  }, (error) => {
    console.error(`${subcollection} listener error:`, error);
  });

  listenerManager.add(`couple:${coupleId}:${subcollection}`, unsubscribe);
  return unsubscribe;
};

// 포도판 실시간 구독
export const subscribeToGrapeBoards = (coupleId, callback) => {
  return subscribeToCoupleSubcollection(coupleId, 'grapeBoards', callback);
};

// 포도 거래 로그 실시간 구독
export const subscribeToGrapeTransactions = (coupleId, callback) => {
  return subscribeToCoupleSubcollection(coupleId, 'grapeTransactions', callback);
};

// 쿠폰 실시간 구독
export const subscribeToCoupons = (coupleId, callback) => {
  return subscribeToCoupleSubcollection(coupleId, 'coupons', callback);
};

// 칭찬 실시간 구독
export const subscribeToPraises = (coupleId, callback) => {
  return subscribeToCoupleSubcollection(coupleId, 'praises', callback);
};

// 집안일 실시간 구독
export const subscribeToChores = (coupleId, callback) => {
  return subscribeToCoupleSubcollection(coupleId, 'chores', callback);
};

// 상점 등록 실시간 구독
export const subscribeToShopListings = (coupleId, callback) => {
  return subscribeToCoupleSubcollection(coupleId, 'shopListings', callback);
};

// 음성 분석 실시간 구독
export const subscribeToVoiceAnalyses = (coupleId, callback) => {
  return subscribeToCoupleSubcollection(coupleId, 'voiceAnalyses', callback);
};

// 리포트 실시간 구독
export const subscribeToReports = (coupleId, callback) => {
  return subscribeToCoupleSubcollection(coupleId, 'reports', callback);
};

// 개인 기분 기록 구독
export const subscribeToMoodHistory = (uid, callback) => {
  if (!db) return () => {};

  const moodRef = collection(db, 'users', uid, 'moodHistory');
  const unsubscribe = onSnapshot(moodRef, (snapshot) => {
    const moods = [];
    snapshot.forEach((doc) => {
      moods.push({ id: doc.id, ...doc.data() });
    });
    moods.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(moods);
  }, (error) => {
    console.error('Mood history listener error:', error);
  });

  listenerManager.add(`user:${uid}:moodHistory`, unsubscribe);
  return unsubscribe;
};

// 개인 AI 변환 기록 구독
export const subscribeToAiTransformHistory = (uid, callback) => {
  if (!db) return () => {};

  const historyRef = collection(db, 'users', uid, 'aiTransformHistory');
  const unsubscribe = onSnapshot(historyRef, (snapshot) => {
    const entries = [];
    snapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    entries.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(entries);
  }, (error) => {
    console.error('AI transform history listener error:', error);
  });

  listenerManager.add(`user:${uid}:aiTransformHistory`, unsubscribe);
  return unsubscribe;
};

// 커플 관련 모든 리스너 설정
export const setupCoupleListeners = (coupleId, callbacks) => {
  if (!coupleId) return;

  const {
    onCoupleUpdate,
    onGrapeBoardsUpdate,
    onGrapeTransactionsUpdate,
    onCouponsUpdate,
    onPraisesUpdate,
    onChoresUpdate,
    onShopListingsUpdate,
    onVoiceAnalysesUpdate,
    onReportsUpdate,
  } = callbacks;

  if (onCoupleUpdate) subscribeToCouple(coupleId, onCoupleUpdate);
  if (onGrapeBoardsUpdate) subscribeToGrapeBoards(coupleId, onGrapeBoardsUpdate);
  if (onGrapeTransactionsUpdate) subscribeToGrapeTransactions(coupleId, onGrapeTransactionsUpdate);
  if (onCouponsUpdate) subscribeToCoupons(coupleId, onCouponsUpdate);
  if (onPraisesUpdate) subscribeToPraises(coupleId, onPraisesUpdate);
  if (onChoresUpdate) subscribeToChores(coupleId, onChoresUpdate);
  if (onShopListingsUpdate) subscribeToShopListings(coupleId, onShopListingsUpdate);
  if (onVoiceAnalysesUpdate) subscribeToVoiceAnalyses(coupleId, onVoiceAnalysesUpdate);
  if (onReportsUpdate) subscribeToReports(coupleId, onReportsUpdate);
};

// 커플 관련 모든 리스너 해제
export const teardownCoupleListeners = (coupleId) => {
  if (!coupleId) return;
  listenerManager.removeByPrefix(`couple:${coupleId}`);
};
