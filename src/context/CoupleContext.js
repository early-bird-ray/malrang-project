import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  setupCoupleListeners,
  teardownCoupleListeners,
  subscribeToMoodHistory,
  subscribeToAiTransformHistory,
  subscribeToUser,
} from '../services/listenerService';
import { subscribeToDailyQuestion, getTodayQuestion } from '../services/dailyQuestionService';

const CoupleContext = createContext(null);

export function CoupleProvider({ children }) {
  const { uid, userData, activeCoupleId } = useAuth();

  // 커플 공유 데이터
  const [coupleData, setCoupleData] = useState(null);
  const [grapeBoards, setGrapeBoards] = useState([]);
  const [grapeTransactions, setGrapeTransactions] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [praises, setPraises] = useState([]);
  const [chores, setChores] = useState([]);
  const [shopListings, setShopListings] = useState([]);
  const [voiceAnalyses, setVoiceAnalyses] = useState([]);
  const [reports, setReports] = useState([]);

  // 개인 데이터
  const [moodHistory, setMoodHistory] = useState([]);
  const [aiTransformHistory, setAiTransformHistory] = useState([]);

  // 파트너 설문 데이터
  const [partnerUserData, setPartnerUserData] = useState(null);

  // 오늘의 커플 질문
  const [dailyQuestion, setDailyQuestion] = useState(null);

  // 파트너 기분 기록
  const [partnerMoodHistory, setPartnerMoodHistory] = useState([]);

  // 파트너 정보
  const getPartnerUid = useCallback(() => {
    if (!coupleData || !uid) return null;
    return coupleData.members.find(m => m !== uid) || null;
  }, [coupleData, uid]);

  const getPartnerProfile = useCallback(() => {
    const partnerUid = getPartnerUid();
    if (!partnerUid || !coupleData?.memberProfiles) return null;
    return coupleData.memberProfiles[partnerUid] || null;
  }, [coupleData, getPartnerUid]);

  const partnerUid = getPartnerUid();
  const partnerProfile = getPartnerProfile();

  // 파트너 표시 이름
  const partnerDisplayName = useMemo(() => {
    if (partnerProfile?.displayName) return partnerProfile.displayName;
    return '짝꿍';
  }, [partnerProfile]);

  // 내 표시 이름
  const myDisplayName = useMemo(() => {
    return userData?.displayName || '나';
  }, [userData]);

  // 커플 리스너 설정
  useEffect(() => {
    if (!activeCoupleId) {
      setCoupleData(null);
      setGrapeBoards([]);
      setGrapeTransactions([]);
      setCoupons([]);
      setPraises([]);
      setChores([]);
      setShopListings([]);
      setVoiceAnalyses([]);
      setReports([]);
      return;
    }

    setupCoupleListeners(activeCoupleId, {
      onCoupleUpdate: setCoupleData,
      // 포도판: current 필드 정규화
      onGrapeBoardsUpdate: (boards) => {
        setGrapeBoards(boards.map(b => ({ ...b, current: b.progress || b.current || 0 })));
      },
      onGrapeTransactionsUpdate: setGrapeTransactions,
      onCouponsUpdate: setCoupons,
      onPraisesUpdate: setPraises,
      onChoresUpdate: setChores,
      onShopListingsUpdate: setShopListings,
      onVoiceAnalysesUpdate: setVoiceAnalyses,
      onReportsUpdate: setReports,
    });

    return () => {
      teardownCoupleListeners(activeCoupleId);
    };
  }, [activeCoupleId]);

  // 개인 데이터 리스너
  useEffect(() => {
    if (!uid) {
      setMoodHistory([]);
      setAiTransformHistory([]);
      return;
    }

    const unsubMood = subscribeToMoodHistory(uid, setMoodHistory);
    const unsubAi = subscribeToAiTransformHistory(uid, setAiTransformHistory);

    return () => {
      unsubMood();
      unsubAi();
    };
  }, [uid]);

  // 오늘의 커플 질문 리스너
  useEffect(() => {
    if (!activeCoupleId) {
      setDailyQuestion(null);
      return;
    }

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 오늘 질문 문서가 없으면 생성
    getTodayQuestion(activeCoupleId, today);

    const unsubQuestion = subscribeToDailyQuestion(activeCoupleId, today, setDailyQuestion);

    return () => {
      unsubQuestion();
    };
  }, [activeCoupleId]);

  // 파트너 기분 기록 리스너
  useEffect(() => {
    if (!partnerUid) {
      setPartnerMoodHistory([]);
      return;
    }

    const unsubPartnerMood = subscribeToMoodHistory(partnerUid, setPartnerMoodHistory);

    return () => {
      unsubPartnerMood();
    };
  }, [partnerUid]);

  // 파트너 유저 문서 구독 (설문 데이터용)
  useEffect(() => {
    if (!partnerUid) {
      setPartnerUserData(null);
      return;
    }

    const unsubscribe = subscribeToUser(partnerUid, (data) => {
      if (data) setPartnerUserData(data);
    });

    return () => unsubscribe();
  }, [partnerUid]);

  // 쿠폰: fromUid → 이름 매핑
  const mappedCoupons = useMemo(() => {
    return coupons.map(c => ({
      ...c,
      from: c.fromUid === uid ? (myDisplayName) : partnerDisplayName,
      to: c.toUid === uid ? (myDisplayName) : partnerDisplayName,
    }));
  }, [coupons, uid, myDisplayName, partnerDisplayName]);

  // 칭찬: fromUid → 이름 + createdAt → 한국어 날짜 포맷
  const mappedPraises = useMemo(() => {
    return praises.map(p => ({
      ...p,
      from: p.fromUid === uid ? (myDisplayName) : partnerDisplayName,
      date: p.createdAt
        ? new Date(p.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })
        : p.date,
    }));
  }, [praises, uid, myDisplayName, partnerDisplayName]);

  // 내 쿠폰 (보낸 쿠폰)
  const mySentCoupons = mappedCoupons.filter(c => c.fromUid === uid);
  // 받은 쿠폰
  const myReceivedCoupons = mappedCoupons.filter(c => c.toUid === uid);

  // 파트너 설문 데이터
  const partnerSurvey = useMemo(() => {
    if (!partnerUserData?.survey || Object.keys(partnerUserData.survey).length === 0) return null;
    return partnerUserData.survey;
  }, [partnerUserData]);

  const partnerSurveyCompleted = !!partnerUserData?.surveyCompleted;

  const value = {
    // 커플 상태
    coupleData,
    activeCoupleId,
    isConnected: !!activeCoupleId && coupleData?.status === 'active',
    isPaused: coupleData?.status === 'paused',

    // 파트너
    partnerUid,
    partnerProfile,
    partnerDisplayName,

    // 파트너 설문
    partnerSurvey,
    partnerSurveyCompleted,

    // 공유 데이터 (변환 적용됨)
    grapeBoards,
    grapeTransactions,
    coupons: mappedCoupons,
    mySentCoupons,
    myReceivedCoupons,
    praises: mappedPraises,
    chores,
    shopListings,
    voiceAnalyses,
    reports,

    // 개인 데이터
    moodHistory,
    aiTransformHistory,

    // 스트릭
    streak: coupleData?.streak || { current: 0, longest: 0 },

    // 오늘의 커플 질문
    dailyQuestion,

    // 파트너 기분 기록
    partnerMoodHistory,
  };

  return (
    <CoupleContext.Provider value={value}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple() {
  const context = useContext(CoupleContext);
  if (!context) {
    throw new Error('useCouple must be used within a CoupleProvider');
  }
  return context;
}

export default CoupleContext;
