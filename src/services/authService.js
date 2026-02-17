import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

// 구글 로그인
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    return { user: null, error: 'Firebase가 초기화되지 않았습니다' };
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { user: null, error: error.message };
  }
};

// 로그아웃
export const logOut = async () => {
  if (!auth) return { error: null };
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Auth 상태 변화 감지
export const onAuthChange = (callback) => {
  if (!auth) {
    setTimeout(() => callback(null), 0);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
