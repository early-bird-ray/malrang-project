import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  setupCoupleListeners,
  teardownCoupleListeners,
  subscribeToMoodHistory,
  subscribeToAiTransformHistory,
} from '../services/listenerService';

const CoupleContext = createContext(null);

export function CoupleProvider({ children }) {
  const { uid, activeCoupleId } = useAuth();

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

  // 커플 리스너 설정
  useEffect(() => {
    if (!activeCoupleId) {
      // 커플 ID 없으면 데이터 초기화
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
      onGrapeBoardsUpdate: setGrapeBoards,
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

  // 내 쿠폰 (보낸 쿠폰)
  const mySentCoupons = coupons.filter(c => c.fromUid === uid);
  // 받은 쿠폰
  const myReceivedCoupons = coupons.filter(c => c.toUid === uid);

  const value = {
    // 커플 상태
    coupleData,
    activeCoupleId,
    isConnected: !!activeCoupleId && coupleData?.status === 'active',
    isPaused: coupleData?.status === 'paused',

    // 파트너
    partnerUid: getPartnerUid(),
    partnerProfile: getPartnerProfile(),

    // 공유 데이터
    grapeBoards,
    grapeTransactions,
    coupons,
    mySentCoupons,
    myReceivedCoupons,
    praises,
    chores,
    shopListings,
    voiceAnalyses,
    reports,

    // 개인 데이터
    moodHistory,
    aiTransformHistory,
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
