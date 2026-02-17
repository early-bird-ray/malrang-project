import {
  db,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
} from './firebase';

// 초대 코드 생성 (MALL-XXXX 형식)
const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 문자 제외
  let code = 'MALL-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 유저 문서 생성 (최초 로그인 시)
export const createUserDocument = async (firebaseUser, displayName) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // 이미 존재하면 데이터 반환
      return { data: userSnap.data(), error: null, isNew: false };
    }

    // 초대 코드 생성 (중복 체크)
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const codeRef = doc(db, 'inviteCodes', inviteCode);
      const codeSnap = await getDoc(codeRef);
      if (!codeSnap.exists()) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || null,
      displayName: displayName || firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || null,
      language: 'ko',
      surveyCompleted: false,
      survey: {},
      grapePoints: 0,
      totalGrapesEarned: 0,
      mallangCredits: 0,
      activeCoupleId: null,
      coupleHistory: [],
      inviteCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 유저 문서 + 초대 코드 문서 동시 생성
    await setDoc(userRef, userData);
    await setDoc(doc(db, 'inviteCodes', inviteCode), {
      code: inviteCode,
      ownerUid: firebaseUser.uid,
      active: true,
      usedByUid: null,
      usedAt: null,
      createdAt: new Date().toISOString(),
    });

    return { data: userData, error: null, isNew: true };
  } catch (error) {
    console.error('Create user document error:', error);
    return { data: null, error: error.message };
  }
};

// 유저 데이터 읽기
export const getUserData = async (uid) => {
  if (!db) return { data: null, error: 'Firebase 미초기화' };

  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { data: docSnap.data(), error: null };
    }
    return { data: null, error: null };
  } catch (error) {
    console.error('Get user data error:', error);
    return { data: null, error: error.message };
  }
};

// 유저 데이터 업데이트
export const updateUserData = async (uid, data) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return { error: null };
  } catch (error) {
    console.error('Update user data error:', error);
    return { error: error.message };
  }
};

// 유저 실시간 구독
export const subscribeToUser = (uid, callback) => {
  if (!db) return () => {};
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    }
  });
};

// 설문 답변 저장
export const saveSurveyAnswers = async (uid, answers) => {
  return updateUserData(uid, {
    survey: answers,
    surveyCompleted: true,
  });
};

// 기분 기록 저장 (개인 서브컬렉션)
export const saveMoodEntry = async (uid, moodData) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const moodRef = collection(db, 'users', uid, 'moodHistory');
    const docRef = await addDoc(moodRef, {
      ...moodData,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Save mood entry error:', error);
    return { id: null, error: error.message };
  }
};

// 기분 기록 구독
export const subscribeToMoodHistory = (uid, callback) => {
  if (!db) return () => {};
  const moodRef = collection(db, 'users', uid, 'moodHistory');
  return onSnapshot(moodRef, (snapshot) => {
    const moods = [];
    snapshot.forEach((doc) => {
      moods.push({ id: doc.id, ...doc.data() });
    });
    moods.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(moods);
  });
};

// AI 변환 기록 저장 (개인 서브컬렉션)
export const saveAiTransformEntry = async (uid, coupleId, entry) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const historyRef = collection(db, 'users', uid, 'aiTransformHistory');
    const docRef = await addDoc(historyRef, {
      ...entry,
      coupleId: coupleId || null,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Save AI transform entry error:', error);
    return { id: null, error: error.message };
  }
};

// AI 변환 기록 구독
export const subscribeToAiTransformHistory = (uid, callback) => {
  if (!db) return () => {};
  const historyRef = collection(db, 'users', uid, 'aiTransformHistory');
  return onSnapshot(historyRef, (snapshot) => {
    const entries = [];
    snapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    entries.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(entries);
  });
};

// 고유 초대 코드 생성 (중복 체크 포함)
export const generateUniqueInviteCode = async () => {
  if (!db) return generateInviteCode(); // Firebase 없으면 로컬 생성

  let code = generateInviteCode();
  let attempts = 0;
  while (attempts < 10) {
    const codeRef = doc(db, 'inviteCodes', code);
    const codeSnap = await getDoc(codeRef);
    if (!codeSnap.exists()) break;
    code = generateInviteCode();
    attempts++;
  }
  return code;
};

// 초대 코드를 inviteCodes 컬렉션에 등록
export const registerInviteCode = async (code, ownerUid) => {
  if (!db) return;
  await setDoc(doc(db, 'inviteCodes', code), {
    code,
    ownerUid,
    active: true,
    usedByUid: null,
    usedAt: null,
    createdAt: new Date().toISOString(),
  });
};

// 초대 코드로 유저 조회
export const lookupInviteCode = async (code) => {
  if (!db) return { data: null, error: 'Firebase 미초기화' };

  try {
    const codeRef = doc(db, 'inviteCodes', code.toUpperCase());
    const codeSnap = await getDoc(codeRef);
    if (codeSnap.exists()) {
      return { data: codeSnap.data(), error: null };
    }
    return { data: null, error: '유효하지 않은 초대 코드입니다' };
  } catch (error) {
    console.error('Lookup invite code error:', error);
    return { data: null, error: error.message };
  }
};
