import {
  db,
  doc,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  getDocs,
} from './firebase';

// 몰래 한마디 보내기
export const sendSecretMessage = async (coupleId, fromUid, toUid, message) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    // 오늘 이미 보냈는지 체크
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const colRef = collection(db, 'couples', coupleId, 'secretMessages');
    const q = query(colRef, where('fromUid', '==', fromUid), where('dateStr', '==', dateStr));
    const existing = await getDocs(q);

    if (!existing.empty) {
      return { error: '오늘은 이미 몰래 한마디를 보냈어요!' };
    }

    const docRef = await addDoc(colRef, {
      fromUid,
      toUid,
      message,
      isRead: false,
      readAt: null,
      dateStr,
      createdAt: new Date().toISOString(),
    });

    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Send secret message error:', error);
    return { id: null, error: error.message };
  }
};

// 몰래 한마디 읽음 처리
export const markAsRead = async (coupleId, messageId) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const msgRef = doc(db, 'couples', coupleId, 'secretMessages', messageId);
    await updateDoc(msgRef, {
      isRead: true,
      readAt: new Date().toISOString(),
    });

    return { error: null };
  } catch (error) {
    console.error('Mark as read error:', error);
    return { error: error.message };
  }
};

// 몰래 한마디 실시간 리스너
export const subscribeToSecretMessages = (coupleId, callback) => {
  if (!db || !coupleId) return () => {};

  const colRef = collection(db, 'couples', coupleId, 'secretMessages');
  const unsubscribe = onSnapshot(colRef, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    messages.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(messages);
  }, (error) => {
    console.error('Secret messages listener error:', error);
  });

  return unsubscribe;
};
