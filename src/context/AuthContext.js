import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange } from '../services/authService';
import { createUserDocument, getUserData } from '../services/userService';
import { subscribeToUser } from '../services/listenerService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);       // Firebase Auth user
  const [userData, setUserData] = useState(null);        // Firestore user document
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser = () => {};

    // 3초 타임아웃 - Firebase 연결 실패해도 앱 진행
    const timeout = setTimeout(() => {
      setAuthLoading(false);
    }, 3000);

    const unsubscribeAuth = onAuthChange(async (firebaseUser) => {
      clearTimeout(timeout);

      if (firebaseUser) {
        setAuthUser(firebaseUser);

        // 유저 문서 확인/생성
        try {
          const { data } = await createUserDocument(firebaseUser);
          if (data) {
            setUserData(data);
          }
        } catch (e) {
          console.error('Failed to create/load user document:', e);
          // 기존 데이터라도 불러오기
          const { data } = await getUserData(firebaseUser.uid);
          if (data) setUserData(data);
        }

        // 실시간 구독 시작
        unsubscribeUser = subscribeToUser(firebaseUser.uid, (data) => {
          setUserData(data);
        });
      } else {
        setAuthUser(null);
        setUserData(null);
        unsubscribeUser();
      }
      setAuthLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribeAuth();
      unsubscribeUser();
    };
  }, []);

  const value = {
    authUser,
    userData,
    setUserData,
    authLoading,
    uid: authUser?.uid || null,
    isAuthenticated: !!authUser,
    activeCoupleId: userData?.activeCoupleId || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
