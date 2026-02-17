// Legacy firebase.js - 기존 호환성 유지를 위한 re-export
// 새 코드는 src/services/ 하위 모듈을 직접 import하세요.

import { auth, db, googleProvider } from './services/firebase';
import { signInWithGoogle, logOut, onAuthChange } from './services/authService';
import { getUserData, updateUserData } from './services/userService';
import { subscribeToUser } from './services/listenerService';

export { auth, db, googleProvider };
export { signInWithGoogle, logOut, onAuthChange };

// 기존 saveUserData 호환 (App.js에서 사용 중)
export const saveUserData = async (userId, data) => {
  return updateUserData(userId, data);
};

// 기존 getUserData 호환
export { getUserData };

// 기존 subscribeToUserData 호환
export const subscribeToUserData = (userId, callback) => {
  return subscribeToUser(userId, callback);
};
