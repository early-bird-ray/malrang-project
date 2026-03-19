import { useState, useEffect, useCallback, useRef } from "react";
import {
  Heart, MessageCircle, Home, BarChart3,
  ChevronRight, ChevronLeft, Copy, Share2, Check, X, Plus,
  Gift, Sparkles, Ticket,
  Send, Bell, Settings,
  RefreshCw,
  Trash2, LogOut
} from "lucide-react";
import { signInWithGoogle, signInWithApple, logOut, saveUserData } from "./firebase";
import { earnGrapes, spendGrapes, createGrapeBoard, updateGrapeBoard, updateGrapeBoardProgress, deleteGrapeBoard } from "./services/grapeService";
import { submitAnswer, submitPrediction, getPastAnswers } from "./services/dailyQuestionService";
import { sendSecretMessage, markAsRead } from "./services/secretMessageService";
import { updateStreak } from "./services/streakService";
import { trackScreenView, trackFeatureUse } from "./services/analyticsService";
import { saveAiTransformEntry, updateUserData, generateUniqueInviteCode, registerInviteCode, saveMoodEntry } from "./services/userService";
import { createCoupon, sendCoupon, useCoupon as markCouponUsed, undoUseCoupon, updateCoupon, deleteCoupon, createShopListing, deleteShopListing } from "./services/couponService";
import { createPair, dissolvePair } from "./services/pairService";
import { createPraise } from "./services/praiseService";
import { useAuth } from "./context/AuthContext";
import { useCouple } from "./context/CoupleContext";
import { LANGS, LANG_LABELS, i18n } from "./constants/i18n";
import { colors } from "./constants/colors";
import { MOCK_USER, MOCK_CHORES, MOCK_GIFTS } from "./constants/mockData";

// 컴포넌트 imports
import CouponIcon from "./components/CouponIcon";
import Toast from "./components/Toast";
import GrapeCluster from "./components/GrapeCluster";
import OnboardingScreen from "./components/OnboardingScreen";
import DailyQuestionCard from "./components/DailyQuestionCard";
import StreakBadge from "./components/StreakBadge";
import CoupleMoodCard from "./components/CoupleMoodCard";
import SecretMessageCard from "./components/SecretMessageCard";


// ─── Main App ─────────────────────────────────────────────
export default function MallangApp() {
  // Auth/Couple Context (단일 데이터 소스)
  const { authUser, userData: ctxUserData, authLoading } = useAuth();
  const {
    grapeBoards: ctxBoards,
    coupons: ctxCoupons,
    praises: ctxPraises,
    chores: ctxChores,
    shopListings: ctxShopListings,
    moodHistory: ctxMoodHistory,
    aiTransformHistory: ctxAiHistory,
    partnerUid: ctxPartnerUid,
    partnerProfile: ctxPartnerProfile,
    partnerSurvey: ctxPartnerSurvey,
    partnerSurveyCompleted: ctxPartnerSurveyCompleted,
    streak: ctxStreak,
    dailyQuestion: ctxDailyQuestion,
    partnerMoodHistory: ctxPartnerMoodHistory,
    activeCoupleId: ctxActiveCoupleId,
    secretMessages: ctxSecretMessages,
    unreadSecretMessage: ctxUnreadSecretMessage,
    judgeRecords: ctxJudgeRecords,
    grapeTransactions: ctxGrapeTransactions,
  } = useCouple();

  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // 오프라인/온라인 감지
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // 안드로이드 뒤로가기 상태
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // localStorage에서 데이터 로드 (초기화 함수)
  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(`mallang_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // 이미 로그인한 유저(이름 있음)면 스플래시 없이 바로 홈
  const [screen, setScreen] = useState(() => {
    try {
      const saved = localStorage.getItem("mallang_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u.name) return "main";
      }
    } catch {}
    return "splash";
  });
  const [lang, setLang] = useState("ko");
  const t = (key) => (i18n[key] && i18n[key][lang]) || (i18n[key] && i18n[key]["ko"]) || key;

  const [tab, setTab] = useState(() => {
    try { const s = localStorage.getItem("mallang_tab"); if (s && ["home","grape","shop","coupon","report"].includes(s)) return s; } catch {} return "home";
  });
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [user, setUser] = useState(() => loadFromStorage("user", MOCK_USER));

  // 오늘의 기분 관련 state
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [moodHistory, setMoodHistory] = useState(() => loadFromStorage("moodHistory", []));
  const moodPopupShownRef = useRef(false);
  const streakUpdatedRef = useRef(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [welcomePartnerCode, setWelcomePartnerCode] = useState("");
  const [showSkipCodeConfirm, setShowSkipCodeConfirm] = useState(false);
  const [savedSurveyAnswers, setSavedSurveyAnswers] = useState(() => loadFromStorage("surveyAnswers", {}));
  const [chores, setChores] = useState(() => loadFromStorage("chores", MOCK_CHORES));
  const [showConflictInput, setShowConflictInput] = useState(false);
  const [showSurveyPrompt, setShowSurveyPrompt] = useState(false);
  const [conflictText, setConflictText] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [conversationHistory, setConversationHistory] = useState(() => loadFromStorage("conversationHistory", [])); // 대화 변환 기록
  const [showConversationHistory, setShowConversationHistory] = useState(false); // 기록 보기 모달
  const [praiseText, setPraiseText] = useState("");
  const [praiseLog, setPraiseLog] = useState(() => loadFromStorage("praiseLog", []));
  const [hideCompletedBoards, setHideCompletedBoards] = useState(false);
  const [giftFilter, setGiftFilter] = useState("전체");
  const [showAdModal, setShowAdModal] = useState(false);
  const [adModalType, setAdModalType] = useState("support"); // "support" | "unlock"
  const [adProgress, setAdProgress] = useState(0);
  const [adWatching, setAdWatching] = useState(false);
  const [adRound, setAdRound] = useState(1); // 1 or 2
  const [reportFreeUsed, setReportFreeUsed] = useState(false); // first view is free
  const [basicReportExpand, setBasicReportExpand] = useState(null); // 'grape'|'praise'|'predict'|null
  const [reportTodayUnlocked, setReportTodayUnlocked] = useState(false); // unlocked for this session
  const [voiceUnlocked, setVoiceUnlocked] = useState(false); // 대화 분석 잠금 해제
  const [judgeUnlocked, setJudgeUnlocked] = useState(false); // 갈등 심판 잠금 해제
  const [judgeText, setJudgeText] = useState(""); // 갈등 심판 입력 텍스트
  const [judgeResult, setJudgeResult] = useState(null); // 갈등 심판 결과
  const [judgeAnalyzing, setJudgeAnalyzing] = useState(false); // 갈등 심판 분석 중
  const [judgeTargetType, setJudgeTargetType] = useState(null); // 'partner' | 'other' | null
  const [transformTargetType, setTransformTargetType] = useState(null); // 'partner' | 'other' | null
  const [showGuideModal, setShowGuideModal] = useState(false); // 지표 가이드 모달
  const [selectedReportMonth, setSelectedReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }); // 심화 보고서 월 선택 (YYYY-MM 형식)
  const [selectedGift, setSelectedGift] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [streakCalendarMonth, setStreakCalendarMonth] = useState(() => {
    const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() + 1 };
  });
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [settingsTab, setSettingsTab] = useState("main"); // "main" | "taste"
  const [likedWords, setLikedWords] = useState("괜찮아, 고마워, 같이 하자");
  const [dislikedWords, setDislikedWords] = useState("알아서 해, 또?, 맨날 그러네");
  const [grapeBoards, setGrapeBoards] = useState(() => loadFromStorage("grapeBoards", []));
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [editBoard, setEditBoard] = useState(null); // null or board object being edited
  const [newBoard, setNewBoard] = useState({ title: "", goal: 20, perSuccess: 2, owner: "우리" });
  const [animatingBoardId, setAnimatingBoardId] = useState(null);
  const [grapeSubTab, setGrapeSubTab] = useState("grape"); // "grape" | "praise"
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoAssignee, setNewTodoAssignee] = useState([]);
  const [newTodoType, setNewTodoType] = useState("once"); // "routine" | "once"
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [editTodoId, setEditTodoId] = useState(null); // 할일 수정 모드
  const [confirmDeleteTodo, setConfirmDeleteTodo] = useState(null); // 할일 삭제 확인
  // homeTopTab removed in home redesign (standalone sections)
  const [homeExpandedCard, setHomeExpandedCard] = useState(null); // null | "secret" | "question" | "mood" | "praise"
  const [homeTappedToday, setHomeTappedToday] = useState(() => {
    try {
      const saved = localStorage.getItem('mallang_homeTapped');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toISOString().slice(0, 10)) return parsed.keys || {};
      }
    } catch {}
    return {};
  });
  const [newTodoDays, setNewTodoDays] = useState(["월","화","수","목","금","토","일"]);
  const [myCoupons, setMyCoupons] = useState(() => loadFromStorage("myCoupons", []));
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardBoardTitle, setRewardBoardTitle] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCouponCreate, setShowCouponCreate] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ title: "", desc: "", expiry: "" });
  const [newCouponGrapes, setNewCouponGrapes] = useState(10);
  const [praisePage, setPraisePage] = useState(0);
  const [couponCreateMode, setCouponCreateMode] = useState("personal"); // "personal" | "shop"
  const [shopCoupons, setShopCoupons] = useState(() => loadFromStorage("shopCoupons", []));
  const [selectedShopCoupon, setSelectedShopCoupon] = useState(null);
  const [confirmDeleteShopCoupon, setConfirmDeleteShopCoupon] = useState(null);
  const [confirmDeleteCoupon, setConfirmDeleteCoupon] = useState(null);
  const [sentCouponFilter, setSentCouponFilter] = useState("전체");
  const [confirmSendCoupon, setConfirmSendCoupon] = useState(null);
  const [reportSubTab, setReportSubTab] = useState(() => {
    try { const s = localStorage.getItem("mallang_reportSubTab"); if (s && ["report","voice","judge","advanced"].includes(s)) return s; } catch {} return "report";
  });
  const [voiceFile, setVoiceFile] = useState(null);
  const [voiceAnalyzing, setVoiceAnalyzing] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null); // "전체" | "사용" | "미사용"
  const [editCouponId, setEditCouponId] = useState(null);
  const [couponViewTab, setCouponViewTab] = useState("sent"); // "sent" | "received"
  const [confirmDeleteBoard, setConfirmDeleteBoard] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [aiWeeklyTip, setAiWeeklyTip] = useState(null);
  const [aiReportInsight, setAiReportInsight] = useState(null);
  const [showPartnerRequiredPopup, setShowPartnerRequiredPopup] = useState(false);
  const [partnerRequiredAction, setPartnerRequiredAction] = useState(""); // "praise" | "coupon"
  const [editPraiseId, setEditPraiseId] = useState(null);
  const [editPraiseText, setEditPraiseText] = useState("");
  const [confirmDeletePraise, setConfirmDeletePraise] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2200);
  };

  const partnerDisplayName = user.partnerConnected && user.partnerName ? user.partnerName : t("partnerDefault");

  // 초대 코드 생성 함수 (중복 체크 포함, 한 번 생성되면 고정)
  const generateInviteCodeOnce = useCallback(async () => {
    const newCode = await generateUniqueInviteCode();
    setUser(u => ({ ...u, inviteCode: newCode }));
    if (authUser) {
      await updateUserData(authUser.uid, { inviteCode: newCode });
      await registerInviteCode(newCode, authUser.uid);
    }
    return newCode;
  }, [authUser]);

  // 초대 코드 없으면 자동 생성 (한 번만)
  useEffect(() => {
    if (!user.inviteCode && user.name && authUser) {
      (async () => {
        const code = await generateUniqueInviteCode();
        setUser(u => {
          if (u.inviteCode) return u; // 이미 생성됨
          return { ...u, inviteCode: code };
        });
        await updateUserData(authUser.uid, { inviteCode: code });
        await registerInviteCode(code, authUser.uid);
      })();
    }
  }, [user.name, user.inviteCode, authUser]);
  const reportUnlocked = reportTodayUnlocked; // 포도알 10개 결제 필요

  // AuthContext의 userData 최초 도착 시 레거시 데이터 로딩 + 화면 전환
  const legacyLoadedRef = useRef(false);
  useEffect(() => {
    if (!ctxUserData || legacyLoadedRef.current) return;
    legacyLoadedRef.current = true;

    // 레거시 데이터 호환 (user doc에 직접 저장된 배열 데이터)
    if (ctxUserData.chores) setChores(ctxUserData.chores);
    if (ctxUserData.praiseLog) setPraiseLog(ctxUserData.praiseLog);
    if (ctxUserData.grapeBoards) setGrapeBoards(ctxUserData.grapeBoards);
    if (ctxUserData.myCoupons) setMyCoupons(ctxUserData.myCoupons);
    if (ctxUserData.shopCoupons) setShopCoupons(ctxUserData.shopCoupons);
    if (ctxUserData.moodHistory) setMoodHistory(ctxUserData.moodHistory);
    if (ctxUserData.conversationHistory) setConversationHistory(ctxUserData.conversationHistory);
    if (ctxUserData.savedSurveyAnswers || ctxUserData.survey) {
      setSavedSurveyAnswers(ctxUserData.savedSurveyAnswers || ctxUserData.survey || {});
    }
    // 닉네임이 이미 있으면 welcome 생략하고 바로 main으로
    if (ctxUserData.displayName && ctxUserData.displayName.trim()) {
      setScreen("main");
    }
  }, [ctxUserData]);

  // ─── Context → 로컬 state 동기화 브릿지 ───
  // (CoupleContext/AuthContext가 단일 데이터 소스, 기존 로컬 state 참조 유지)

  // 유저 문서 동기화 (AuthContext → 로컬 user state)
  useEffect(() => {
    if (ctxUserData) {
      setUser(u => ({
        ...u,
        grapePoints: ctxUserData.grapePoints !== undefined ? ctxUserData.grapePoints : u.grapePoints,
        totalGrapes: ctxUserData.totalGrapesEarned || u.totalGrapes || 0,
        name: ctxUserData.displayName || u.name,
        inviteCode: ctxUserData.inviteCode || u.inviteCode,
        coupleId: ctxUserData.activeCoupleId || '',
        partnerConnected: !!ctxUserData.activeCoupleId,
      }));
      if (ctxUserData.survey && Object.keys(ctxUserData.survey).length > 0) {
        setSavedSurveyAnswers(ctxUserData.survey);
      }
    }
  }, [ctxUserData]);

  // 파트너 정보 동기화 (CoupleContext → 로컬 user state)
  useEffect(() => {
    if (ctxPartnerUid && ctxPartnerProfile) {
      setUser(u => ({
        ...u,
        partnerName: ctxPartnerProfile.displayName || '',
        partnerUid: ctxPartnerUid,
      }));
    }
  }, [ctxPartnerUid, ctxPartnerProfile]);

  // 파트너 설문 동기화
  useEffect(() => {
    setUser(u => ({
      ...u,
      partnerSurvey: ctxPartnerSurvey,
      partnerSurveyCompleted: ctxPartnerSurveyCompleted,
    }));
  }, [ctxPartnerSurvey, ctxPartnerSurveyCompleted]);

  // 커플 공유 데이터 동기화 (CoupleContext → 로컬 state)
  useEffect(() => {
    if (ctxBoards && ctxBoards.length > 0) setGrapeBoards(ctxBoards);
  }, [ctxBoards]);

  useEffect(() => {
    if (ctxCoupons && ctxCoupons.length > 0) setMyCoupons(ctxCoupons);
  }, [ctxCoupons]);

  useEffect(() => {
    if (ctxPraises && ctxPraises.length > 0) setPraiseLog(ctxPraises);
  }, [ctxPraises]);

  useEffect(() => {
    if (ctxChores && ctxChores.length > 0) setChores(ctxChores);
  }, [ctxChores]);

  useEffect(() => {
    if (ctxShopListings && ctxShopListings.length > 0) setShopCoupons(ctxShopListings);
  }, [ctxShopListings]);

  // 개인 데이터 동기화 (CoupleContext → 로컬 state)
  useEffect(() => {
    if (ctxMoodHistory && ctxMoodHistory.length > 0) setMoodHistory(ctxMoodHistory);
  }, [ctxMoodHistory]);

  useEffect(() => {
    if (ctxAiHistory && ctxAiHistory.length > 0) setConversationHistory(ctxAiHistory);
  }, [ctxAiHistory]);

  // 로컬 상태 변경 시 Firebase에 저장 (onSnapshot이 처리하지 않는 레거시 데이터용)
  const syncToFirebase = useCallback(async () => {
    if (!authUser) return;
    await saveUserData(authUser.uid, {
      user,
      savedSurveyAnswers,
    });
  }, [authUser, user, savedSurveyAnswers]);

  useEffect(() => {
    if (!authUser) return;
    const timer = setTimeout(() => {
      syncToFirebase();
    }, 2000);
    return () => clearTimeout(timer);
  }, [authUser, user, savedSurveyAnswers, syncToFirebase]);

  // 로그인 에러 한글화
  const getLoginErrorMessage = (error) => {
    if (!error) return null;
    if (error.includes('popup-blocked')) return '팝업이 차단되었어요. 팝업 허용 후 다시 시도해주세요.';
    if (error.includes('popup-closed') || error.includes('cancelled')) return '로그인이 취소되었어요.';
    if (error.includes('network')) return '네트워크 연결을 확인해주세요.';
    if (error.includes('too-many-requests')) return '잠시 후 다시 시도해주세요.';
    if (error.includes('account-exists')) return '이미 다른 방법으로 가입된 계정이에요.';
    return '로그인 중 문제가 발생했어요. 다시 시도해주세요.';
  };

  // 구글 로그인 핸들러
  const handleGoogleLogin = async () => {
    if (loginLoading) return;
    setLoginError(null);
    setLoginLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setLoginError(getLoginErrorMessage(error));
    }
    setLoginLoading(false);
  };

  // 애플 로그인 핸들러
  const handleAppleLogin = async () => {
    if (loginLoading) return;
    setLoginError(null);
    setLoginLoading(true);
    const { error } = await signInWithApple();
    if (error) {
      setLoginError(getLoginErrorMessage(error));
    }
    setLoginLoading(false);
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    const { error } = await logOut();
    if (error) {
      showToast("로그아웃 실패: " + error, "error");
      return;
    }
    // 로컬 상태 초기화
    setUser(MOCK_USER);
    setChores(MOCK_CHORES);
    setPraiseLog([]);
    setGrapeBoards([]);
    setMyCoupons([]);
    setShopCoupons([]);
    setMoodHistory([]);
    setConversationHistory([]);
    setSavedSurveyAnswers({});
    // UI 상태 초기화
    setShowSettings(false);
    setSettingsTab("main");
    setShowConflictInput(false);
    setShowMoodPopup(false);
    setShowNewBoard(false);
    setShowCouponCreate(false);
    setTab("home");
    moodPopupShownRef.current = false;
    localStorage.removeItem("mallang_tab");
    localStorage.removeItem("mallang_reportSubTab");
    setScreen("splash");
  };

  // Splash screen auto-transition
  useEffect(() => {
    if (authLoading) return;

    if (screen === "splash") {
      const timer = setTimeout(() => {
        if (user.name) {
          setScreen("main");
        } else {
          setScreen("welcome");
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [screen, user.name, authLoading]);

  // 로컬 시간 기준 오늘 날짜 (YYYY-MM-DD, UTC 아닌 사용자 시간대)
  const getLocalToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // 하루 한 번 기분 팝업 (메인 화면 진입 시)
  // moodPopupShownRef에 날짜를 저장하여 날짜 변경 감지 가능
  useEffect(() => {
    if (screen !== "main") return;
    const today = getLocalToday();
    // ref에 오늘 날짜가 이미 저장되어 있으면 이미 처리된 것
    if (moodPopupShownRef.current === today) return;

    const timer = setTimeout(() => {
      // 1. localStorage 체크
      const savedMoodDate = localStorage.getItem("mallang_lastMoodDate");
      if (savedMoodDate === today) {
        moodPopupShownRef.current = today;
        return;
      }
      // 2. moodHistory 체크
      const todayMood = moodHistory.find(m => m.date === today);
      if (todayMood) {
        localStorage.setItem("mallang_lastMoodDate", today);
        moodPopupShownRef.current = today;
        return;
      }
      // 3. 오늘 기분 없으면 팝업
      setShowMoodPopup(true);
      moodPopupShownRef.current = today;
    }, 1500);
    return () => clearTimeout(timer);
  }, [screen, moodHistory]);

  // 스트릭 갱신 (앱 진입 시 1회)
  useEffect(() => {
    if (!ctxActiveCoupleId || streakUpdatedRef.current) return;
    streakUpdatedRef.current = true;
    updateStreak(ctxActiveCoupleId);
  }, [ctxActiveCoupleId]);



  // 탭 전환 시 Analytics
  useEffect(() => {
    if (screen === "main") {
      trackScreenView(tab);
    }
  }, [tab, screen]);

  // localStorage 저장 (데이터 변경 시)
  useEffect(() => {
    localStorage.setItem("mallang_user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("mallang_chores", JSON.stringify(chores));
  }, [chores]);

  useEffect(() => {
    localStorage.setItem("mallang_conversationHistory", JSON.stringify(conversationHistory));
  }, [conversationHistory]);

  useEffect(() => {
    localStorage.setItem("mallang_praiseLog", JSON.stringify(praiseLog));
  }, [praiseLog]);

  useEffect(() => {
    localStorage.setItem("mallang_grapeBoards", JSON.stringify(grapeBoards));
  }, [grapeBoards]);

  useEffect(() => {
    localStorage.setItem("mallang_myCoupons", JSON.stringify(myCoupons));
  }, [myCoupons]);

  useEffect(() => {
    localStorage.setItem("mallang_shopCoupons", JSON.stringify(shopCoupons));
  }, [shopCoupons]);

  useEffect(() => {
    localStorage.setItem("mallang_moodHistory", JSON.stringify(moodHistory));
  }, [moodHistory]);

  useEffect(() => {
    localStorage.setItem("mallang_surveyAnswers", JSON.stringify(savedSurveyAnswers));
  }, [savedSurveyAnswers]);

  useEffect(() => {
    localStorage.setItem("mallang_tab", tab);
  }, [tab]);

  useEffect(() => {
    localStorage.setItem("mallang_reportSubTab", reportSubTab);
  }, [reportSubTab]);

  // 탭/서브탭 변경 시 스크롤 초기화
  useEffect(() => { window.scrollTo(0, 0); }, [tab, reportSubTab]);

  // 안드로이드 뒤로가기 버튼 처리
  useEffect(() => {
    window.history.pushState({ screen: "main" }, "");

    const handlePopState = (e) => {
      e.preventDefault();
      window.history.pushState({ screen: "main" }, "");

      // 모달이 열려있으면 모달 닫기 (우선순위 높음)
      if (homeExpandedCard) { setHomeExpandedCard(null); return; }
      if (showExitConfirm) { setShowExitConfirm(false); return; }
      if (showSettings) { setShowSettings(false); setSettingsTab("main"); return; }
      if (showMoodPopup) { setShowMoodPopup(false); return; }
      if (showNewBoard) { setShowNewBoard(false); return; }
      if (showCouponCreate) { setShowCouponCreate(false); return; }
      if (showAddTodo) { setShowAddTodo(false); return; }
      if (showConflictInput) { setShowConflictInput(false); return; }
      if (showConversationHistory) { setShowConversationHistory(false); return; }
      if (showAdModal) { setShowAdModal(false); setAdWatching(false); setAdProgress(0); return; }
      if (showRewardModal) { setShowRewardModal(false); return; }
      if (showPartnerRequiredPopup) { setShowPartnerRequiredPopup(false); return; }
      if (showSurveyPrompt) { setShowSurveyPrompt(false); return; }
      if (confirmDeleteBoard) { setConfirmDeleteBoard(null); return; }
      if (confirmDeleteTodo) { setConfirmDeleteTodo(null); return; }
      if (confirmDeleteCoupon) { setConfirmDeleteCoupon(null); return; }
      if (confirmDeleteShopCoupon) { setConfirmDeleteShopCoupon(null); return; }
      if (confirmSendCoupon) { setConfirmSendCoupon(null); return; }
      if (confirmDeletePraise) { setConfirmDeletePraise(null); return; }
      if (selectedGift) { setSelectedGift(null); return; }

      // 메인 화면이면서 홈 탭이 아니면 홈 탭으로 이동
      if (screen === "main" && tab !== "home") {
        setTab("home");
        return;
      }

      // 메인 화면 + 홈 탭이면 종료 확인 팝업
      if (screen === "main" && tab === "home") {
        setShowExitConfirm(true);
        return;
      }

      // 다른 화면에서는 메인으로
      if (screen !== "splash" && screen !== "welcome" && screen !== "welcome_done" && screen !== "onboarding") {
        setScreen("main");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [screen, tab, homeExpandedCard, showExitConfirm, showSettings, showMoodPopup, showNewBoard, showCouponCreate, showAddTodo, showConflictInput, showConversationHistory, showAdModal, showRewardModal, showPartnerRequiredPopup, showSurveyPrompt, confirmDeleteBoard, confirmDeleteTodo, confirmDeleteCoupon, confirmDeleteShopCoupon, confirmSendCoupon, confirmDeletePraise, selectedGift]);

  // Ad watching simulation timer
  useEffect(() => {
    if (adWatching && adProgress < 100) {
      const timer = setInterval(() => {
        setAdProgress(p => Math.min(100, p + (100 / 30)));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [adWatching, adProgress]);

  // Gemini 직접 호출 헬퍼 (429 자동 재시도)
  const callGemini = async (systemPrompt, userPrompt, retries = 2) => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API 키가 설정되지 않았습니다');
    for (let attempt = 0; attempt <= retries; attempt++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
        }),
      });
      if (res.status === 429 && attempt < retries) {
        await new Promise(r => setTimeout(r, (attempt + 1) * 3000));
        continue;
      }
      if (res.status === 429) throw new Error('API 호출 한도 초과 — 1분 후 다시 시도해주세요');
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error('Gemini API error:', res.status, errBody);
        throw new Error(`Gemini API error: ${res.status}`);
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Gemini 응답이 비어있습니다');
      try { return JSON.parse(text); } catch {
        const jsonMatch = text.match(/```json?\s*([\s\S]*?)```/);
        if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
        throw new Error('Gemini 응답 파싱 실패');
      }
    }
  };

  const handleConflictSubmit = async () => {
    if (!conflictText.trim()) return;

    // 짝꿍 성향 정보 구성
    const partnerPersonality = user.partnerSurvey ? Object.entries(user.partnerSurvey)
      .map(([key, val]) => `${key}: ${val}`).join(', ') : null;
    const hasPersonality = !!partnerPersonality;

    // 서버 & 클라이언트 동일한 프롬프트
    const buildTransformPrompt = () => `너는 커플 대화 변환 전문가야. 사용자가 짝꿍에게 하려는 말을 부드럽게 변환해줘.

[절대 규칙 - 반드시 지켜야 함]
1. 원본 메시지의 "구체적 상황"을 반드시 변환 결과에 포함해야 한다.
   - 원본이 "물 내려"에 대한 이야기면 → 변환에도 "물 내리는 것/화장실" 언급 필수
   - 원본이 "설거지"에 대한 이야기면 → 변환에도 "설거지" 언급 필수
   - 원본이 "늦었다"에 대한 이야기면 → 변환에도 "기다린 것/시간" 언급 필수
2. 원본의 감정(짜증, 서운함, 화남)을 부드럽게 표현하되, 감정 자체는 전달해야 한다.
3. 구체적 행동 요청을 포함해야 한다 (뭘 해달라는 건지 명확하게).
4. "우리 같이 방법을 찾아볼까?" 같은 뜬구름 잡는 일반론 금지. 원본에 없는 이야기 금지.

[변환 3단계]
Step 1: 원본에서 "상황"(뭐에 대한 이야기인지) + "감정"(어떤 기분인지) + "요청"(뭘 해달라는지) 추출
Step 2: 상황을 자연스럽게 언급하면서 감정을 I-message("나는 ~할 때 ~한 기분이었어")로 표현
Step 3: 요청을 부드럽지만 명확하게 전달 ("~해주면 좋겠어", "~해줄 수 있을까?")

예시:
- 원본: "야 물내리라고 했잖아 왜 항상 나를 힘들게해?"
  → "화장실 물 안 내려져 있으면 나는 좀 신경 쓰여서 그래. 쓰고 나서 물 내려주면 고마울 것 같아!"
- 원본: "맨날 나만 설거지하잖아 짜증나"
  → "요즘 내가 설거지 계속 하다 보니까 좀 지치더라. 이번 주는 번갈아가면서 해보면 어떨까?"

${hasPersonality ? `[성향 맞춤 모드]
상대방 성향: ${partnerPersonality}
위 성향을 고려해서, 상대가 가장 잘 받아들일 표현 스타일로 변환해줘.
${likedWords ? `짝꿍이 좋아하는 표현: ${likedWords}` : ''}
${dislikedWords ? `짝꿍이 싫어하는 표현: ${dislikedWords}` : ''}

JSON 형식:
{"mode":"성향 맞춤 모드","transformed":"변환된 문장","tip":"원본 상황에 맞는 구체적 팁 (20자 이내)","style":"스타일 이름"}` : `[일반 제안 모드]
성향 정보 없이 3가지 다른 톤의 선택지를 제공해.
${likedWords ? `짝꿍이 좋아하는 표현: ${likedWords}` : ''}
${dislikedWords ? `짝꿍이 싫어하는 표현: ${dislikedWords}` : ''}

3가지 스타일:
1. 다정한 공감형 - 감정 인정 + 부드러운 요청
2. 솔직담백형 - 팩트 기반 + 직접적이지만 존중하는 요청
3. 유머 섞인형 - 가볍게 상황 언급 + 웃으면서 요청

JSON 형식:
{"mode":"일반 제안 모드","options":[{"transformed":"문장1","style":"다정한 공감형"},{"transformed":"문장2","style":"솔직담백형"},{"transformed":"문장3","style":"유머 섞인형"}],"tip":"원본 상황에 맞는 구체적 팁 (20자 이내)"}`}`;

    try {
      let result;
      // 서버 API 먼저 시도, 실패 시 직접 호출
      try {
        const response = await fetch('/api/transform', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authUser ? await authUser.getIdToken() : ''}`,
          },
          body: JSON.stringify({ text: conflictText, likedWords, dislikedWords, partnerPersonality }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error('Server transform error:', errData);
          // 429(한도초과)는 클라이언트 재시도해도 같으므로 바로 에러 표시
          if (response.status === 429) throw new Error('API 호출 한도 초과 — 1분 후 다시 시도해주세요');
          throw new Error(errData.message || errData.error || `서버 에러 ${response.status}`);
        }
        result = await response.json();
      } catch (serverErr) {
        // 429는 클라이언트도 같은 키라 재시도 의미없음 → 바로 에러
        if (serverErr.message?.includes('한도 초과')) throw serverErr;
        console.error('Server API failed, trying client fallback:', serverErr.message);
        // 직접 Gemini 호출 (서버와 동일한 프롬프트)
        result = await callGemini(buildTransformPrompt(), conflictText);
      }

      const suggestion = {
        id: Date.now(),
        original: conflictText,
        mode: result.mode || (hasPersonality ? "성향 맞춤 모드" : "일반 제안 모드"),
        transformed: result.transformed || null,
        options: result.options || null,
        tip: result.tip,
        partnerStyle: result.style || (result.options?.[0]?.style) || "차분한 공감형",
        timestamp: new Date().toISOString(),
        feedback: null,
        targetType: transformTargetType || 'partner',
      };

      setAiSuggestion(suggestion);
      if (authUser) {
        await saveAiTransformEntry(authUser.uid, user.coupleId || null, suggestion);
      }
      setConversationHistory(prev => [suggestion, ...prev]);
    } catch (error) {
      console.error('Transform API error:', error);
      showToast("AI 변환 실패: " + (error.message || "알 수 없는 오류"), "error");
    }
  };

  // 대화 기록 피드백 업데이트
  const updateConversationFeedback = (id, feedback) => {
    setConversationHistory(prev =>
      prev.map(item => item.id === id ? { ...item, feedback } : item)
    );
  };

  const toggleChore = (id) => {
    setChores(chores.map(c => {
      if (c.id === id) {
        if (!c.completed) showToast("할 일 완료! ✅");
        return { ...c, completed: !c.completed };
      }
      return c;
    }));
  };

  const sendPraise = async () => {
    if (!praiseText.trim()) return;
    if (!user.partnerConnected) {
      setPartnerRequiredAction("praise");
      setShowPartnerRequiredPopup(true);
      return;
    }
    const coupleId = user.coupleId;
    if (coupleId && authUser && user.partnerUid) {
      // Firestore 저장 → 리스너가 자동으로 praiseLog 업데이트
      const { error } = await createPraise(coupleId, authUser.uid, user.partnerUid, praiseText.trim(), 1);
      if (error) { showToast(error, "error"); return; }
    } else {
      // 솔로 모드 fallback
      const newPraise = {
        id: Date.now(),
        from: user.name || "나",
        message: praiseText.trim(),
        date: new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" }),
      };
      setPraiseLog(prev => [newPraise, ...prev]);
    }
    showToast(`${partnerDisplayName}님에게 칭찬을 보냈어요! 💜 포도알 +1`);
    trackFeatureUse('praise_send');
    setPraiseText("");
  };

  // 로딩 중 화면
  if (authLoading) {
    return (
      <div style={{
        maxWidth: 420, margin: "0 auto", minHeight: "100vh",
        background: "linear-gradient(180deg, #E8DEFF 0%, #F3EFFE 35%, #FFFFFF 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <style>{`
          @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
          * { margin: 0; padding: 0; box-sizing: border-box; color-scheme: only light; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <img src="/splash-logo.png" alt="말랑" width={48} height={48} style={{ marginBottom: 16 }} />
        <div style={{
          width: 32, height: 32, border: `3px solid ${colors.primaryLight}`,
          borderTopColor: colors.primary, borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
      </div>
    );
  }

  if (screen === "splash") {
    return (
      <div style={{
        maxWidth: 420, margin: "0 auto", minHeight: "100vh",
        background: "linear-gradient(180deg, #E8DEFF 0%, #F3EFFE 35%, #FFFFFF 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#1F2937",
      }}>
        <style>{`
          @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
          * { margin: 0; padding: 0; box-sizing: border-box; color-scheme: only light; }

          @keyframes splashFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes splashFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        `}</style>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", marginTop: "-60px",
        }}>
          <img src="/splash-logo.png" alt="말랑" width={80} height={80} style={{
            marginBottom: 12,
            animation: "splashFadeIn 0.8s ease-out, splashFloat 3s ease-in-out 1s infinite",
          }} />
          <h1 style={{
            fontSize: 32, fontWeight: 800, color: colors.primary, marginBottom: 8,
            animation: "splashFadeIn 0.8s ease-out 0.3s both",
          }}>말랑</h1>
          <p style={{
            fontSize: 14, color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.5px",
            animation: "splashFadeIn 0.8s ease-out 0.5s both",
          }}>
            {t("splashSub")}
          </p>
        </div>
      </div>
    );
  }

  if (screen === "welcome") {
    return (
      <div style={{
        maxWidth: 420, margin: "0 auto", minHeight: "100vh",
        background: "linear-gradient(180deg, #F8F5FF 0%, #FFFFFF 40%, #FFFFFF 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "40px 24px", color: "#1F2937",
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <style>{`
          @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
          * { margin: 0; padding: 0; box-sizing: border-box; color-scheme: only light; }

          input { font-family: inherit; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{ textAlign: "center", marginBottom: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src="/splash-logo.png" alt="말랑" width={64} height={64} style={{ marginBottom: 8 }} />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.primary, marginBottom: 8 }}>말랑</h1>
          <p style={{
            fontSize: 13, color: colors.textSecondary, lineHeight: 1.5,
          }}>
            {t("welcomeSub1")}<br/>{t("welcomeSub2")}
          </p>
        </div>

        {/* 구글 로그인 버튼 - 로그인 전 */}
        {!authUser ? (
          <div style={{ marginBottom: 24 }}>
            {loginError && (
              <div style={{
                background: colors.roseLight, borderRadius: 12, padding: "12px 16px",
                marginBottom: 12, fontSize: 13, color: colors.rose, textAlign: "center",
              }}>
                {loginError}
              </div>
            )}
            <button onClick={handleGoogleLogin} disabled={loginLoading} style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              background: "#fff", border: `1.5px solid ${colors.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: loginLoading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              opacity: loginLoading ? 0.6 : 1,
            }}>
              {loginLoading ? (
                <div style={{
                  width: 18, height: 18, border: `2px solid ${colors.border}`,
                  borderTop: `2px solid ${colors.primary}`, borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
                {loginLoading ? "로그인 중..." : "Google로 로그인"}
              </span>
            </button>
            <button onClick={handleAppleLogin} disabled={loginLoading} style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              background: "#000", border: "1.5px solid #000",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: loginLoading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              marginTop: 10,
              opacity: loginLoading ? 0.6 : 1,
            }}>
              {loginLoading ? (
                <div style={{
                  width: 18, height: 18, border: "2px solid #444",
                  borderTop: "2px solid #fff", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                {loginLoading ? "로그인 중..." : "Apple로 로그인"}
              </span>
            </button>
          </div>
        ) : (
          /* 로그인 성공 → 닉네임/짝꿍코드 입력 팝업 */
          <>
            <div style={{
              background: colors.mintLight, borderRadius: 12, padding: "12px 16px",
              marginBottom: 24, display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: colors.mint,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.mint }}>로그인 완료</div>
                <div style={{ fontSize: 11, color: colors.textTertiary }}>{authUser.email}</div>
              </div>
            </div>

            {/* 닉네임/짝꿍 코드 팝업 */}
            <div style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
              zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                background: "#fff", borderRadius: 24, padding: "32px 24px",
                width: "90%", maxWidth: 380,
              }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <img src="/splash-logo.png" alt="말랑" width={48} height={48} style={{ marginBottom: 8 }} />
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.text, marginBottom: 4 }}>
                    프로필 설정
                  </h2>
                  <p style={{ fontSize: 13, color: colors.textSecondary }}>
                    닉네임을 입력하고 짝꿍과 연결해보세요
                  </p>
                </div>

                <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>
                  {t("myName")}
                </label>
                <input
                  type="text"
                  placeholder={t("namePlaceholder")}
                  value={welcomeName}
                  onChange={e => setWelcomeName(e.target.value)}
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: 12,
                    border: `1.5px solid ${colors.border}`, fontSize: 16,
                    outline: "none", boxSizing: "border-box", marginBottom: 16,
                  }}
                />

                {/* 나의 초대 코드 */}
                <div style={{
                  background: colors.primaryLight, borderRadius: 12, padding: "14px 16px",
                  textAlign: "center", marginBottom: 16,
                }}>
                  <p style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>나의 초대 코드</p>
                  <div style={{ fontSize: 20, fontWeight: 800, color: colors.primary, letterSpacing: 3, marginBottom: 8 }}>
                    {user.inviteCode || "---"}
                  </div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    {!user.inviteCode ? (
                      <button onClick={async () => { await generateInviteCodeOnce(); showToast("초대 코드가 생성되었어요!"); }} style={{
                        background: colors.primary, color: "#fff", border: "none",
                        padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}>
                        <Plus size={12} /> 코드 생성하기
                      </button>
                    ) : (
                      <>
                        <button onClick={() => {
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(user.inviteCode).then(() => showToast("초대 코드가 복사되었어요!"));
                          } else {
                            const ta = document.createElement("textarea"); ta.value = user.inviteCode; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
                            showToast("초대 코드가 복사되었어요!");
                          }
                        }} style={{
                          background: colors.primary, color: "#fff", border: "none",
                          padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                          <Copy size={12} /> 복사
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: "center", color: colors.textTertiary, fontSize: 12, marginBottom: 12 }}>또는 짝꿍의 코드 입력</div>

                <input
                  type="text"
                  placeholder={t("codePlaceholder")}
                  value={welcomePartnerCode}
                  onChange={e => setWelcomePartnerCode(e.target.value.toUpperCase())}
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: 12,
                    border: `1.5px solid ${colors.border}`, fontSize: 16,
                    outline: "none", boxSizing: "border-box", letterSpacing: 2,
                    fontWeight: 600, textAlign: "center", marginBottom: 20,
                  }}
                />

                <button onClick={async () => {
                  if (!welcomeName.trim()) {
                    showToast("이름을 입력해주세요", "error");
                    return;
                  }
                  if (!welcomePartnerCode.trim()) {
                    setShowSkipCodeConfirm(true);
                    return;
                  }
                  // 닉네임 저장
                  setUser(u => ({ ...u, name: welcomeName.trim() }));
                  if (authUser) {
                    await updateUserData(authUser.uid, { displayName: welcomeName.trim() });
                    // 짝꿍 코드 입력한 경우 페어링 시도
                    const { error } = await createPair(authUser.uid, welcomePartnerCode.trim());
                    if (error) {
                      showToast(error, "error");
                      // 페어링 실패해도 다음 화면으로 이동 (나중에 설정에서 재시도 가능)
                    } else {
                      setUser(u => ({ ...u, partnerConnected: true }));
                      showToast("짝꿍과 연결되었어요! 💜");
                    }
                  }
                  setScreen("welcome_done");
                }} style={{
                  width: "100%", padding: "16px", borderRadius: 14,
                  background: welcomeName.trim()
                    ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                    : "#E5E7EB",
                  color: welcomeName.trim() ? "#fff" : "#9CA3AF",
                  border: "none", fontSize: 16, fontWeight: 700,
                  cursor: welcomeName.trim() ? "pointer" : "default",
                }}>
                  시작하기
                </button>

                <button onClick={() => {
                  if (!welcomeName.trim()) {
                    showToast("이름을 입력해주세요", "error");
                    return;
                  }
                  setShowSkipCodeConfirm(true);
                }} style={{
                  width: "100%", padding: "12px", background: "none",
                  border: "none", color: colors.textTertiary, fontSize: 13, cursor: "pointer", marginTop: 4,
                }}>
                  짝꿍 코드는 나중에 입력할게요
                </button>
              </div>
            </div>

            {/* Skip partner code confirm popup */}
            {showSkipCodeConfirm && (
              <div style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
                zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  background: "#fff", borderRadius: 20, padding: "28px 24px",
                  width: "82%", maxWidth: 320, textAlign: "center",
                }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
                    짝꿍 코드 미입력
                  </h3>
                  <p style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
                    짝꿍 코드는 설정에서<br/>언제든 입력할 수 있어요
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowSkipCodeConfirm(false)} style={{
                      flex: 1, padding: "13px", borderRadius: 12,
                      background: "#F3F4F6", color: colors.textSecondary,
                      border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                    }}>
                      돌아가기
                    </button>
                    <button onClick={async () => {
                      setShowSkipCodeConfirm(false);
                      setUser(u => ({ ...u, name: welcomeName.trim(), partnerConnected: false, partnerName: "" }));
                      if (authUser) {
                        const { error } = await updateUserData(authUser.uid, { displayName: welcomeName.trim() });
                        if (error) showToast("저장 실패: " + error, "error");
                      }
                      setScreen("welcome_done");
                    }} style={{
                      flex: 1, padding: "13px", borderRadius: 12,
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                      color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    }}>
                      확인
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <Toast {...toast} />
        {isOffline && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0,
            background: colors.rose, color: "#fff",
            padding: "10px 16px", fontSize: 13, fontWeight: 600,
            textAlign: "center", zIndex: 10000,
          }}>
            인터넷 연결이 끊겼어요. 연결을 확인해주세요.
          </div>
        )}
      </div>
    );
  }

  if (screen === "welcome_done") {
    return (
      <div style={{
        maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: colors.bg,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: "40px 24px",
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <style>{`
          @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
          * { margin: 0; padding: 0; box-sizing: border-box; color-scheme: only light; }
        `}</style>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.text, marginBottom: 8, textAlign: "center" }}>
          환영해요, {user.name}님!
        </h2>
        <p style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 1.6, marginBottom: 32 }}>
          서로를 더 잘 이해하기 위한<br/>성향 분석을 해볼까요?
        </p>

        <button onClick={() => setScreen("onboarding")} style={{
          width: "100%", padding: "16px", borderRadius: 14,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
          color: "#fff", border: "none", fontSize: 16, fontWeight: 700,
          cursor: "pointer", marginBottom: 10,
        }}>
          성향 분석하기 →
        </button>
        <button onClick={() => {
          setUser(u => ({ ...u, surveyCompleted: false }));
          setScreen("main");
        }} style={{
          width: "100%", padding: "14px", borderRadius: 14,
          background: "none", border: "none",
          color: colors.textTertiary, fontSize: 14, cursor: "pointer",
        }}>
          나중에 할게요
        </button>
      </div>
    );
  }

  if (screen === "onboarding") {
    // 이전에 완료된 설문 답변이 있으면 그걸 먼저 사용, 없으면 임시 저장본
    const initialAnswers = Object.keys(savedSurveyAnswers).length > 0
      ? savedSurveyAnswers
      : (user.surveyCompleted && user.survey ? user.survey : {});
    return <OnboardingScreen
      savedAnswers={initialAnswers}
      myInviteCode={user.inviteCode}
      onComplete={(answers) => {
        setUser(u => ({ ...u, survey: answers, surveyCompleted: true }));
        setSavedSurveyAnswers({}); // 완료 시 임시 저장 초기화
        setScreen("main");
        showToast("설문 완료! 말랑에 오신 걸 환영해요 🍇");
      }}
      onClose={(answers) => {
        // answers가 null이면 저장하지 않음 (미완료 종료)
        if (answers !== null) {
          setSavedSurveyAnswers(answers);
        }
        setScreen("main");
        showToast("성향 분석을 종료했어요. 완료하면 결과가 저장됩니다.");
      }}
    />;
  }

  // ─── TAB CONTENT ─────────────────────────────────────────
  const renderHome = () => {
    const today = getLocalToday();
    const secretDoneToday = ctxSecretMessages?.some(m => m.fromUid === authUser?.uid && m.dateStr === today);
    const questionDoneToday = !!ctxDailyQuestion?.answers?.[authUser?.uid];
    const moodDoneToday = moodHistory.some(m => m.date === today);
    const praiseDoneToday = praiseLog.some(p => p.fromUid === authUser?.uid && p.createdAt?.startsWith(today));
    const dailyDoneCount = ctxActiveCoupleId ? [secretDoneToday, questionDoneToday, moodDoneToday, praiseDoneToday].filter(Boolean).length : 0;

    return (
    <div style={{ padding: "0 20px 100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 20px" }}>
        <div>
          <span style={{ fontSize: 13, color: colors.textSecondary }}>안녕하세요</span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: colors.text, marginTop: 2, letterSpacing: "-0.5px" }}>
            {user.name}님 🍇
          </h1>
          {reportTodayUnlocked && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
              background: colors.primaryLight, borderRadius: 8, padding: "4px 10px",
              fontSize: 11, color: colors.primary, fontWeight: 600,
            }}>
              📊 오늘 분석 열람 완료
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => { setTab("coupon"); setCouponViewTab("received"); }} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "#fff", borderRadius: 10, padding: "6px 10px",
            fontSize: 12, fontWeight: 700, color: colors.warm,
            border: `1px solid ${colors.border}`, cursor: "pointer",
          }}>
            🎫 내쿠폰
          </button>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: colors.grapeLight, borderRadius: 10, padding: "6px 10px",
            fontSize: 12, fontWeight: 700, color: colors.grape,
          }}>
            🍇 {user.grapePoints || 0}개
          </div>
          <StreakBadge current={ctxStreak?.current} longest={ctxStreak?.longest} onClick={() => setShowStreakCalendar(true)} />
          <button onClick={() => setShowSettings(true)} style={{
            width: 38, height: 38, borderRadius: 12, background: "#fff",
            border: `1px solid ${colors.border}`, display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer",
          }}>
            <Settings size={18} color={colors.textSecondary} />
          </button>
        </div>
      </div>

      {/* 미연결 시 커플 기능 유도 카드 */}
      {!user.partnerConnected && (
        <div style={{
          background: `linear-gradient(135deg, ${colors.primaryLight}, #EDE9FE)`,
          borderRadius: 16, padding: "20px 18px", marginBottom: 16,
          border: `1px solid ${colors.primary}22`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 28 }}>💑</span>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>짝꿍과 함께 즐겨보세요!</h3>
          </div>
          <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 14 }}>
            짝꿍과 연결하면 커플 질문, 오늘의 기분, 칭찬 보내기 등<br/>
            다양한 커플 기능을 함께 즐길 수 있어요.
          </p>
          <button onClick={() => setShowSettings(true)} style={{
            padding: "10px 20px", borderRadius: 10,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>짝꿍코드 등록하러 가기 →</button>
        </div>
      )}

      {/* ═══ Section A: 포도판 (standalone) ═══ */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>🍇 포도판</h3>
          <button onClick={() => setTab("grape")} style={{
            background: "none", border: "none", fontSize: 12, color: colors.primary,
            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 2,
          }}>
            전체보기 <ChevronRight size={14} />
          </button>
        </div>
        <div style={{
          display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4,
          scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
        }}>
          {(() => {
            const allBoards = grapeBoards;
            return allBoards.length > 0 ? allBoards.map(board => {
            const pct = Math.min((board.current / board.goal) * 100, 100);
            return (
              <div key={board.id} onClick={() => setTab("grape")} style={{
                minWidth: 140, flex: "0 0 auto",
                background: `linear-gradient(135deg, ${pct >= 100 ? "#059669" : colors.primary}, ${pct >= 100 ? "#10B981" : "#6D28D9"})`,
                borderRadius: 16, padding: "16px 14px",
                cursor: "pointer", scrollSnapAlign: "start",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -12, right: -12, width: 50, height: 50,
                  borderRadius: "50%", background: "rgba(255,255,255,0.1)",
                }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.3 }}>
                  {board.title}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{board.current}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>/{board.goal}</span>
                </div>
                <div style={{
                  width: "100%", height: 4, background: "rgba(255,255,255,0.2)",
                  borderRadius: 2, overflow: "hidden",
                }}>
                  <div style={{
                    width: `${pct}%`, height: 4, borderRadius: 2,
                    background: "rgba(255,255,255,0.8)",
                    transition: "width 0.5s ease",
                  }} />
                </div>
                {pct >= 100 && (
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>🎉 달성!</div>
                )}
              </div>
            );
          }) : (
            <div onClick={() => setTab("grape")} style={{
              flex: 1, background: "#fff", borderRadius: 16,
              border: `2px dashed ${colors.borderActive}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "24px 14px", cursor: "pointer",
            }}>
              <Plus size={24} color={colors.textTertiary} />
              <span style={{ fontSize: 12, color: colors.textTertiary, marginTop: 6, fontWeight: 600 }}>첫 포도판을 만들어보세요!</span>
            </div>
          );
          })()}
          {/* Add new board shortcut */}
          {grapeBoards.length > 0 && (
          <div onClick={() => setTab("grape")} style={{
            minWidth: 80, flex: "0 0 auto",
            background: "#fff", borderRadius: 16,
            border: `2px dashed ${colors.borderActive}`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "16px 14px", cursor: "pointer", scrollSnapAlign: "start",
          }}>
            <Plus size={20} color={colors.textTertiary} />
            <span style={{ fontSize: 10, color: colors.textTertiary, marginTop: 4, fontWeight: 600 }}>추가</span>
          </div>
          )}
        </div>
      </div>

      {/* ═══ Section B: 오늘의 우리 (redesigned) ═══ */}
      {ctxActiveCoupleId && (() => {
        const markHomeTapped = (key) => {
          setHomeTappedToday(prev => {
            const next = { ...prev, [key]: true };
            localStorage.setItem('mallang_homeTapped', JSON.stringify({ date: today, keys: next }));
            return next;
          });
        };
        return (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>💑 오늘의 우리</h3>
            <span style={{
              fontSize: 11, fontWeight: 600, color: dailyDoneCount >= 4 ? colors.mint : colors.primary,
              background: dailyDoneCount >= 4 ? colors.mintLight : colors.primaryLight,
              borderRadius: 10, padding: "2px 8px",
            }}>
              {dailyDoneCount >= 4 ? "✓ " : ""}{dailyDoneCount}/4 완료
            </span>
          </div>

          {/* Urgent: unread secret message */}
          {ctxUnreadSecretMessage && ctxPartnerUid && (
            <div style={{ marginBottom: 8 }}>
              <SecretMessageCard
                unreadMessage={ctxUnreadSecretMessage}
                todaySent={secretDoneToday}
                myName={user.name}
                partnerName={partnerDisplayName}
                onSend={async (message) => {
                  const { error } = await sendSecretMessage(
                    ctxActiveCoupleId, authUser.uid, ctxPartnerUid, message
                  );
                  if (error) { showToast(error); return; }
                  trackFeatureUse('secret_message_send');
                  showToast("몰래 한마디를 보냈어요! 🤫");
                }}
                onMarkRead={async (messageId) => {
                  const { error } = await markAsRead(ctxActiveCoupleId, messageId);
                  if (error) { showToast("읽음 처리에 실패했어요"); return; }
                  trackFeatureUse('secret_message_read');
                }}
              />
            </div>
          )}

          {/* 4 Round Icon Buttons */}
          <div style={{ display: "flex", justifyContent: "space-around", gap: 8 }}>
            {[
              { key: "secret", emoji: "🤫", label: "몰래 한마디", done: secretDoneToday, bg: "#FFE8A3" },
              { key: "question", emoji: "❓", label: "커플질문", done: questionDoneToday, bg: "#E8DEFF" },
              { key: "mood", emoji: "😆", label: "오늘기분", done: moodDoneToday, bg: "#D4EDDA" },
              { key: "praise", emoji: "❤️", label: "칭찬하기", done: praiseDoneToday, bg: "#FFD6E0" },
            ].map(card => (
              <button key={card.key} onClick={() => {
                markHomeTapped(card.key);
                setHomeExpandedCard(prev => prev === card.key ? null : card.key);
              }} style={{
                background: "transparent", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: 0,
              }}>
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: card.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24,
                    boxShadow: homeExpandedCard === card.key ? `0 0 0 2.5px ${colors.primary}` : "none",
                    transition: "box-shadow 0.2s",
                  }}>
                    {card.emoji}
                  </div>
                  {!homeTappedToday[card.key] && !card.done && (
                    <div style={{
                      position: "absolute", top: 0, right: 0,
                      width: 8, height: 8, borderRadius: "50%",
                      background: colors.rose, border: "2px solid #fff",
                    }} />
                  )}
                  {card.done && (
                    <div style={{
                      position: "absolute", bottom: -2, right: -2,
                      width: 18, height: 18, borderRadius: "50%",
                      background: colors.mint, border: "2px solid #fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Check size={10} color="#fff" />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>{card.label}</span>
              </button>
            ))}
          </div>
        </div>
        );
      })()}

      {/* Modal: 몰래 한마디 */}
      {homeExpandedCard === "secret" && ctxPartnerUid && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setHomeExpandedCard(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
            width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto",
            animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>🤫 몰래 한마디</h3>
              <button onClick={() => setHomeExpandedCard(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} color={colors.textTertiary} />
              </button>
            </div>
            <SecretMessageCard
              unreadMessage={ctxUnreadSecretMessage}
              todaySent={secretDoneToday}
              myName={user.name}
              partnerName={partnerDisplayName}
              onSend={async (message) => {
                const { error } = await sendSecretMessage(
                  ctxActiveCoupleId, authUser.uid, ctxPartnerUid, message
                );
                if (error) { showToast(error); return; }
                trackFeatureUse('secret_message_send');
                showToast("몰래 한마디를 보냈어요! 🤫");
              }}
              onMarkRead={async (messageId) => {
                const { error } = await markAsRead(ctxActiveCoupleId, messageId);
                if (error) { showToast("읽음 처리에 실패했어요"); return; }
                trackFeatureUse('secret_message_read');
              }}
            />
          </div>
        </div>
      )}

      {/* Modal: 커플 질문 */}
      {homeExpandedCard === "question" && ctxDailyQuestion && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setHomeExpandedCard(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
            width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto",
            animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>❓ 오늘의 커플 질문</h3>
              <button onClick={() => setHomeExpandedCard(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} color={colors.textTertiary} />
              </button>
            </div>
            <DailyQuestionCard
              question={ctxDailyQuestion}
              myAnswer={ctxDailyQuestion.answers?.[authUser?.uid]}
              partnerAnswer={ctxDailyQuestion.answers?.[ctxPartnerUid]}
              myPrediction={ctxDailyQuestion.predictions?.[authUser?.uid]}
              partnerPrediction={ctxDailyQuestion.predictions?.[ctxPartnerUid]}
              myName={user.name}
              partnerName={partnerDisplayName}
              pastAnswers={ctxDailyQuestion._pastAnswers}
              onSubmit={async (text) => {
                const { error } = await submitAnswer(ctxActiveCoupleId, today, authUser.uid, text);
                if (error) { showToast("답변 저장에 실패했어요"); return; }
                trackFeatureUse('daily_question_answer');
                const updatedAnswers = { ...ctxDailyQuestion.answers, [authUser.uid]: { text } };
                const answerCount = Object.keys(updatedAnswers).length;
                if (answerCount >= 2) {
                  await earnGrapes(authUser.uid, ctxActiveCoupleId, 1, 'daily_question');
                  if (ctxPartnerUid) {
                    await earnGrapes(ctxPartnerUid, ctxActiveCoupleId, 1, 'daily_question');
                  }
                  showToast("커플 질문 완료! 양쪽 모두 🍇 +1 포도알");
                } else {
                  showToast("답변을 저장했어요! 💜");
                }
                if (ctxDailyQuestion.questionIndex != null) {
                  getPastAnswers(ctxActiveCoupleId, ctxDailyQuestion.questionIndex);
                }
              }}
              onPredict={async (text) => {
                const { error } = await submitPrediction(ctxActiveCoupleId, today, authUser.uid, text);
                if (error) { showToast("예측 저장에 실패했어요"); return; }
                trackFeatureUse('daily_question_predict');
                const partnerAns = ctxDailyQuestion.answers?.[ctxPartnerUid];
                if (partnerAns && partnerAns.text === text) {
                  await earnGrapes(authUser.uid, ctxActiveCoupleId, 1, 'daily_question_predict_correct');
                  showToast("예측 적중! 🎯 보너스 🍇 +1 포도알");
                } else if (partnerAns) {
                  showToast("아쉽게 빗나갔어요 😅");
                } else {
                  showToast("예측을 저장했어요! 🔮");
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Modal: 오늘 기분 */}
      {homeExpandedCard === "mood" && ctxPartnerUid && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setHomeExpandedCard(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
            width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto",
            animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>😆 오늘의 기분</h3>
              <button onClick={() => setHomeExpandedCard(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} color={colors.textTertiary} />
              </button>
            </div>
            {(() => {
              const myTodayMood = moodHistory.find(m => m.date === today);
              const partnerTodayMood = ctxPartnerMoodHistory.find(m => m.date === today);
              return (
                <CoupleMoodCard
                  myMood={myTodayMood}
                  partnerMood={partnerTodayMood}
                  myName={user.name || '나'}
                  partnerName={partnerDisplayName}
                  onRecordMood={() => setShowMoodPopup(true)}
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal: 칭찬하기 */}
      {homeExpandedCard === "praise" && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setHomeExpandedCard(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
            width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto",
            animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>❤️ 칭찬하기</h3>
              <button onClick={() => setHomeExpandedCard(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} color={colors.textTertiary} />
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {["오늘도 수고했어 💪", "고마워 항상 🥰", "사랑해 ❤️", "같이 있어 좋아 😊"].map(tmpl => (
                <button key={tmpl} onClick={() => setPraiseText(tmpl)} style={{
                  padding: "6px 12px", borderRadius: 20,
                  background: praiseText === tmpl ? colors.grapeLight : "#F3F4F6",
                  border: praiseText === tmpl ? `1px solid ${colors.grape}` : "1px solid transparent",
                  fontSize: 12, color: praiseText === tmpl ? colors.grape : colors.textSecondary,
                  fontWeight: 500, cursor: "pointer",
                }}>
                  {tmpl}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="칭찬 메시지를 입력하세요..."
                value={praiseText}
                onChange={e => setPraiseText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { sendPraise(); setHomeExpandedCard(null); } }}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 12,
                  border: `1.5px solid ${colors.border}`, fontSize: 13,
                  outline: "none", boxSizing: "border-box",
                }}
              />
              <button onClick={() => { sendPraise(); setHomeExpandedCard(null); }} disabled={!praiseText.trim()} style={{
                width: 42, height: 42, borderRadius: 12, border: "none",
                background: praiseText.trim() ? colors.grape : "#E5E7EB",
                color: "#fff", cursor: praiseText.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Section C: 오늘의 할 일 (standalone) ═══ */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>📋 오늘의 할 일</h3>
            <span style={{ fontSize: 12, color: colors.textTertiary }}>
              {chores.filter(c => c.completed).length}/{chores.length} 완료
            </span>
          </div>
          <button onClick={() => setShowAddTodo(true)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: colors.primary,
            display: "flex", alignItems: "center", gap: 2,
          }}>
            관리 &gt;
          </button>
        </div>

        <div style={chores.length >= 3 ? { maxHeight: 220, overflowY: "auto" } : {}}>
          {/* Routine tasks */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {chores.filter(c => c.type === "routine").map(c => (
              <div key={c.id} style={{
                padding: "14px 16px", borderRadius: 14, background: "#fff",
                border: `1px solid ${c.completed ? colors.mintLight : colors.border}`,
                transition: "all 0.2s",
                opacity: c.completed ? 0.6 : 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div onClick={() => toggleChore(c.id)} style={{
                    width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                    background: c.completed ? colors.mint : "transparent",
                    border: c.completed ? "none" : `2px solid ${colors.borderActive}`,
                    transition: "all 0.2s", cursor: "pointer", flexShrink: 0,
                  }}>
                    {c.completed && <Check size={14} color="#fff" />}
                  </div>
                  <div style={{ flex: 1, cursor: "pointer", minWidth: 0 }} onClick={() => toggleChore(c.id)}>
                    <div style={{
                      fontSize: 14, fontWeight: 500, color: colors.text,
                      textDecoration: c.completed ? "line-through" : "none",
                      wordBreak: "break-word",
                    }}>{c.task}</div>
                  </div>
                  <span style={{
                    fontSize: 11, color: c.assignee === "우리" ? colors.grape : (c.assignee === user.name ? colors.primary : colors.warm),
                    background: c.assignee === "우리" ? colors.grapeLight : (c.assignee === user.name ? colors.primaryLight : colors.warmLight),
                    padding: "3px 8px", borderRadius: 6, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap",
                  }}>
                    {c.assignee}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingLeft: 32 }}>
                  {c.days ? (
                    <div style={{ display: "flex", gap: 3 }}>
                      {["월","화","수","목","금","토","일"].map(d => (
                        <span key={d} style={{
                          width: 18, height: 18, borderRadius: 4, fontSize: 9, fontWeight: 600,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: c.days.includes(d) ? colors.primaryLight : "transparent",
                          color: c.days.includes(d) ? colors.primary : colors.textTertiary,
                        }}>{d}</span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 10, color: colors.textTertiary }}>매일</span>
                  )}
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => {
                      setEditTodoId(c.id);
                      setNewTodoText(c.task);
                      setNewTodoType(c.type);
                      setNewTodoAssignee(c.assignee === "우리" ? [user.name, partnerDisplayName] : [c.assignee]);
                      setNewTodoDays(c.days || ["월","화","수","목","금","토","일"]);
                      setShowAddTodo(true);
                    }} style={{
                      padding: "4px 8px", borderRadius: 6, background: "#F3F4F6",
                      border: "none", fontSize: 10, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
                    }}>수정</button>
                    <button onClick={() => setConfirmDeleteTodo(c.id)} style={{
                      padding: "4px 8px", borderRadius: 6, background: colors.roseLight,
                      border: "none", fontSize: 10, fontWeight: 600, color: colors.rose, cursor: "pointer",
                    }}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* One-time tasks */}
          {chores.filter(c => c.type === "once").length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {chores.filter(c => c.type === "once").map(c => (
                <div key={c.id} style={{
                  padding: "14px 16px", borderRadius: 14, background: "#fff",
                  border: `1px solid ${c.completed ? colors.mintLight : colors.border}`,
                  transition: "all 0.2s",
                  opacity: c.completed ? 0.6 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div onClick={() => toggleChore(c.id)} style={{
                      width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                      background: c.completed ? colors.mint : "transparent",
                      border: c.completed ? "none" : `2px solid ${colors.borderActive}`,
                      cursor: "pointer", flexShrink: 0,
                    }}>
                      {c.completed && <Check size={14} color="#fff" />}
                    </div>
                    <div style={{ flex: 1, cursor: "pointer", minWidth: 0 }} onClick={() => toggleChore(c.id)}>
                      <div style={{
                        fontSize: 14, fontWeight: 500, color: colors.text,
                        textDecoration: c.completed ? "line-through" : "none",
                        wordBreak: "break-word",
                      }}>{c.task}</div>
                    </div>
                    <span style={{
                      fontSize: 11, color: c.assignee === "우리" ? colors.grape : (c.assignee === user.name ? colors.primary : colors.warm),
                      background: c.assignee === "우리" ? colors.grapeLight : (c.assignee === user.name ? colors.primaryLight : colors.warmLight),
                      padding: "3px 8px", borderRadius: 6, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap",
                    }}>
                      {c.assignee}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6, gap: 4 }}>
                    <button onClick={() => {
                      setEditTodoId(c.id);
                      setNewTodoText(c.task);
                      setNewTodoType(c.type);
                      setNewTodoAssignee(c.assignee === "우리" ? [user.name, partnerDisplayName] : [c.assignee]);
                      setNewTodoDays(["월","화","수","목","금","토","일"]);
                      setShowAddTodo(true);
                    }} style={{
                      padding: "4px 8px", borderRadius: 6, background: "#F3F4F6",
                      border: "none", fontSize: 10, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
                    }}>수정</button>
                    <button onClick={() => setConfirmDeleteTodo(c.id)} style={{
                      padding: "4px 8px", borderRadius: 6, background: colors.roseLight,
                      border: "none", fontSize: 10, fontWeight: 600, color: colors.rose, cursor: "pointer",
                    }}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Section D: 말랑 도구 (2 buttons) ═══ */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 10 }}>💬 말랑 도구</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => {
            if (!user.surveyCompleted) { setShowSurveyPrompt(true); return; }
            setShowConflictInput(true);
          }} style={{
            flex: 1, padding: "12px 16px", borderRadius: 12,
            background: colors.warmLight, border: `1.5px solid ${colors.warm}33`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <MessageCircle size={16} color={colors.warm} />
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.warm }}>대화 도우미</span>
          </button>
          <button onClick={() => { setTab("report"); setReportSubTab("judge"); }} style={{
            flex: 1, padding: "12px 16px", borderRadius: 12,
            background: colors.primaryLight, border: `1.5px solid ${colors.primary}33`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <BarChart3 size={16} color={colors.primary} />
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>갈등 심판</span>
          </button>
        </div>
      </div>

      {/* Confetti Overlay */}
      {showConfetti && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 300, pointerEvents: "none", overflow: "hidden",
        }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${Math.random() * 100}%`,
              top: "-5%",
              width: Math.random() * 8 + 5,
              height: Math.random() * 12 + 6,
              borderRadius: Math.random() > 0.5 ? "50%" : 2,
              background: ["#7C3AED","#A78BFA","#F59E0B","#10B981","#F43F5E","#8B5CF6","#EC4899","#6366F1"][Math.floor(Math.random() * 8)],
              animation: `confettiFall ${Math.random() * 2 + 2}s linear ${Math.random() * 1}s forwards`,
              opacity: 0.9,
            }} />
          ))}
        </div>
      )}

      {/* Survey Required Prompt */}
      {showSurveyPrompt && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setShowSurveyPrompt(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 24, padding: "32px 24px",
            width: "86%", maxWidth: 340, textAlign: "center",
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, margin: "0 auto 16px",
              background: colors.primaryLight,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={28} color={colors.primary} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: colors.text, marginBottom: 8 }}>
              성향 분석이 필요해요
            </h3>
            <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 24 }}>
              AI 대화 도우미는 우리의 대화 성향을<br/>
              기반으로 맞춤 표현을 추천해요.<br/>
              <span style={{ fontWeight: 600, color: colors.primary }}>성향 분석을 먼저 완료해주세요!</span>
            </p>
            <button onClick={() => {
              setShowSurveyPrompt(false);
              setScreen("onboarding");
            }} style={{
              width: "100%", padding: "15px", borderRadius: 14,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
              color: "#fff", border: "none", fontSize: 15, fontWeight: 700,
              cursor: "pointer", marginBottom: 8,
            }}>
              성향 분석하기 →
            </button>
            <button onClick={() => setShowSurveyPrompt(false)} style={{
              width: "100%", padding: "10px", background: "none",
              border: "none", color: colors.textTertiary, fontSize: 13, cursor: "pointer",
            }}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* AI Conflict Helper Modal */}
      {showConflictInput && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => { setShowConflictInput(false); setAiSuggestion(null); setFeedbackGiven(null); setConflictText(""); setTransformTargetType(null); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
            width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto",
            animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>💬 AI 대화 도우미</h3>
              <button onClick={() => { setShowConflictInput(false); setAiSuggestion(null); setFeedbackGiven(null); setConflictText(""); setTransformTargetType(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} color={colors.textTertiary} />
              </button>
            </div>

            {/* 대상 선택 */}
            {!transformTargetType && !aiSuggestion ? (
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 12, textAlign: "center" }}>
                  누구와의 대화인가요?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={() => setTransformTargetType('partner')} style={{
                    padding: "16px", borderRadius: 14, border: `1.5px solid ${colors.primary}`,
                    background: colors.primaryLight, color: colors.primary,
                    fontSize: 15, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    💑 연인과의 대화
                    <span style={{ fontSize: 10, background: colors.primary, color: "#fff", borderRadius: 6, padding: "2px 6px" }}>지표 반영</span>
                  </button>
                  <button onClick={() => setTransformTargetType('other')} style={{
                    padding: "16px", borderRadius: 14, border: `1.5px solid ${colors.border}`,
                    background: "#F9FAFB", color: colors.textSecondary,
                    fontSize: 15, fontWeight: 600, cursor: "pointer",
                  }}>
                    👤 다른 사람과의 대화
                  </button>
                </div>
              </div>
            ) : !aiSuggestion ? (
              <>
                <div style={{
                  background: colors.warmLight, borderRadius: 12, padding: "12px 14px",
                  fontSize: 12, color: colors.warm, marginBottom: 16, lineHeight: 1.6,
                }}>
                  💡 지금 하려는말 대신 {transformTargetType === 'partner' ? '짝꿍님이 좋아하는' : '상대방에게 맞는'} 스타일로 바꿔드릴게요.
                </div>

                <textarea
                  value={conflictText}
                  onChange={e => setConflictText(e.target.value)}
                  placeholder="하고 싶은 말을 편하게 적어주세요&#10;예) 맨날 나만 설거지하는 것 같아서 짜증나"
                  style={{
                    width: "100%", minHeight: 100, padding: "14px", borderRadius: 14,
                    border: `1.5px solid ${colors.border}`, fontSize: 14, resize: "none",
                    outline: "none", lineHeight: 1.6, boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
                <button onClick={handleConflictSubmit} disabled={!conflictText.trim()} style={{
                  width: "100%", padding: "14px", borderRadius: 12, marginTop: 12,
                  background: conflictText.trim()
                    ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                    : "#E5E7EB",
                  color: conflictText.trim() ? "#fff" : "#9CA3AF",
                  border: "none", fontSize: 15, fontWeight: 700, cursor: conflictText.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  <Sparkles size={16} /> AI 말투 변환하기
                </button>

                {/* 변환 기록 보기 버튼 (AI 말투 변환하기 하단) */}
                {conversationHistory.length > 0 && (
                  <button onClick={() => setShowConversationHistory(true)} style={{
                    width: "100%", marginTop: 10, padding: "12px", borderRadius: 12,
                    background: "#F3F4F6", border: "none",
                    fontSize: 13, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    📋 변환 기록 보기 ({conversationHistory.length}개)
                  </button>
                )}
              </>
            ) : (
              <div>
                {/* 모드 배지 */}
                <div style={{
                  display: "inline-block", padding: "4px 10px", borderRadius: 8, marginBottom: 12,
                  background: aiSuggestion.mode === "성향 맞춤 모드" ? colors.primaryLight : "#FFF7ED",
                  fontSize: 11, fontWeight: 600,
                  color: aiSuggestion.mode === "성향 맞춤 모드" ? colors.primary : "#C2410C",
                }}>
                  {aiSuggestion.mode === "성향 맞춤 모드" ? "🎯 성향 맞춤 모드" : "💡 일반 제안 모드"}
                </div>

                {/* 일반 제안 모드 안내 */}
                {aiSuggestion.mode === "일반 제안 모드" && (
                  <div style={{
                    background: "#FFF7ED", borderRadius: 10, padding: "10px 14px",
                    fontSize: 12, color: "#C2410C", marginBottom: 12, lineHeight: 1.5,
                  }}>
                    상대방 성향 정보가 없어서 일반적인 문구로 제안해 드릴게요!
                  </div>
                )}

                <div style={{
                  background: "#F9FAFB", borderRadius: 12, padding: "14px",
                  marginBottom: 12, borderLeft: `3px solid ${colors.textTertiary}`,
                }}>
                  <p style={{ fontSize: 11, color: colors.textTertiary, marginBottom: 6 }}>원래 하려던 말</p>
                  <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>{aiSuggestion.original}</p>
                </div>

                {/* State A: 성향 맞춤 모드 - 단일 변환 결과 */}
                {aiSuggestion.transformed && !aiSuggestion.options && (
                  <div style={{
                    background: colors.primaryLight, borderRadius: 14, padding: "16px",
                    marginBottom: 12, borderLeft: `3px solid ${colors.primary}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Sparkles size={14} color={colors.primary} />
                      <p style={{ fontSize: 11, color: colors.primary, fontWeight: 600 }}>✨ {aiSuggestion.partnerStyle} 스타일로 변환</p>
                    </div>
                    <p style={{ fontSize: 14, color: colors.text, lineHeight: 1.7, fontWeight: 500 }}>
                      {aiSuggestion.transformed}
                    </p>
                  </div>
                )}

                {/* State B: 일반 제안 모드 - 3가지 선택지 */}
                {aiSuggestion.options && aiSuggestion.options.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    <p style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600, marginBottom: 2 }}>
                      마음에 드는 표현을 선택해보세요
                    </p>
                    {aiSuggestion.options.map((opt, idx) => (
                      <button key={idx} onClick={() => {
                        setAiSuggestion(prev => ({ ...prev, transformed: opt.transformed, partnerStyle: opt.style, options: null, selectedFromOptions: true }));
                      }} style={{
                        background: "#fff", borderRadius: 14, padding: "14px",
                        border: `1.5px solid ${colors.border}`, textAlign: "left", cursor: "pointer",
                        transition: "all 0.2s",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{
                            display: "inline-block", width: 22, height: 22, borderRadius: "50%",
                            background: [colors.primaryLight, colors.mintLight, colors.goldLight][idx],
                            color: [colors.primary, colors.mint, colors.gold][idx],
                            fontSize: 11, fontWeight: 700, textAlign: "center", lineHeight: "22px",
                          }}>{idx + 1}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary }}>
                            {opt.style}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: colors.text, lineHeight: 1.6, margin: 0 }}>
                          {opt.transformed}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <div style={{
                  background: colors.mintLight, borderRadius: 10, padding: "10px 14px",
                  fontSize: 12, color: colors.mint, marginBottom: 16, lineHeight: 1.5,
                }}>
                  🌱 {aiSuggestion.tip}
                </div>

                {/* 복사/공유 버튼 (단일 결과가 선택된 상태에서만) */}
                {aiSuggestion.transformed && !aiSuggestion.options && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <button onClick={() => {
                      navigator.clipboard?.writeText?.(aiSuggestion.transformed.replace(/"/g, ""));
                      showToast("문장이 복사되었어요! 📋");
                    }} style={{
                      flex: 1, padding: "12px", borderRadius: 12,
                      background: colors.primary, color: "#fff", border: "none",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      <Copy size={14} /> 복사하기
                    </button>
                    <button onClick={async () => {
                      const shareText = aiSuggestion.transformed.replace(/"/g, "");
                      if (navigator.share) {
                        try {
                          await navigator.share({ text: shareText });
                        } catch (e) {
                          if (e.name !== 'AbortError') showToast("공유에 실패했어요");
                        }
                      } else {
                        navigator.clipboard?.writeText?.(shareText);
                        showToast("클립보드에 복사되었어요! 원하는 앱에서 붙여넣기 해주세요");
                      }
                    }} style={{
                      flex: 1, padding: "12px", borderRadius: 12,
                      background: "#FEE500", color: "#3C1E1E", border: "none",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      <Share2 size={14} /> 공유하기
                    </button>
                  </div>
                )}

                {/* 피드백 (단일 결과가 선택된 상태에서만) */}
                {aiSuggestion.transformed && !aiSuggestion.options && (
                  <>
                    {!feedbackGiven ? (
                      <div>
                        <p style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8, textAlign: "center" }}>
                          이 표현으로 대화해본 결과는요? (나중에도 입력 가능)
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                          {[
                            { label: "성공 😊", value: "success", bg: colors.mintLight, color: colors.mint },
                            { label: "보통 😐", value: "normal", bg: colors.goldLight, color: colors.gold },
                            { label: "아쉬움 😢", value: "fail", bg: colors.roseLight, color: colors.rose },
                          ].map(fb => (
                            <button key={fb.value} onClick={() => {
                              setFeedbackGiven(fb.value);
                              if (aiSuggestion?.id) {
                                updateConversationFeedback(aiSuggestion.id, fb.value);
                              }
                              showToast(fb.value === "success" ? "대화 성공! 좋은 소통이었어요 😊" : "피드백 감사해요! 더 나은 제안을 할게요");
                            }} style={{
                              flex: 1, padding: "10px 6px", borderRadius: 10,
                              background: fb.bg, color: fb.color, border: "none",
                              fontSize: 12, fontWeight: 600, cursor: "pointer",
                            }}>
                              {fb.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        textAlign: "center", padding: "14px", background: "#F0FDF4",
                        borderRadius: 12, fontSize: 13, color: colors.mint,
                      }}>
                        ✅ 피드백이 저장되었어요. 더 좋은 조언을 위해 활용할게요!
                      </div>
                    )}
                  </>
                )}

                {/* 대화 기록 보기 버튼 */}
                {conversationHistory.length > 0 && (
                  <button onClick={() => setShowConversationHistory(true)} style={{
                    width: "100%", marginTop: 16, padding: "12px", borderRadius: 12,
                    background: "#F3F4F6", border: "none",
                    fontSize: 13, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    📋 변환 기록 보기 ({conversationHistory.length}개)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 대화 변환 기록 모달 */}
      {showConversationHistory && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setShowConversationHistory(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
            width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto",
            animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>📋 대화 변환 기록</h3>
              <button onClick={() => setShowConversationHistory(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} color={colors.textTertiary} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
              변환된 대화의 결과를 기록하면 AI가 더 나은 제안을 해드려요.
            </p>

            {conversationHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: colors.textTertiary }}>
                아직 변환 기록이 없어요
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {conversationHistory.map((item, index) => (
                  <div key={item.id} style={{
                    background: "#F9FAFB", borderRadius: 14, padding: "14px",
                    border: `1px solid ${colors.border}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: colors.textTertiary }}>
                        {new Date(item.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.feedback && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 8,
                          background: item.feedback === "success" ? colors.mintLight :
                                      item.feedback === "normal" ? colors.goldLight : colors.roseLight,
                          color: item.feedback === "success" ? colors.mint :
                                 item.feedback === "normal" ? colors.gold : colors.rose,
                        }}>
                          {item.feedback === "success" ? "성공 😊" : item.feedback === "normal" ? "보통 😐" : "아쉬움 😢"}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: 11, color: colors.textTertiary, marginBottom: 4 }}>원래 말:</p>
                    <p style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 10, lineHeight: 1.4 }}>
                      {item.original.length > 50 ? item.original.substring(0, 50) + "..." : item.original}
                    </p>

                    <p style={{ fontSize: 11, color: colors.primary, marginBottom: 4 }}>✨ 변환된 말:</p>
                    <p style={{ fontSize: 12, color: colors.text, marginBottom: 10, lineHeight: 1.4, fontWeight: 500 }}>
                      {item.transformed.length > 60 ? item.transformed.substring(0, 60) + "..." : item.transformed}
                    </p>

                    {/* 피드백 미입력 시 버튼 표시 */}
                    {!item.feedback && (
                      <div>
                        <p style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>결과를 알려주세요:</p>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[
                            { label: "성공", value: "success", bg: colors.mintLight, color: colors.mint },
                            { label: "보통", value: "normal", bg: colors.goldLight, color: colors.gold },
                            { label: "아쉬움", value: "fail", bg: colors.roseLight, color: colors.rose },
                          ].map(fb => (
                            <button key={fb.value} onClick={() => {
                              updateConversationFeedback(item.id, fb.value);
                              showToast(fb.value === "success" ? "대화 성공! 좋은 소통이었어요 😊" : "피드백 감사해요!");
                            }} style={{
                              flex: 1, padding: "8px 4px", borderRadius: 8,
                              background: fb.bg, color: fb.color, border: "none",
                              fontSize: 11, fontWeight: 600, cursor: "pointer",
                            }}>
                              {fb.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Todo Popup (position: fixed) */}
        {showAddTodo && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
          }} onClick={() => { setShowAddTodo(false); setEditTodoId(null); setNewTodoText(""); setNewTodoAssignee([]); setNewTodoDays(["월","화","수","목","금","토","일"]); }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: "#fff", borderRadius: 20, padding: "24px 22px",
              width: "88%", maxWidth: 360,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 18 }}>
                {editTodoId ? "✏️ 할 일 수정" : "✏️ 할 일 추가"}
              </h3>

              <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>
                할 일
              </label>
              <input
                type="text"
                placeholder="예: 마트 장보기, 택배 수령..."
                value={newTodoText}
                onChange={e => setNewTodoText(e.target.value)}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: `1.5px solid ${colors.border}`, fontSize: 14,
                  outline: "none", marginBottom: 16, boxSizing: "border-box",
                }}
              />

              <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>
                담당자 (복수 선택 가능)
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[user.name, partnerDisplayName].map(name => {
                  const isSelected = newTodoAssignee.includes(name);
                  return (
                    <button key={name} onClick={() => {
                      setNewTodoAssignee(prev => {
                        const arr = Array.isArray(prev) ? prev : (prev ? [prev] : []);
                        return arr.includes(name) ? arr.filter(n => n !== name) : [...arr, name];
                      });
                    }} style={{
                      flex: 1, padding: "10px 0", borderRadius: 10,
                      background: isSelected
                        ? (name === user.name ? colors.primaryLight : colors.warmLight)
                        : "#F3F4F6",
                      color: isSelected
                        ? (name === user.name ? colors.primary : colors.warm)
                        : colors.textTertiary,
                      border: isSelected
                        ? `1.5px solid ${name === user.name ? colors.primary : colors.warm}`
                        : "1.5px solid transparent",
                      fontSize: 14, fontWeight: 600, cursor: "pointer",
                    }}>
                      {isSelected ? "✓ " : ""}{name}
                    </button>
                  );
                })}
              </div>

              <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>
                유형
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: newTodoType === "routine" ? 12 : 24 }}>
                {[
                  { key: "routine", label: "🔄 정기 루틴" },
                  { key: "once", label: "⚡ 오늘만" },
                ].map(t => (
                  <button key={t.key} onClick={() => setNewTodoType(t.key)} style={{
                    flex: 1, padding: "12px 10px", borderRadius: 12,
                    background: newTodoType === t.key ? colors.primaryLight : "#F3F4F6",
                    color: newTodoType === t.key ? colors.primary : colors.textTertiary,
                    border: newTodoType === t.key ? `1.5px solid ${colors.primary}` : "1.5px solid transparent",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    textAlign: "center",
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {newTodoType === "routine" && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, display: "block", marginBottom: 8 }}>
                    반복 요일
                  </label>
                  <div style={{ display: "flex", gap: 5 }}>
                    {["월","화","수","목","금","토","일"].map(day => {
                      const selected = newTodoDays.includes(day);
                      const isWeekend = day === "토" || day === "일";
                      return (
                        <button key={day} onClick={() => {
                          setNewTodoDays(selected
                            ? newTodoDays.filter(d => d !== day)
                            : [...newTodoDays, day]
                          );
                        }} style={{
                          flex: 1, height: 38, borderRadius: 10,
                          background: selected ? colors.primary : "#F3F4F6",
                          color: selected ? "#fff" : (isWeekend ? colors.rose : colors.textTertiary),
                          border: "none", fontSize: 13, fontWeight: 600,
                          cursor: "pointer", transition: "all 0.15s",
                        }}>
                          {day}
                        </button>
                      );
                    })}
                    <button onClick={() => {
                      setNewTodoDays(newTodoDays.length === 7 ? [] : ["월","화","수","목","금","토","일"]);
                    }} style={{
                      height: 38, padding: "0 12px", borderRadius: 10,
                      background: newTodoDays.length === 7 ? colors.primaryLight : "#F3F4F6",
                      color: newTodoDays.length === 7 ? colors.primary : colors.textTertiary,
                      border: newTodoDays.length === 7 ? `1.5px solid ${colors.primary}` : "1.5px solid transparent",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      매일
                    </button>
                  </div>
                  {newTodoDays.length > 0 && newTodoDays.length < 7 && (
                    <p style={{ fontSize: 11, color: colors.textTertiary, marginTop: 6 }}>
                      매주 {newTodoDays.join(" · ")} 반복
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => {
                  setShowAddTodo(false);
                  setEditTodoId(null);
                  setNewTodoText("");
                  setNewTodoAssignee([]);
                  setNewTodoDays(["월","화","수","목","금","토","일"]);
                }} style={{
                  flex: 1, padding: "14px", borderRadius: 12,
                  background: "#F3F4F6", color: colors.textSecondary,
                  border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer",
                }}>
                  취소
                </button>
                <button onClick={() => {
                  if (!newTodoText.trim()) return;
                  if (newTodoType === "routine" && newTodoDays.length === 0) return;
                  const assigneeArr = Array.isArray(newTodoAssignee) ? newTodoAssignee : (newTodoAssignee ? [newTodoAssignee] : []);
                  const assigneeStr = assigneeArr.length === 2 ? "우리" : (assigneeArr[0] || user.name);
                  if (editTodoId) {
                    // 수정 모드
                    setChores(prev => prev.map(c => c.id === editTodoId ? {
                      ...c, task: newTodoText.trim(), assignee: assigneeStr, type: newTodoType,
                      days: newTodoType === "routine" ? [...newTodoDays] : undefined,
                    } : c));
                    showToast("할 일이 수정되었어요! ✏️");
                  } else {
                    // 추가 모드
                    setChores(prev => [...prev, {
                      id: Date.now(), task: newTodoText.trim(), assignee: assigneeStr,
                      completed: false, icon: "home", type: newTodoType,
                      days: newTodoType === "routine" ? [...newTodoDays] : undefined,
                    }]);
                    showToast("할 일이 추가되었어요! ✅");
                  }
                  setNewTodoText("");
                  setNewTodoAssignee([]);
                  setNewTodoDays(["월","화","수","목","금","토","일"]);
                  setShowAddTodo(false);
                  setEditTodoId(null);
                }} style={{
                  flex: 1, padding: "14px", borderRadius: 12,
                  background: (newTodoText.trim() && (newTodoType !== "routine" || newTodoDays.length > 0))
                    ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                    : "#E5E7EB",
                  color: (newTodoText.trim() && (newTodoType !== "routine" || newTodoDays.length > 0)) ? "#fff" : "#9CA3AF",
                  border: "none", fontSize: 15, fontWeight: 700,
                  cursor: (newTodoText.trim() && (newTodoType !== "routine" || newTodoDays.length > 0)) ? "pointer" : "default",
                }}>
                  {editTodoId ? "수정" : "추가"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
    );
  };

  const renderGrape = () => (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ padding: "16px 0 12px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>🍇 말랑 현황</h2>
      </div>

      {/* Sub-tabs: 포도알 / 칭찬하기 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { key: "grape", label: "🍇 포도알" },
          { key: "praise", label: "💜 칭찬하기" },
        ].map(t => (
          <button key={t.key} onClick={() => setGrapeSubTab(t.key)} style={{
            flex: 1, padding: "10px 8px", borderRadius: 12,
            background: grapeSubTab === t.key ? colors.primary : "#fff",
            color: grapeSubTab === t.key ? "#fff" : colors.textSecondary,
            border: grapeSubTab === t.key ? "none" : `1px solid ${colors.border}`,
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {grapeSubTab === "grape" && (<>
      {/* Hide completed toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button onClick={() => setHideCompletedBoards(!hideCompletedBoards)} style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          fontSize: 12, fontWeight: 600, color: hideCompletedBoards ? colors.primary : colors.textTertiary, cursor: "pointer",
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: 4,
            border: `1.5px solid ${hideCompletedBoards ? colors.primary : colors.border}`,
            background: hideCompletedBoards ? colors.primaryLight : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{hideCompletedBoards && <Check size={12} color={colors.primary} />}</div>
          달성 완료 숨기기
        </button>
      </div>
      {/* Multi Grape Boards */}
      {grapeBoards
        .filter(board => !hideCompletedBoards || board.current < board.goal)
        .map(board => {
        const pct = Math.min((board.current / board.goal) * 100, 100);
        const filledForCluster = Math.min(Math.round((board.current / board.goal) * 36), 36);
        const isAnimating = animatingBoardId === board.id;
        const ownerLabel = board.owner === "우리" ? "🤝 우리" : board.owner === user.name ? `👤 ${user.name}` : `💜 ${board.owner || "우리"}`;
        const ownerColor = board.owner === "우리" ? colors.grape : board.owner === user.name ? colors.primary : colors.warm;
        const ownerBg = board.owner === "우리" ? colors.grapeLight : board.owner === user.name ? colors.primaryLight : colors.warmLight;
        return (
          <div key={board.id} style={{
            background: "#fff", borderRadius: 16, padding: "16px",
            border: `1px solid ${colors.border}`, marginBottom: 10,
            boxShadow: colors.shadow,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{board.title}</h3>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: ownerColor, background: ownerBg,
                  padding: "2px 6px", borderRadius: 6,
                }}>{ownerLabel}</span>
              </div>
              <span style={{
                fontSize: 10, color: colors.grape, background: colors.grapeLight,
                padding: "2px 7px", borderRadius: 6, fontWeight: 600,
              }}>
                1회 +{board.perSuccess}알
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                flexShrink: 0, position: "relative",
                animation: isAnimating ? "grapePop 0.5s ease" : "none",
              }}>
                <GrapeCluster filled={filledForCluster} total={36} size="small" />
                {/* Floating +N particle */}
                {isAnimating && (
                  <>
                    <div style={{
                      position: "absolute", top: "30%", left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: 16, fontWeight: 800, color: colors.grape,
                      animation: "grapeFloat 0.7s ease-out forwards",
                      pointerEvents: "none", whiteSpace: "nowrap",
                    }}>
                      +{board.perSuccess} 🍇
                    </div>
                    <div style={{
                      position: "absolute", top: "20%", left: "20%",
                      fontSize: 14,
                      animation: "grapeShine 0.6s ease-out 0.1s forwards",
                      pointerEvents: "none", opacity: 0,
                    }}>✨</div>
                    <div style={{
                      position: "absolute", top: "40%", right: "10%",
                      fontSize: 12,
                      animation: "grapeShine 0.6s ease-out 0.25s forwards",
                      pointerEvents: "none", opacity: 0,
                    }}>✨</div>
                  </>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 26, fontWeight: 800, color: colors.grape,
                    animation: isAnimating ? "grapePop 0.4s ease 0.1s" : "none",
                  }}>{board.current}</span>
                  <span style={{ fontSize: 13, color: colors.textTertiary }}>/ {board.goal}</span>
                </div>
                <div style={{
                  width: "100%", height: 6, background: "#EDE9FE",
                  borderRadius: 3, overflow: "hidden", marginBottom: 8,
                }}>
                  <div style={{
                    width: `${pct}%`, height: 6, borderRadius: 3,
                    background: pct >= 100
                      ? `linear-gradient(90deg, ${colors.mint}, #059669)`
                      : `linear-gradient(90deg, ${colors.grape}, ${colors.primary})`,
                    transition: "width 0.5s ease",
                    animation: isAnimating ? "grapeGlow 0.6s ease" : "none",
                  }} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={async () => {
                    if (pct >= 100) return;
                    setAnimatingBoardId(board.id);
                    setTimeout(() => setAnimatingBoardId(null), 800);
                    const coupleId = user.coupleId;
                    const newCurrent = Math.min((board.current || board.progress || 0) + board.perSuccess, board.goal);
                    const willComplete = newCurrent >= board.goal;
                    if (coupleId && authUser) {
                      const { error } = await updateGrapeBoardProgress(coupleId, board.id, authUser.uid, board.perSuccess);
                      if (error) { showToast(error, "error"); return; }
                    } else {
                      if (authUser) {
                        const { error } = await earnGrapes(authUser.uid, null, board.perSuccess, 'grape_board_progress', { boardId: board.id });
                        if (error) { showToast(error, "error"); return; }
                      }
                      setGrapeBoards(boards => boards.map(b =>
                        b.id === board.id ? { ...b, current: newCurrent } : b
                      ));
                    }
                    if (willComplete) {
                      const title = board.title;
                      trackFeatureUse('grape_board_complete');
                      setTimeout(() => {
                        setRewardBoardTitle(title);
                        setShowConfetti(true);
                        setShowRewardModal(true);
                        setTimeout(() => setShowConfetti(false), 3500);
                      }, 600);
                    } else {
                      showToast(`${board.title} 성공! 🍇 +${board.perSuccess}`);
                    }
                  }} style={{
                    padding: "6px 14px", borderRadius: 8,
                    background: pct >= 100 ? "#E5E7EB" : colors.grape,
                    color: pct >= 100 ? colors.textTertiary : "#fff",
                    border: "none", fontSize: 12, fontWeight: 600, cursor: pct >= 100 ? "default" : "pointer",
                  }}>
                    {pct >= 100 ? "달성 완료! 🎉" : "성공"}
                  </button>
                  <button onClick={() => {
                    setEditBoard(board);
                    setNewBoard({ title: board.title, goal: board.goal, perSuccess: board.perSuccess, owner: board.owner || "우리" });
                  }} style={{
                    padding: "6px 10px", borderRadius: 8,
                    background: "#F3F4F6", border: "none",
                    fontSize: 12, color: colors.textSecondary, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 3,
                  }}>
                    <Settings size={12} /> 수정
                  </button>
                  <button onClick={() => setConfirmDeleteBoard(board.id)} style={{
                    padding: "6px 10px", borderRadius: 8,
                    background: colors.roseLight, border: "none",
                    fontSize: 12, color: colors.rose, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 3,
                  }}>
                    <Trash2 size={12} /> 삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {grapeBoards.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", background: "#fff", borderRadius: 16, border: `1px solid ${colors.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍇</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 8 }}>아직 포도판이 없어요</h3>
          <p style={{ fontSize: 13, color: colors.textTertiary, lineHeight: 1.6 }}>
            목표를 세우고 포도알을 모아보세요!<br/>포도판을 완성하면 달성 축하를 받을 수 있어요
          </p>
        </div>
      )}

      {/* New Board Button */}
      <button onClick={() => setShowNewBoard(true)} style={{
        width: "100%", padding: "16px", borderRadius: 16,
        border: `2px dashed ${colors.borderActive}`, background: "transparent",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontSize: 14, fontWeight: 600, color: colors.textSecondary,
        cursor: "pointer", marginBottom: 20,
      }}>
        <Plus size={18} /> 새 포도판 만들기
      </button>

      {/* New / Edit Board Modal */}
      {(showNewBoard || editBoard) && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => { setShowNewBoard(false); setEditBoard(null); setNewBoard({ title: "", goal: 20, perSuccess: 2, owner: "우리" }); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: "28px 24px",
            width: "88%", maxWidth: 360,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 20 }}>
              {editBoard ? "✏️ 포도판 수정" : "🍇 새 포도판 만들기"}
            </h3>

            <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>
              누구의 포도판인가요?
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[
                { key: "우리", label: "🤝 우리" },
                { key: user.name || "나", label: `👤 ${user.name || "나"}` },
                { key: partnerDisplayName, label: `💜 ${partnerDisplayName}` },
              ].map(o => (
                <button key={o.key} onClick={() => setNewBoard({ ...newBoard, owner: o.key })} style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10,
                  background: newBoard.owner === o.key ? colors.primaryLight : "#F3F4F6",
                  color: newBoard.owner === o.key ? colors.primary : colors.textTertiary,
                  border: newBoard.owner === o.key ? `1.5px solid ${colors.primary}` : "1.5px solid transparent",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>{o.label}</button>
              ))}
            </div>

            <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>
              포도판 제목
            </label>
            <input
              type="text"
              placeholder="예: 집안일 돕기, 예쁜 말 하기"
              value={newBoard.title}
              onChange={e => setNewBoard({ ...newBoard, title: e.target.value })}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 12,
                border: `1.5px solid ${colors.border}`, fontSize: 14,
                outline: "none", marginBottom: 16, boxSizing: "border-box",
              }}
            />

            <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>
              목표 포도알 개수
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[10, 20, 30, 50].map(n => (
                <button key={n} onClick={() => setNewBoard({ ...newBoard, goal: n })} style={{
                  padding: "8px 16px", borderRadius: 10,
                  background: newBoard.goal === n ? colors.grape : "#F3F4F6",
                  color: newBoard.goal === n ? "#fff" : colors.textSecondary,
                  border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  {n}알
                </button>
              ))}
            </div>

            <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>
              1회 성공 시 적립 개수
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {[1, 2, 3, 5].map(n => (
                <button key={n} onClick={() => setNewBoard({ ...newBoard, perSuccess: n })} style={{
                  padding: "8px 16px", borderRadius: 10,
                  background: newBoard.perSuccess === n ? colors.primary : "#F3F4F6",
                  color: newBoard.perSuccess === n ? "#fff" : colors.textSecondary,
                  border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  {n}알
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => {
                setShowNewBoard(false);
                setEditBoard(null);
                setNewBoard({ title: "", goal: 20, perSuccess: 2, owner: "우리" });
              }} style={{
                flex: 1, padding: "14px", borderRadius: 12,
                background: "#F3F4F6", color: colors.textSecondary,
                border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>
                취소
              </button>
              <button onClick={async () => {
                if (!newBoard.title.trim()) return;
                const coupleId = user.coupleId;
                if (editBoard) {
                  if (coupleId) {
                    const { error } = await updateGrapeBoard(coupleId, editBoard.id, { title: newBoard.title, goal: newBoard.goal, perSuccess: newBoard.perSuccess, owner: newBoard.owner });
                    if (error) { showToast("포도판 수정 실패: " + error, "error"); return; }
                    setGrapeBoards(prev => prev.map(b => b.id === editBoard.id ? { ...b, title: newBoard.title, goal: newBoard.goal, perSuccess: newBoard.perSuccess, owner: newBoard.owner } : b));
                  } else {
                    setGrapeBoards(prev => prev.map(b =>
                      b.id === editBoard.id
                        ? { ...b, title: newBoard.title, goal: newBoard.goal, perSuccess: newBoard.perSuccess, owner: newBoard.owner }
                        : b
                    ));
                  }
                  showToast("포도판이 수정되었어요! ✏️");
                } else {
                  if (coupleId) {
                    const { id, error } = await createGrapeBoard(coupleId, { title: newBoard.title, goal: newBoard.goal, perSuccess: newBoard.perSuccess, owner: newBoard.owner });
                    if (error) { showToast("포도판 생성 실패: " + error, "error"); return; }
                    // Firestore 리스너 대기 없이 즉시 로컬 반영
                    setGrapeBoards(prev => [...prev, { id: id || Date.now(), title: newBoard.title, goal: newBoard.goal, perSuccess: newBoard.perSuccess, owner: newBoard.owner, current: 0, progress: 0 }]);
                  } else {
                    setGrapeBoards(prev => [...prev, { ...newBoard, id: Date.now(), current: 0 }]);
                  }
                  showToast("새 포도판이 만들어졌어요! 🍇");
                }
                setNewBoard({ title: "", goal: 20, perSuccess: 2, owner: "우리" });
                setShowNewBoard(false);
                setEditBoard(null);
              }} style={{
                flex: 1, padding: "14px", borderRadius: 12,
                background: newBoard.title.trim()
                  ? `linear-gradient(135deg, ${colors.grape}, ${colors.primary})`
                  : "#E5E7EB",
                color: newBoard.title.trim() ? "#fff" : "#9CA3AF",
                border: "none", fontSize: 15, fontWeight: 700,
                cursor: newBoard.title.trim() ? "pointer" : "default",
              }}>
                {editBoard ? "수정" : "만들기"}
              </button>
            </div>
          </div>
        </div>
      )}

      </>)}

      {grapeSubTab === "praise" && (<>
      {/* Send Praise */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: "18px",
        border: `1px solid ${colors.border}`, marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 12 }}>
          💌 {partnerDisplayName}님에게 칭찬하기
        </h3>
        <div style={{ display: "flex", gap: 8, width: "100%", boxSizing: "border-box" }}>
          <input
            type="text"
            placeholder="칭찬 한 마디를 적어주세요"
            value={praiseText}
            onChange={e => setPraiseText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendPraise()}
            style={{
              flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: 12,
              border: `1.5px solid ${colors.border}`, fontSize: 13,
              outline: "none", boxSizing: "border-box",
            }}
          />
          <button onClick={sendPraise} style={{
            padding: "12px 14px", borderRadius: 12,
            background: colors.grape, color: "#fff", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center",
            flexShrink: 0,
          }}>
            <Send size={16} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {["고마워 💕", "오늘 수고했어!", "넌 최고야 ⭐", "사랑해 ❤️"].map(q => (
            <button key={q} onClick={() => { setPraiseText(q); }} style={{
              padding: "6px 12px", borderRadius: 8, background: colors.grapeLight,
              border: "none", fontSize: 12, color: colors.grape, cursor: "pointer",
              fontWeight: 500,
            }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Praise History */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 10 }}>칭찬 히스토리</h3>
      {praiseLog.length === 0 ? (
        <div style={{ padding: "30px 20px", textAlign: "center", background: "#fff", borderRadius: 14, border: `1px dashed ${colors.borderActive}` }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💜</div>
          <p style={{ fontSize: 13, color: colors.textTertiary }}>아직 칭찬 기록이 없어요<br/>위에서 첫 칭찬을 보내보세요!</p>
        </div>
      ) : (<>
      {praiseLog.slice(praisePage * 10, (praisePage + 1) * 10).map(p => (
        <div key={p.id} style={{
          background: "#fff", borderRadius: 14, padding: "14px 16px",
          border: `1px solid ${colors.border}`, marginBottom: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.primary }}>{p.from}</span>
              <span style={{ fontSize: 11, color: colors.textTertiary }}>· {p.date}</span>
            </div>
            {p.from === (user.name || "나") && (
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => { setEditPraiseId(p.id); setEditPraiseText(p.message); }} style={{
                  padding: "3px 8px", borderRadius: 6, background: "#F3F4F6",
                  border: "none", fontSize: 10, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
                }}>수정</button>
                <button onClick={() => setConfirmDeletePraise(p.id)} style={{
                  padding: "3px 8px", borderRadius: 6, background: colors.roseLight,
                  border: "none", fontSize: 10, fontWeight: 600, color: colors.rose, cursor: "pointer",
                }}>삭제</button>
              </div>
            )}
          </div>
          {editPraiseId === p.id ? (
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <input type="text" value={editPraiseText} onChange={e => setEditPraiseText(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${colors.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              <button onClick={() => {
                if (editPraiseText.trim()) {
                  setPraiseLog(prev => prev.map(pr => pr.id === p.id ? { ...pr, message: editPraiseText.trim() } : pr));
                  showToast("칭찬이 수정되었어요! ✏️");
                }
                setEditPraiseId(null); setEditPraiseText("");
              }} style={{ padding: "8px 12px", borderRadius: 8, background: colors.primary, color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>저장</button>
              <button onClick={() => { setEditPraiseId(null); setEditPraiseText(""); }} style={{ padding: "8px 10px", borderRadius: 8, background: "#F3F4F6", border: "none", fontSize: 12, fontWeight: 600, color: colors.textSecondary, cursor: "pointer" }}>취소</button>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: colors.text, marginTop: 4 }}>{p.message}</p>
          )}
        </div>
      ))}
      {praiseLog.length > 10 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 12 }}>
          <button onClick={() => setPraisePage(p => Math.max(0, p - 1))} disabled={praisePage === 0} style={{
            padding: "8px 14px", borderRadius: 8,
            background: praisePage === 0 ? "#F3F4F6" : colors.primaryLight,
            color: praisePage === 0 ? colors.textTertiary : colors.primary,
            border: "none", fontSize: 12, fontWeight: 600, cursor: praisePage === 0 ? "default" : "pointer",
          }}>← 이전</button>
          <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>
            {praisePage + 1} / {Math.ceil(praiseLog.length / 10)}
          </span>
          <button onClick={() => setPraisePage(p => Math.min(Math.ceil(praiseLog.length / 10) - 1, p + 1))}
            disabled={praisePage >= Math.ceil(praiseLog.length / 10) - 1} style={{
            padding: "8px 14px", borderRadius: 8,
            background: praisePage >= Math.ceil(praiseLog.length / 10) - 1 ? "#F3F4F6" : colors.primaryLight,
            color: praisePage >= Math.ceil(praiseLog.length / 10) - 1 ? colors.textTertiary : colors.primary,
            border: "none", fontSize: 12, fontWeight: 600,
            cursor: praisePage >= Math.ceil(praiseLog.length / 10) - 1 ? "default" : "pointer",
          }}>다음 →</button>
        </div>
      )}
      </>)}
      </>)}
    </div>
  );

  // ─── Coupon Tab ────────────────────────────────────────
  const renderCoupon = () => (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ padding: "16px 0 20px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>🎫 커플 쿠폰</h2>
        <p style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
          직접 만든 쿠폰을 주고받으며 사랑을 표현해보세요
        </p>
      </div>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[
          { key: "sent", label: `내가 보낸 (${myCoupons.filter(c => c.from === user.name).length})` },
          { key: "received", label: `내가 받은 (${myCoupons.filter(c => c.to === user.name && c.status !== "draft").length})` },
          { key: "registered", label: `등록한 쿠폰 (${shopCoupons.filter(sc => sc.registeredBy === user.name).length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setCouponViewTab(t.key)} style={{
            flex: 1, padding: "10px 8px", borderRadius: 12,
            background: couponViewTab === t.key ? colors.primaryLight : "#F3F4F6",
            color: couponViewTab === t.key ? colors.primary : colors.textTertiary,
            border: couponViewTab === t.key ? `1.5px solid ${colors.primary}` : "1.5px solid transparent",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            {t.label}
          </button>
        ))}
      </div>
      {couponViewTab === "sent" && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <button onClick={() => {
            setCouponCreateMode("personal");
            setEditCouponId(null);
            setNewCoupon({ title: "", desc: "", expiry: "" });
            setShowCouponCreate(true);
          }} style={{
            background: "none", border: "none", fontSize: 12, fontWeight: 600,
            color: colors.primary, cursor: "pointer",
          }}>새 쿠폰 만들기 &gt;</button>
        </div>
      )}

      {/* Sent */}
      {couponViewTab === "sent" && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {["전체", "사용", "미사용"].map(f => (
              <button key={f} onClick={() => setSentCouponFilter(f)} style={{
                padding: "6px 12px", borderRadius: 8,
                background: sentCouponFilter === f ? colors.primary : "#F3F4F6",
                color: sentCouponFilter === f ? "#fff" : colors.textTertiary,
                border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}>{f}</button>
            ))}
          </div>
          {(() => {
            const allSent = myCoupons.filter(c => c.from === user.name);
            const filtered = sentCouponFilter === "전체" ? allSent
              : sentCouponFilter === "사용" ? allSent.filter(c => c.status === "used")
              : allSent.filter(c => c.status !== "used");
            return filtered.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {filtered.map(coupon => {
                  const daysLeft = Math.max(0, Math.ceil((new Date(coupon.expiry) - new Date()) / 86400000));
                  return (
                    <div key={coupon.id} style={{
                      background: "#fff", borderRadius: 16, padding: "14px 12px",
                      border: `1px solid ${colors.border}`, textAlign: "center",
                      boxShadow: colors.shadow, opacity: coupon.status === "used" ? 0.6 : 1,
                      position: "relative",
                    }}>
                      <div style={{ position: "absolute", top: 8, right: 8 }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          padding: "2px 6px", borderRadius: 10, fontSize: 8, fontWeight: 700,
                          background: coupon.status === "used" ? colors.mintLight : "#F3F4F6",
                          color: coupon.status === "used" ? colors.mint : colors.textTertiary,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: coupon.status === "used" ? colors.mint : colors.textTertiary }}/>
                          {coupon.status === "used" ? "사용" : "미사용"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, marginTop: 4 }}><CouponIcon size={28} color={coupon.status === "used" ? "#9CA3AF" : "#7C3AED"} /></div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 2, textDecoration: coupon.status === "used" ? "line-through" : "none" }}>{coupon.title}</div>
                      <div style={{ fontSize: 10, color: colors.textTertiary, marginBottom: 8 }}>
                        {coupon.status === "used" ? "사용 완료" : (daysLeft <= 0 ? "만료" : `D-${daysLeft}`)} · → {coupon.to}
                      </div>
                      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 4 }}>
                        {coupon.status === "draft" && (
                          <button onClick={() => {
                            if (!user.partnerConnected) {
                              setPartnerRequiredAction("coupon");
                              setShowPartnerRequiredPopup(true);
                              return;
                            }
                            setConfirmSendCoupon(coupon.id);
                          }} style={{
                            padding: "5px 10px", borderRadius: 6,
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                            border: "none", fontSize: 10, fontWeight: 700, color: "#fff", cursor: "pointer",
                          }}>보내기</button>
                        )}
                        {coupon.status !== "used" && (
                          <button onClick={() => { setEditCouponId(coupon.id); setNewCoupon({ title: coupon.title, desc: coupon.desc, expiry: coupon.expiry }); setShowCouponCreate(true); }} style={{
                            padding: "5px 8px", borderRadius: 6, background: "#F3F4F6", border: "none", fontSize: 10, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
                          }}>수정</button>
                        )}
                        {coupon.status !== "used" && (
                          <button onClick={() => setConfirmDeleteCoupon(coupon.id)} style={{
                            padding: "5px 8px", borderRadius: 6, background: colors.roseLight, border: "none", fontSize: 10, fontWeight: 600, color: colors.rose, cursor: "pointer",
                          }}>삭제</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><CouponIcon size={32} /></div>
                <p style={{ fontSize: 14, color: colors.textTertiary }}>{sentCouponFilter === "전체" ? "아직 보낸 쿠폰이 없어요" : `${sentCouponFilter} 쿠폰이 없어요`}</p>
              </div>
            );
          })()}
        </>
      )}

      {/* Received */}
      {couponViewTab === "received" && (
        <>
          {myCoupons.filter(c => c.to === user.name && c.status !== "draft").length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {myCoupons.filter(c => c.to === user.name && c.status !== "draft").map(coupon => {
                const daysLeft = Math.max(0, Math.ceil((new Date(coupon.expiry) - new Date()) / 86400000));
                return (
                  <div key={coupon.id} style={{
                    background: "#fff", borderRadius: 16, padding: "14px 12px",
                    border: `1px solid ${colors.border}`, textAlign: "center",
                    boxShadow: colors.shadow, opacity: coupon.status === "used" ? 0.6 : 1,
                    position: "relative",
                  }}>
                    <div style={{ position: "absolute", top: 8, left: 8 }}>
                      <span style={{
                        padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 700,
                        background: coupon.origin === "shop" ? colors.grapeLight : colors.primaryLight,
                        color: coupon.origin === "shop" ? colors.grape : colors.primary,
                      }}>
                        {coupon.origin === "shop" ? "포도알 구매" : "받은 쿠폰"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, marginTop: 8 }}><CouponIcon size={28} color={coupon.status === "used" ? "#9CA3AF" : "#7C3AED"} /></div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 2, textDecoration: coupon.status === "used" ? "line-through" : "none" }}>{coupon.title}</div>
                    <div style={{ fontSize: 10, color: colors.textTertiary, marginBottom: 8 }}>
                      {coupon.status === "used" ? "사용 완료" : (daysLeft <= 0 ? "만료" : `D-${daysLeft}`)}
                    </div>
                    {coupon.status === "used" ? (
                      <button onClick={async () => {
                        const coupleId = user.coupleId;
                        if (coupleId && authUser) {
                          const { error } = await undoUseCoupon(coupleId, coupon.id, authUser.uid);
                          if (error) { showToast(error, "error"); return; }
                        } else {
                          setMyCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, status: "sent" } : c));
                        }
                        showToast("사용 완료를 취소했어요");
                      }} style={{
                        padding: "5px 10px", borderRadius: 6, background: colors.mintLight, border: `1px solid ${colors.mint}40`, fontSize: 10, fontWeight: 700, color: colors.mint, cursor: "pointer",
                      }}>사용완료 취소</button>
                    ) : (
                      <button onClick={async () => {
                        const coupleId = user.coupleId;
                        if (coupleId && authUser) {
                          const { error } = await markCouponUsed(coupleId, coupon.id, authUser.uid);
                          if (error) { showToast(error, "error"); return; }
                        } else {
                          setMyCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, status: "used" } : c));
                        }
                        showToast("쿠폰을 사용했어요! 🎉");
                      }} style={{
                        padding: "5px 12px", borderRadius: 6, background: `linear-gradient(135deg, ${colors.primary}, ${colors.grape})`, border: "none", fontSize: 10, fontWeight: 700, color: "#fff", cursor: "pointer",
                      }}>사용하기</button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><CouponIcon size={32} color={colors.warm} /></div>
              <p style={{ fontSize: 14, color: colors.textTertiary }}>{partnerDisplayName}님이 쿠폰을 보내면 여기에 표시돼요!</p>
            </div>
          )}
        </>
      )}

      {/* Registered (포도알 상점에 등록한 쿠폰) */}
      {couponViewTab === "registered" && (
        <div>
          <div style={{
            background: colors.grapeLight, borderRadius: 12, padding: "12px 14px", marginBottom: 14,
          }}>
            <p style={{ fontSize: 12, color: colors.grape, lineHeight: 1.5 }}>
              💡 내가 등록한 쿠폰은 {partnerDisplayName}님의 <strong>포도알 상점</strong>에 표시돼요!
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <button onClick={() => {
              if (!user.partnerConnected) {
                setPartnerRequiredAction("coupon");
                setShowPartnerRequiredPopup(true);
                return;
              }
              setCouponCreateMode("shop");
              setEditCouponId(null);
              setNewCoupon({ title: "", desc: "", expiry: "" });
              setShowCouponCreate(true);
            }} style={{
              background: "none", border: "none", fontSize: 12, fontWeight: 600,
              color: colors.primary, cursor: "pointer",
            }}>새 쿠폰 등록하기 &gt;</button>
          </div>
          {shopCoupons.filter(sc => sc.registeredBy === user.name).length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {shopCoupons.filter(sc => sc.registeredBy === user.name).map(sc => (
                <div key={sc.id} style={{
                  background: "#fff", borderRadius: 16, padding: "16px 12px",
                  border: `1px solid ${colors.border}`, textAlign: "center",
                  boxShadow: colors.shadow, position: "relative",
                }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><CouponIcon size={28} /></div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{sc.title}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.grape }}>🍇 {sc.grapes}</div>
                  <button onClick={() => setConfirmDeleteShopCoupon(sc.id)} style={{
                    marginTop: 8, padding: "4px 10px", borderRadius: 6, background: colors.roseLight,
                    border: "none", fontSize: 10, fontWeight: 600, color: colors.rose, cursor: "pointer",
                  }}>삭제</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><CouponIcon size={32} /></div>
              <p style={{ fontSize: 13, color: colors.textTertiary, marginBottom: 12 }}>
                아직 등록한 쿠폰이 없어요
              </p>
              <p style={{ fontSize: 11, color: colors.textTertiary, lineHeight: 1.5 }}>
                포도알 상점에 쿠폰을 등록하면<br/>{partnerDisplayName}님이 포도알로 구매할 수 있어요
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderShop = () => {
    return (
      <div style={{ padding: "0 20px 100px" }}>
        <div style={{ padding: "16px 0 20px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>🎁 선물 상점</h2>
          <p style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
            크레딧으로 기프티콘을, 포도알로 커플 쿠폰을 교환하세요
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: colors.grapeLight, borderRadius: 8, padding: "6px 12px",
              fontSize: 13, fontWeight: 700, color: colors.grape,
            }}>
              🍇 {user.grapePoints || 0} 포도알 보유 중
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: colors.goldLight, borderRadius: 8, padding: "6px 12px",
              fontSize: 13, fontWeight: 700, color: "#B45309",
            }}>
              💳 {user.mallangCredits.toLocaleString()} 말랑 크레딧 보유 중
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {["전체", "기프티콘", "포도알 상점"].map(f => (
            <button key={f} onClick={() => setGiftFilter(f)} style={{
              padding: "8px 12px", borderRadius: 20,
              background: giftFilter === f ? colors.primary : "#fff",
              color: giftFilter === f ? "#fff" : colors.textSecondary,
              border: giftFilter === f ? "none" : `1px solid ${colors.border}`,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              {f}
            </button>
          ))}
        </div>

        {/* ── 전체 탭 ── */}
        {giftFilter === "전체" && (
          <div>
            {/* 기프티콘 */}
            <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 10 }}>🎁 기프티콘</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {MOCK_GIFTS.filter(g => g.category === "기프티콘").map(g => {
                const canAfford = user.mallangCredits >= g.credits;
                return (
                  <div key={g.id} onClick={() => showToast("준비중입니다 🔧")} style={{
                    background: "#fff", borderRadius: 16, padding: "18px 14px",
                    border: `1px solid ${colors.border}`, textAlign: "center",
                    cursor: "pointer", opacity: canAfford ? 1 : 0.5, boxShadow: colors.shadow,
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{g.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{g.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: canAfford ? "#B45309" : colors.textTertiary }}>
                      💳 {g.credits.toLocaleString()}
                    </div>
                    <span style={{ display: "inline-block", marginTop: 6, fontSize: 10, color: "#B45309", background: colors.goldLight, padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>크레딧</span>
                  </div>
                );
              })}
            </div>

            {/* 상대방이 등록한 상점 쿠폰 */}
            {shopCoupons.filter(sc => sc.registeredBy !== user.name).length > 0 && (
              <>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 10 }}>🍇 {partnerDisplayName}님이 등록한 쿠폰</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {shopCoupons.filter(sc => sc.registeredBy !== user.name).map(sc => {
                    const canBuy = (user.grapePoints || 0) >= (sc.grapes || sc.hearts);
                    return (
                      <div key={sc.id} onClick={() => setSelectedShopCoupon(sc)} style={{
                        background: "#fff", borderRadius: 16, padding: "16px 12px",
                        border: `1px solid ${colors.border}`, textAlign: "center",
                        cursor: "pointer", opacity: canBuy ? 1 : 0.5, boxShadow: colors.shadow,
                      }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><CouponIcon size={28} /></div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{sc.title}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: canBuy ? colors.grape : colors.textTertiary }}>🍇 {sc.grapes || sc.hearts}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 기프티콘 탭 ── */}
        {giftFilter === "기프티콘" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {MOCK_GIFTS.filter(g => g.category === "기프티콘").map(g => {
              const canAfford = user.mallangCredits >= g.credits;
              return (
                <div key={g.id} onClick={() => showToast("준비중입니다 🔧")} style={{
                  background: "#fff", borderRadius: 16, padding: "18px 14px",
                  border: `1px solid ${colors.border}`, textAlign: "center",
                  cursor: "pointer", opacity: canAfford ? 1 : 0.5, boxShadow: colors.shadow,
                }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{g.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{g.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: canAfford ? "#B45309" : colors.textTertiary }}>
                    💳 {g.credits.toLocaleString()}
                  </div>
                  <span style={{ display: "inline-block", marginTop: 6, fontSize: 10, color: "#B45309", background: colors.goldLight, padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>크레딧</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 포도알 상점 탭 ── */}
        {giftFilter === "포도알 상점" && (
          <div>
            <p style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
              짝꿍이 등록한 쿠폰을 포도알로 구매하거나, 내가 쿠폰을 등록할 수 있어요
            </p>

            {/* 짝꿍이 등록한 쿠폰 */}
            {shopCoupons.filter(sc => sc.registeredBy !== user.name).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
                  {partnerDisplayName}님이 등록한 쿠폰
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {shopCoupons.filter(sc => sc.registeredBy !== user.name).map(sc => {
                    const canBuy = (user.grapePoints || 0) >= (sc.grapes || sc.hearts);
                    return (
                      <div key={sc.id} onClick={() => setSelectedShopCoupon(sc)} style={{
                        background: "#fff", borderRadius: 16, padding: "16px 12px",
                        border: `1px solid ${colors.border}`, textAlign: "center",
                        cursor: "pointer", opacity: canBuy ? 1 : 0.5, boxShadow: colors.shadow,
                      }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><CouponIcon size={28} /></div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{sc.title}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: canBuy ? colors.grape : colors.textTertiary }}>🍇 {sc.grapes || sc.hearts}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedShopCoupon && (() => {
          const sc = selectedShopCoupon;
          const grapeCost = sc.grapes || sc.hearts;
          const canBuy = (user.grapePoints || 0) >= grapeCost;
          const daysLeft = Math.max(0, Math.ceil((new Date(sc.expiry) - new Date()) / 86400000));
          return (
            <div style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
              zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
            }} onClick={() => setSelectedShopCoupon(null)}>
              <div onClick={e => e.stopPropagation()} style={{
                background: "#fff", borderRadius: 20, padding: "28px 24px",
                width: "85%", maxWidth: 340, textAlign: "center",
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><CouponIcon size={40} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 6 }}>
                  {sc.title}
                </h3>
                <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>{sc.desc}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16, marginTop: 12 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: colors.grape,
                    background: colors.grapeLight, padding: "4px 10px", borderRadius: 8,
                  }}>🍇 {grapeCost}포도알</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: daysLeft <= 7 ? colors.rose : colors.textTertiary,
                    background: daysLeft <= 7 ? colors.roseLight : "#F3F4F6",
                    padding: "4px 10px", borderRadius: 8,
                  }}>유효기간 D-{daysLeft}</span>
                </div>
                <div style={{ marginBottom: 16 }}/>
                <button onClick={async () => {
                  if (!canBuy) { showToast("포도알이 부족해요 🍇"); return; }
                  if (authUser) {
                    const { error } = await spendGrapes(authUser.uid, user.coupleId || null, grapeCost, 'coupon_purchase', { couponTitle: sc.title });
                    if (error) { showToast(error); return; }
                  }
                  setMyCoupons(prev => [...prev, {
                    id: Date.now(), title: sc.title, desc: sc.desc,
                    from: sc.registeredBy, to: user.name, expiry: sc.expiry, status: "sent", origin: "shop",
                  }]);
                  setSelectedShopCoupon(null);
                  showToast(`${sc.title}을(를) 구매했어요! 🎉`);
                }} style={{
                  width: "100%", padding: "14px", borderRadius: 12,
                  background: canBuy ? `linear-gradient(135deg, ${colors.grape}, ${colors.grapeDark})` : "#E5E7EB",
                  color: canBuy ? "#fff" : "#9CA3AF",
                  border: "none", fontSize: 15, fontWeight: 700,
                  cursor: canBuy ? "pointer" : "default", marginBottom: 8,
                }}>
                  {canBuy ? `구매하기 🍇 -${grapeCost}` : "포도알 부족"}
                </button>
                <button onClick={() => setSelectedShopCoupon(null)} style={{
                  width: "100%", padding: "10px", background: "none",
                  border: "none", color: colors.textTertiary, cursor: "pointer", fontSize: 13,
                }}>취소</button>
              </div>
            </div>
          );
        })()}

        {/* Gift Confirm Modal */}
        {selectedGift && (() => {
          const isGifticon = selectedGift.category === "기프티콘";
          const cost = isGifticon ? selectedGift.credits : (selectedGift.grapes || selectedGift.hearts);
          const currencyLabel = isGifticon ? "크레딧" : "포도알";
          const currencyIcon = isGifticon ? "💳" : "🍇";
          return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
          }} onClick={() => setSelectedGift(null)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: "#fff", borderRadius: 20, padding: "28px 24px",
              width: "85%", maxWidth: 340, textAlign: "center",
            }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>{selectedGift.emoji}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 6 }}>
                {selectedGift.name}
              </h3>
              <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
                {currencyIcon} {cost.toLocaleString()} {currencyLabel}으로 {partnerDisplayName}님에게 선물할까요?
              </p>
              <button onClick={async () => {
                if (isGifticon) {
                  setUser(u => ({ ...u, mallangCredits: u.mallangCredits - selectedGift.credits }));
                } else {
                  if (authUser) {
                    const giftGrapeCost = selectedGift.grapes || selectedGift.hearts;
                    const { error } = await spendGrapes(authUser.uid, user.coupleId || null, giftGrapeCost, 'gift_purchase', { giftName: selectedGift.name });
                    if (error) { showToast(error); return; }
                  }
                }
                setSelectedGift(null);
                showToast(`${partnerDisplayName}님에게 ${selectedGift.name}을(를) 선물했어요! 🎉`);
              }} style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: isGifticon
                  ? `linear-gradient(135deg, ${colors.gold}, #D97706)`
                  : `linear-gradient(135deg, ${colors.grape}, ${colors.grapeDark})`,
                color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer",
                marginBottom: 8,
              }}>
                선물하기 {currencyIcon} -{cost.toLocaleString()}
              </button>
              <button onClick={() => setSelectedGift(null)} style={{
                width: "100%", padding: "12px", background: "none",
                border: "none", color: colors.textTertiary, cursor: "pointer", fontSize: 13,
              }}>
                취소
              </button>
            </div>
          </div>
          );
        })()}
      </div>
    );
  };

  const renderReport = () => (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ padding: "16px 0 12px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>📊 분석</h2>
        <p style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>우리의 관계를 더 깊이 이해해보세요</p>
      </div>

      {!user.partnerConnected ? (
        <div style={{
          background: "#fff", borderRadius: 20, padding: "48px 24px",
          textAlign: "center", border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow,
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔗</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
            짝꿍과 연결해주세요
          </h3>
          <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 24 }}>
            분석 기능은 짝꿍과 연결한 뒤에 사용할 수 있어요.<br/>
            함께 대화하고 활동하면 관계 분석 리포트가 만들어져요!
          </p>
          <button onClick={() => setShowSettings(true)} style={{
            padding: "13px 28px", borderRadius: 12,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>짝꿍코드 등록하기</button>
        </div>
      ) : (
      <>

      {/* Sub-tabs - 2x2 Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
        {[
          { key: "report", label: "📊 기본 보고서", premium: false },
          { key: "advanced", label: "📈 심화 보고서", premium: true },
          { key: "voice", label: "🎙️ 대화 분석", premium: true },
          { key: "judge", label: "⚖️ 갈등 심판", premium: true },
        ].map(t => (
          <button key={t.key} onClick={() => setReportSubTab(t.key)} style={{
            padding: "12px 8px", borderRadius: 12,
            background: reportSubTab === t.key ? colors.primaryLight : "#F3F4F6",
            color: reportSubTab === t.key ? colors.primary : colors.textTertiary,
            border: reportSubTab === t.key ? `1.5px solid ${colors.primary}` : "1.5px solid transparent",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            position: "relative",
          }}>
            {t.label}
            {t.premium && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                color: "#fff", fontSize: 8, fontWeight: 700,
                padding: "2px 5px", borderRadius: 6,
              }}>PRO</span>
            )}
          </button>
        ))}
      </div>

      {/* ── 기본 보고서 ── */}
      {reportSubTab === "report" && (<>
        {(() => {
          const now = new Date();
          const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

          // 포도알 거래 내역
          const transactions = (ctxGrapeTransactions || [])
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

          const reasonLabels = {
            daily_question: '오늘의 질문 완료',
            daily_question_predict_correct: '질문 예측 적중',
            grape_board_progress: '포도판 성공',
            praise_send: '칭찬 보내기',
            coupon_purchase: '쿠폰 구매',
            gift_purchase: '선물 구매',
            report_unlock: '심화 보고서 열람',
            voice_analysis_unlock: '대화 분석 해금',
            judge_unlock: '갈등 심판 해금',
          };

          // 이번 달 칭찬
          const getDateStr = (item) => (item.createdAt || item.timestamp || item.dateStr || '').substring(0, 7);
          const thisMonthPraises = (ctxPraises || []).filter(p => getDateStr(p) === thisMonth).length;

          // 월별 칭찬 집계
          const praisesByMonth = (ctxPraises || []).reduce((acc, p) => {
            const m = getDateStr(p);
            if (m) acc[m] = (acc[m] || 0) + 1;
            return acc;
          }, {});
          const praiseMonths = Object.entries(praisesByMonth).sort((a, b) => b[0].localeCompare(a[0]));

          // 할일 완수율
          const completedChores = (chores || []).filter(c => c.completed).length;
          const totalChores = (chores || []).length;
          const choreRate = totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0;

          // 커플 질문 예측 적중
          const dailyQuestionsData = ctxDailyQuestion ? [ctxDailyQuestion] : [];
          const thisMonthCorrect = dailyQuestionsData.filter(q => {
            if (!q.id || !q.id.startsWith(thisMonth)) return false;
            const predictions = q.predictions || {};
            const answers = q.answers || {};
            return predictions[authUser?.uid] && answers[ctxPartnerUid] &&
              predictions[authUser?.uid].text === answers[ctxPartnerUid].text;
          }).length;
          const lastMonthCorrect = dailyQuestionsData.filter(q => {
            if (!q.id || !q.id.startsWith(lastMonth)) return false;
            const predictions = q.predictions || {};
            const answers = q.answers || {};
            return predictions[authUser?.uid] && answers[ctxPartnerUid] &&
              predictions[authUser?.uid].text === answers[ctxPartnerUid].text;
          }).length;
          const thisMonthQuestionTotal = dailyQuestionsData.filter(q => q.id && q.id.startsWith(thisMonth) && (q.predictions || {})[authUser?.uid]).length;
          const lastMonthQuestionTotal = dailyQuestionsData.filter(q => q.id && q.id.startsWith(lastMonth) && (q.predictions || {})[authUser?.uid]).length;

          // 이번 달 기분 선택 비율
          const thisMonthMoods = (moodHistory || []).filter(m => m.date && m.date.startsWith(thisMonth)).length;
          const daysSoFar = now.getDate();
          const moodRate = daysSoFar > 0 ? Math.round((thisMonthMoods / daysSoFar) * 100) : 0;

          return (<>
          {/* ── ① 보유 포도알 ── */}
          <div style={{
            background: "#fff", borderRadius: 18, padding: "20px",
            border: `1px solid ${colors.border}`, marginTop: 12, marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>🍇</span>
                <div>
                  <div style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 600 }}>보유 포도알</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: colors.grape }}>{user.grapePoints || 0}개</div>
                </div>
              </div>
              <button onClick={() => setBasicReportExpand(prev => prev === 'grape' ? null : 'grape')} style={{
                background: colors.grapeLight, border: "none", borderRadius: 10,
                padding: "8px 14px", fontSize: 12, fontWeight: 600, color: colors.grape, cursor: "pointer",
              }}>
                {basicReportExpand === 'grape' ? '접기' : '내역 보기'}
              </button>
            </div>
            {basicReportExpand === 'grape' && (
              <div style={{ marginTop: 14, maxHeight: 240, overflowY: "auto" }}>
                {transactions.length > 0 ? transactions.slice(0, 30).map((tx, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0", borderBottom: i < Math.min(transactions.length, 30) - 1 ? `1px solid ${colors.border}` : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                        {reasonLabels[tx.reason] || tx.reason || '포도알'}
                      </div>
                      <div style={{ fontSize: 11, color: colors.textTertiary }}>
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 15, fontWeight: 700,
                      color: tx.type === 'earn' ? colors.mint : colors.rose,
                    }}>
                      {tx.type === 'earn' ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                )) : (
                  <p style={{ fontSize: 13, color: colors.textTertiary, textAlign: "center", padding: "16px 0" }}>
                    아직 내역이 없어요
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── ② 이번 달 칭찬 ── */}
          <div style={{
            background: "#fff", borderRadius: 18, padding: "20px",
            border: `1px solid ${colors.border}`, marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>💜</span>
                <div>
                  <div style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 600 }}>이번 달 칭찬</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: colors.primary }}>{thisMonthPraises}회</div>
                </div>
              </div>
              <button onClick={() => setBasicReportExpand(prev => prev === 'praise' ? null : 'praise')} style={{
                background: colors.primaryLight, border: "none", borderRadius: 10,
                padding: "8px 14px", fontSize: 12, fontWeight: 600, color: colors.primary, cursor: "pointer",
              }}>
                {basicReportExpand === 'praise' ? '접기' : '월별 보기'}
              </button>
            </div>
            {basicReportExpand === 'praise' && (
              <div style={{ marginTop: 14 }}>
                {praiseMonths.length > 0 ? praiseMonths.map(([month, count]) => (
                  <div key={month} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderBottom: `1px solid ${colors.border}`,
                  }}>
                    <span style={{ fontSize: 13, color: colors.text }}>
                      {(() => { const [y, m] = month.split('-'); return `${y}년 ${parseInt(m)}월`; })()}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: colors.primary }}>{count}회</span>
                  </div>
                )) : (
                  <p style={{ fontSize: 13, color: colors.textTertiary, textAlign: "center", padding: "16px 0" }}>
                    아직 칭찬 기록이 없어요
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── ③ 할일 완수율 ── */}
          <div style={{
            background: "#fff", borderRadius: 18, padding: "20px",
            border: `1px solid ${colors.border}`, marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>✅</span>
              <div>
                <div style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 600 }}>한 달간 할일 완수율</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: colors.mint }}>{choreRate}%</div>
              </div>
            </div>
            <div style={{ height: 10, background: "#F3F4F6", borderRadius: 5, overflow: "hidden" }}>
              <div style={{
                width: `${choreRate}%`, height: 10, borderRadius: 5,
                background: `linear-gradient(90deg, ${colors.mint}, #34D399)`,
                transition: "width 0.5s",
              }} />
            </div>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
              {completedChores} / {totalChores} 완료
              {totalChores === 0 && ' · 할일을 등록해보세요!'}
            </div>
          </div>

          {/* ── ④ 커플 질문 예측 적중 ── */}
          <div style={{
            background: "#fff", borderRadius: 18, padding: "20px",
            border: `1px solid ${colors.border}`, marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>🎯</span>
                <div>
                  <div style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 600 }}>이번 달 질문 예측 적중</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: colors.gold }}>
                    {thisMonthCorrect}회
                    {thisMonthQuestionTotal > 0 && <span style={{ fontSize: 13, fontWeight: 500, color: colors.textTertiary }}> / {thisMonthQuestionTotal}번 중</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setBasicReportExpand(prev => prev === 'predict' ? null : 'predict')} style={{
                background: colors.goldLight, border: "none", borderRadius: 10,
                padding: "8px 14px", fontSize: 12, fontWeight: 600, color: colors.gold, cursor: "pointer",
              }}>
                {basicReportExpand === 'predict' ? '접기' : '지난달'}
              </button>
            </div>
            {basicReportExpand === 'predict' && (
              <div style={{
                marginTop: 14, background: colors.goldLight, borderRadius: 12, padding: "14px 16px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: colors.text }}>
                    {(() => { return `${lastMonthDate.getFullYear()}년 ${lastMonthDate.getMonth() + 1}월`; })()}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: colors.gold }}>
                    {lastMonthCorrect}회
                    {lastMonthQuestionTotal > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: colors.textTertiary }}> / {lastMonthQuestionTotal}번 중</span>}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── ⑤ 이번 달 기분 선택 비율 ── */}
          <div style={{
            background: "#fff", borderRadius: 18, padding: "20px",
            border: `1px solid ${colors.border}`, marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>😊</span>
              <div>
                <div style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 600 }}>이번 달 기분 기록률</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: colors.warm }}>{moodRate}%</div>
              </div>
            </div>
            <div style={{ height: 10, background: "#F3F4F6", borderRadius: 5, overflow: "hidden" }}>
              <div style={{
                width: `${moodRate}%`, height: 10, borderRadius: 5,
                background: `linear-gradient(90deg, ${colors.warm}, #FB923C)`,
                transition: "width 0.5s",
              }} />
            </div>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
              {daysSoFar}일 중 {thisMonthMoods}일 기록
            </div>
          </div>

          {/* Support 버튼 */}
          <button onClick={() => { setAdModalType("support"); setShowAdModal(true); }} style={{
            width: "100%", marginTop: 14,
            background: "#F8F5FF", borderRadius: 14, padding: "16px 18px",
            border: `1px solid ${colors.primary}20`, cursor: "pointer",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, justifyContent: "center" }}>
              <Heart size={14} color={colors.primary} />
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>Support</span>
            </div>
            <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
              광고 시청은 서비스 운영에 도움이 되며,<br/>
              더 정확한 AI 분석 개선에 사용됩니다.
            </p>
          </button>
          </>);
        })()}
      </>)}

      {/* Ad Watch Modal - 2 rounds (모든 탭에서 표시) */}
      {showAdModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "28px 24px",
            width: "85%", maxWidth: 340,
          }}>
            {!adWatching ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{adModalType === "support" ? "💜" : "🎬"}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
                  {adModalType === "support"
                    ? "Support!"
                    : adRound === 1 ? "광고 시청하고 분석 보기" : "마지막 광고 1편 남았어요!"}
                </h3>
                <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 6 }}>
                  {adModalType === "support"
                    ? <>짧은 광고 <strong style={{ color: colors.primary }}>2편</strong>을 시청하면<br/>AI 분석 서비스 운영에 도움이 됩니다.</>
                    : adRound === 1
                      ? <>짧은 광고 <strong style={{ color: colors.primary }}>2편</strong>을 시청하면<br/>심화 분석을 확인할 수 있어요.</>
                      : <>1편 더 시청하면 바로 확인할 수 있어요!</>
                  }
                </p>

                {/* Round indicator */}
                <div style={{
                  display: "flex", justifyContent: "center", gap: 8, marginTop: 12, marginBottom: 16,
                }}>
                  {[1, 2].map(r => (
                    <div key={r} style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: r < adRound ? colors.mint : r === adRound ? colors.primaryLight : "#F3F4F6",
                      border: r === adRound ? `2px solid ${colors.primary}` : r < adRound ? `2px solid ${colors.mint}` : "2px solid #E5E7EB",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700,
                      color: r < adRound ? "#fff" : r === adRound ? colors.primary : colors.textTertiary,
                    }}>
                      {r < adRound ? "✓" : r}
                    </div>
                  ))}
                </div>

                <button onClick={() => {
                  setAdWatching(true);
                  setAdProgress(0);
                }} style={{
                  width: "100%", padding: "14px", borderRadius: 12,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                  color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer",
                  marginBottom: 8,
                }}>
                  {adRound === 1 ? "광고 시청 시작 (1/2)" : "마지막 광고 시청 (2/2)"}
                </button>
                <button onClick={() => { setShowAdModal(false); setAdRound(1); }} style={{
                  width: "100%", padding: "10px", background: "none",
                  border: "none", color: colors.textTertiary, cursor: "pointer", fontSize: 13,
                }}>
                  나중에 할게요
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                {/* Ad player area */}
                <div style={{
                  background: "#111", borderRadius: 12, height: 180,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16, position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: 8, left: 8,
                    background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "3px 8px",
                  }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                      광고 {adRound}/2
                    </span>
                  </div>
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    background: "rgba(0,0,0,0.7)", borderRadius: 6, padding: "3px 8px",
                  }}>
                    <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>
                      {Math.max(0, 30 - Math.floor(adProgress / 100 * 30))}초
                    </span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>광고 영역</p>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>
                      (실제 앱에서는 여기에 광고가 재생됩니다)
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: colors.textTertiary }}>광고 {adRound}/2 시청 중...</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: colors.primary }}>{Math.min(100, Math.floor(adProgress))}%</span>
                  </div>
                  <div style={{ height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, adProgress)}%`, height: 6,
                      background: `linear-gradient(90deg, ${colors.primary}, ${colors.grape})`,
                      borderRadius: 3, transition: "width 0.3s",
                    }} />
                  </div>
                </div>

                {adProgress >= 100 ? (
                  adRound < 2 ? (
                    <button onClick={() => {
                      setAdRound(2);
                      setAdWatching(false);
                      setAdProgress(0);
                    }} style={{
                      width: "100%", padding: "14px", borderRadius: 12,
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                      color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer",
                    }}>
                      ✅ 1편 완료! 다음 광고로 →
                    </button>
                  ) : (
                    <button onClick={() => {
                      setShowAdModal(false);
                      setAdWatching(false);
                      setAdProgress(0);
                      setAdRound(1);
                      if (adModalType === "unlock") {
                        setReportTodayUnlocked(true);
                        showToast("심화 분석이 잠금해제 되었어요! 📊");
                      } else {
                        showToast("응원해주셔서 감사합니다! 💜");
                      }
                    }} style={{
                      width: "100%", padding: "14px", borderRadius: 12,
                      background: `linear-gradient(135deg, ${colors.mint}, #059669)`,
                      color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer",
                    }}>
                      {adModalType === "unlock" ? "🎉 완료! 심화 분석 보기" : "💜 감사합니다!"}
                    </button>
                  )
                ) : (
                  <p style={{ fontSize: 12, color: colors.textTertiary }}>
                    광고가 끝날 때까지 기다려주세요
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 심화 보고서 (월간 대시보드) ── */}
      {reportSubTab === "advanced" && (
        <div>
          {/* 유료 기능 배지 */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg, #FFD700, #FFA500)",
            padding: "6px 14px", borderRadius: 20, marginBottom: 16,
          }}>
            <Sparkles size={14} color="#fff" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>프리미엄 기능</span>
          </div>

          {/* 월 선택기 */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16,
          }}>
            <button onClick={() => {
              const [year, month] = selectedReportMonth.split('-').map(Number);
              const newDate = new Date(year, month - 2, 1);
              setSelectedReportMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
            }} style={{
              width: 36, height: 36, borderRadius: 10, background: "#fff",
              border: `1px solid ${colors.border}`, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ChevronLeft size={18} color={colors.textSecondary} />
            </button>
            <div style={{
              background: "#fff", borderRadius: 12, padding: "10px 20px",
              border: `1px solid ${colors.border}`, minWidth: 140, textAlign: "center",
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
                {(() => {
                  const [year, month] = selectedReportMonth.split('-');
                  return `${year}년 ${parseInt(month)}월`;
                })()}
              </span>
            </div>
            <button onClick={() => {
              const [year, month] = selectedReportMonth.split('-').map(Number);
              const newDate = new Date(year, month, 1);
              const now = new Date();
              if (newDate <= now) {
                setSelectedReportMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
              }
            }} style={{
              width: 36, height: 36, borderRadius: 10, background: "#fff",
              border: `1px solid ${colors.border}`, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: (() => {
                const [year, month] = selectedReportMonth.split('-').map(Number);
                const nextMonth = new Date(year, month, 1);
                return nextMonth <= new Date() ? 1 : 0.4;
              })(),
            }}>
              <ChevronRight size={18} color={colors.textSecondary} />
            </button>
          </div>

          {/* 월간 헤더 */}
          <div style={{
            background: `linear-gradient(135deg, ${colors.grape}, ${colors.primary})`,
            borderRadius: 20, padding: "24px 20px", marginBottom: 16, textAlign: "center",
          }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
              {(() => {
                const [year, month] = selectedReportMonth.split('-');
                return `${year}년 ${parseInt(month)}월`;
              })()}
            </p>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>월간 심화 보고서</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              AI가 분석한 우리 부부의 관계 인사이트
            </p>
          </div>

          {/* AI 인사이트 요약 */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: "16px", marginBottom: 16,
            border: `1px solid ${colors.grape}30`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={14} color={colors.grape} />
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.grape }}>AI 인사이트</span>
              </div>
              {!aiReportInsight && process.env.REACT_APP_GEMINI_API_KEY && (
                <button onClick={async () => {
                  try {
                    const insight = await callGemini(
                      '커플 관계 분석 전문가로서 월간 데이터를 기반으로 1-2문장 인사이트를 제공해주세요. 반드시 JSON: {"insight": "인사이트 내용"}',
                      `${selectedReportMonth} 월간 데이터: 대화변환 ${conversationHistory.filter(i => i.timestamp?.startsWith(selectedReportMonth)).length}회, 칭찬 ${praiseLog.length}회, 포도판 ${grapeBoards.length}개, 쿠폰 ${myCoupons.length}개`
                    );
                    if (insight?.insight) setAiReportInsight(insight.insight);
                  } catch { /* fallback */ }
                }} style={{ background: colors.grape, color: "#fff", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  생성하기
                </button>
              )}
            </div>
            <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
              {aiReportInsight || "AI 인사이트를 생성하면 이번 달 활동을 종합 분석해드려요."}
            </p>
          </div>

          {/* 데이터 유무 체크 - conversationHistory에서 해당 월 데이터 확인 */}
          {(() => {
            const monthData = conversationHistory.filter(item => {
              if (!item.timestamp) return false;
              const itemMonth = item.timestamp.substring(0, 7);
              return itemMonth === selectedReportMonth;
            });
            const hasBoards = grapeBoards.length > 0;
            const hasData = monthData.length > 0 || praiseLog.length > 0 || hasBoards;

            // 데이터가 없으면 디폴트 화면
            if (!hasData) {
              return (
                <div style={{
                  background: "#fff", borderRadius: 20, padding: "40px 24px",
                  border: `1px solid ${colors.border}`, textAlign: "center",
                }}>
                  <div style={{ fontSize: 64, marginBottom: 20 }}>📊</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 12 }}>
                    아직 분석할 데이터가 없어요
                  </h3>
                  <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                    {(() => {
                      const [year, month] = selectedReportMonth.split('-');
                      return `${year}년 ${parseInt(month)}월`;
                    })()}에는 대화 기록이 없네요.<br/>
                    <strong style={{ color: colors.primary }}>대화 도우미</strong>를 사용하거나<br/>
                    <strong style={{ color: colors.primary }}>칭찬</strong>을 해보세요!
                  </p>

                  <div style={{
                    background: colors.primaryLight, borderRadius: 14, padding: "16px",
                    marginBottom: 16, textAlign: "left",
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: colors.primary, marginBottom: 10 }}>
                      📝 이런 데이터가 쌓이면 분석해요
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { icon: "💬", text: "대화 도우미로 변환한 말" },
                        { icon: "🎙️", text: "녹음 파일 분석 결과" },
                        { icon: "⚖️", text: "갈등 심판 기록" },
                        { icon: "💜", text: "칭찬하기 기록" },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{item.icon}</span>
                          <span style={{ fontSize: 12, color: colors.textSecondary }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => setTab("home")} style={{
                    width: "100%", padding: "14px", borderRadius: 14,
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                    color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}>
                    홈에서 대화 도우미 사용하기 →
                  </button>
                </div>
              );
            }

            // 데이터가 있고 잠금 해제됨
            if (reportUnlocked) {
              // 실제 데이터 계산
              const chatHelperCount = monthData.filter(d => d.type === "chat_helper").length;
              const voiceAnalysisCount = monthData.filter(d => d.type === "voice_analysis").length;
              const judgeCount = monthData.filter(d => d.type === "judge").length;
              const monthPraises = praiseLog.filter(p => {
                const praiseMonth = new Date().toISOString().substring(0, 7);
                return praiseMonth === selectedReportMonth;
              }).length;
              const completedChores = chores.filter(c => c.completed).length;
              const totalChoresCount = chores.length;

              // 분석 점수 계산
              const { calcGottmanRatio, calcCommunicationScore, calcCompatibilityScore, calcConflictScore, calcAffectionScore, calcOverallScore, getDateRange, getPrevDateRange } = require('./services/analyticsScoreService');
              const [selYear, selMonth] = selectedReportMonth.split('-').map(Number);
              const dateRange = getDateRange(selYear, selMonth);
              const prevDateRange = getPrevDateRange(selYear, selMonth);
              const dailyQuestionsData = ctxDailyQuestion ? [ctxDailyQuestion] : [];
              const scoreParams = {
                uid: authUser?.uid, partnerUid: ctxPartnerUid, dateRange,
                praises: ctxPraises || [], secretMessages: ctxSecretMessages || [],
                coupons: ctxCoupons || [], dailyQuestions: dailyQuestionsData,
                judgeRecords: ctxJudgeRecords || [], streak: ctxStreak || { current: 0 },
                aiTransformHistory: conversationHistory || [], grapeBoards: grapeBoards || [],
              };
              const gottman = calcGottmanRatio(scoreParams);
              const communication = calcCommunicationScore(scoreParams);
              const compatibility = calcCompatibilityScore(scoreParams);
              const conflict = calcConflictScore({ ...scoreParams, prevDateRange });
              const affection = calcAffectionScore(scoreParams);
              const overall = calcOverallScore(communication, compatibility, conflict, affection);
              const categories = [
                { key: 'comm', icon: '📊', label: '소통 활발도', score: communication.total, color: colors.primary, details: communication.details },
                { key: 'compat', icon: '🎯', label: '취향 일치도', score: compatibility.total, color: colors.gold, details: compatibility.details },
                { key: 'conflict', icon: '🕊️', label: '갈등 빈도', score: conflict.total, color: colors.mint, details: conflict.details },
                { key: 'affection', icon: '💕', label: '애정 표현', score: affection.total, color: colors.rose, details: affection.details },
              ];

              return (<>
            {/* ═══ Gottman 5:1 비율 ═══ */}
            <div style={{
              background: gottman.ratio >= 5
                ? 'linear-gradient(135deg, #ECFDF5, #F0FDF4)'
                : gottman.ratio >= 3
                ? 'linear-gradient(135deg, #FFFBEB, #FEF3C7)'
                : 'linear-gradient(135deg, #FFF1F2, #FFE4E6)',
              borderRadius: 20, padding: "24px", marginBottom: 14,
              border: `1px solid ${gottman.ratio >= 5 ? '#86EFAC' : gottman.ratio >= 3 ? '#FDE68A' : '#FECACA'}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: gottman.ratio >= 5 ? colors.mint : gottman.ratio >= 3 ? '#B45309' : colors.rose }}>
                  💜 Gottman 긍정:부정 비율
                </span>
                <button onClick={() => setShowGuideModal(true)} style={{
                  background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 8,
                  padding: "4px 10px", fontSize: 11, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
                }}>ℹ️ 가이드</button>
              </div>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 42, fontWeight: 800, color: colors.text }}>
                  {gottman.negative > 0 ? `${gottman.ratio} : 1` : gottman.positive > 0 ? `${gottman.positive} : 0` : '- : -'}
                </div>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  긍정 {gottman.positive}회 · 부정 {gottman.negative}회
                </div>
              </div>
              <div style={{ position: "relative", height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "visible" }}>
                <div style={{
                  width: `${Math.min(100, (gottman.ratio / 10) * 100)}%`, height: 8, borderRadius: 4,
                  background: gottman.ratio >= 5 ? `linear-gradient(90deg, ${colors.mint}, #34D399)` : gottman.ratio >= 3 ? 'linear-gradient(90deg, #FBBF24, #F59E0B)' : `linear-gradient(90deg, ${colors.rose}, #FB7185)`,
                }} />
                <div style={{ position: "absolute", top: -4, left: "50%", width: 2, height: 16, background: colors.text, opacity: 0.3 }} />
                <span style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: colors.textTertiary }}>5:1</span>
              </div>
              <div style={{ marginTop: 20, background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
                  {gottman.ratio >= 5 ? '아주 건강한 관계예요! 긍정적 교류가 충분해요 💕' : gottman.ratio >= 3 ? '괜찮은 수준이에요. 칭찬과 몰래 한마디를 더 늘려보세요!' : gottman.negative === 0 && gottman.positive === 0 ? '아직 데이터가 쌓이고 있어요. 활동하면 비율이 나타나요!' : '긍정 교류를 늘려보세요. 하루 칭찬 1번이면 크게 달라져요!'}
                </p>
              </div>
            </div>

            {/* ═══ 종합 점수 ═══ */}
            <div style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.grape})`,
              borderRadius: 20, padding: "24px", marginBottom: 14, textAlign: "center",
            }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>종합 점수</p>
              <div style={{ fontSize: 48, fontWeight: 800, color: "#fff" }}>{overall}</div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.2)", borderRadius: 4, marginTop: 12, overflow: "hidden" }}>
                <div style={{ width: `${overall}%`, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.8)", transition: "width 0.5s" }} />
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>소통(30%) + 취향(25%) + 갈등(20%) + 애정(25%)</p>
            </div>

            {/* ═══ 4개 카테고리 ═══ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {categories.map(cat => (
                <div key={cat.key} style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", border: `1px solid ${colors.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{cat.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{cat.label}</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: cat.color }}>{cat.score}<span style={{ fontSize: 12, fontWeight: 500, color: colors.textTertiary }}>/100</span></span>
                  </div>
                  <div style={{ height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ width: `${cat.score}%`, height: 8, borderRadius: 4, background: cat.color, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {Object.values(cat.details).map((d, i) => (
                      <span key={i} style={{ fontSize: 10, color: colors.textTertiary, background: "#F9FAFB", borderRadius: 6, padding: "3px 8px" }}>
                        {d.label} {d.score}/{d.max}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ═══ 이번 달 활동 요약 ═══ */}
            <div style={{
              background: "#fff", borderRadius: 18, padding: "20px",
              border: `1px solid ${colors.border}`, marginBottom: 14,
            }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 16 }}>📊 이번 달 활동 요약</h4>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { icon: "💬", label: "대화 변환", value: chatHelperCount, color: colors.primary },
                  { icon: "🎙️", label: "음성 분석", value: voiceAnalysisCount, color: colors.grape },
                  { icon: "⚖️", label: "갈등 심판", value: judgeCount, color: colors.warm },
                  { icon: "💜", label: "칭찬하기", value: monthPraises, color: colors.mint },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: "#F9FAFB", borderRadius: 14, padding: "16px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ 기분 변화 추이 ═══ */}
            {(() => {
              const monthMoods = moodHistory.filter(m => m.date.startsWith(selectedReportMonth));
              const moodLabels = {
                good: { emoji: "😊", label: "좋아요", color: colors.mint },
                happy: { emoji: "🥰", label: "행복해요", color: colors.primary },
                neutral: { emoji: "😐", label: "그냥그래요", color: colors.textSecondary },
                sad: { emoji: "😔", label: "우울해요", color: colors.warm },
                angry: { emoji: "😤", label: "화나요", color: colors.rose },
              };
              const moodCounts = monthMoods.reduce((acc, m) => {
                acc[m.mood] = (acc[m.mood] || 0) + 1;
                return acc;
              }, {});
              const totalMoods = monthMoods.length;
              const positiveCount = (moodCounts.good || 0) + (moodCounts.happy || 0);
              const positiveRate = totalMoods > 0 ? Math.round((positiveCount / totalMoods) * 100) : 0;

              return (
                <div style={{
                  background: "#fff", borderRadius: 18, padding: "20px",
                  border: `1px solid ${colors.border}`, marginBottom: 14,
                }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 16 }}>😊 기분 변화 추이</h4>
                  {totalMoods > 0 ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div style={{ textAlign: "center", flex: 1 }}>
                          <div style={{ fontSize: 32, fontWeight: 800, color: positiveRate >= 50 ? colors.mint : colors.warm }}>
                            {positiveRate}%
                          </div>
                          <div style={{ fontSize: 11, color: colors.textSecondary }}>긍정적 기분 비율</div>
                        </div>
                        <div style={{ width: 1, height: 40, background: colors.border }} />
                        <div style={{ textAlign: "center", flex: 1 }}>
                          <div style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>{totalMoods}일</div>
                          <div style={{ fontSize: 11, color: colors.textSecondary }}>기록된 날</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => {
                          const info = moodLabels[mood];
                          return (
                            <div key={mood} style={{
                              display: "flex", alignItems: "center", gap: 4,
                              background: "#F9FAFB", padding: "6px 10px", borderRadius: 8,
                            }}>
                              <span style={{ fontSize: 16 }}>{info?.emoji}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: info?.color }}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                      {positiveRate < 50 && (
                        <div style={{
                          background: colors.warmLight, borderRadius: 10, padding: "10px 12px", marginTop: 12,
                        }}>
                          <p style={{ fontSize: 11, color: colors.warm, lineHeight: 1.5 }}>
                            💜 힘든 날이 많았네요. 서로에게 위로의 말을 전해보는 건 어떨까요?
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "16px 0", color: colors.textTertiary }}>
                      <p style={{ fontSize: 13 }}>이번 달 기분 기록이 없어요</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ═══ 할일 완료율 ═══ */}
            <div style={{
              background: "#fff", borderRadius: 18, padding: "20px",
              border: `1px solid ${colors.border}`, marginBottom: 14,
            }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 16 }}>✅ 할일 완료 현황</h4>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 90, height: 90, borderRadius: "50%",
                  background: `conic-gradient(${colors.mint} ${totalChoresCount > 0 ? (completedChores / totalChoresCount) * 360 : 0}deg, #E5E7EB 0deg)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: "50%", background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: colors.mint }}>
                      {totalChoresCount > 0 ? Math.round((completedChores / totalChoresCount) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                    {completedChores} / {totalChoresCount} 완료
                  </div>
                  <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
                    {completedChores === totalChoresCount && totalChoresCount > 0
                      ? "완벽해요! 모든 할일을 완료했어요 🎉"
                      : totalChoresCount === 0
                      ? "등록된 할일이 없어요"
                      : `${totalChoresCount - completedChores}개 남았어요. 화이팅!`}
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ 대화 기록 목록 ═══ */}
            <div style={{
              background: "#fff", borderRadius: 18, padding: "20px",
              border: `1px solid ${colors.border}`, marginBottom: 14,
            }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 16 }}>💬 대화 분석 기록</h4>

              {monthData.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {monthData.slice(0, 5).map((item, i) => (
                    <div key={i} style={{
                      background: "#F9FAFB", borderRadius: 12, padding: "12px 14px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>
                          {item.type === "chat_helper" ? "💬 대화 변환" :
                           item.type === "voice_analysis" ? "🎙️ 음성 분석" :
                           item.type === "judge" ? "⚖️ 갈등 심판" : "📝 기록"}
                        </span>
                        <span style={{ fontSize: 10, color: colors.textTertiary }}>
                          {item.timestamp ? new Date(item.timestamp).toLocaleDateString("ko-KR") : ""}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: colors.textSecondary, margin: 0,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.original || item.summary || "분석 완료"}
                      </p>
                    </div>
                  ))}
                  {monthData.length > 5 && (
                    <p style={{ fontSize: 11, color: colors.textTertiary, textAlign: "center" }}>
                      외 {monthData.length - 5}건 더 있어요
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", padding: "20px 0" }}>
                  이번 달 대화 기록이 없어요
                </p>
              )}
            </div>

            {/* ═══ 관계 팁 ═══ */}
            <div style={{
              background: colors.primaryLight, borderRadius: 18, padding: "20px",
              border: `1px solid ${colors.primary}30`, marginBottom: 14,
            }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: colors.primary, marginBottom: 12 }}>💡 관계 향상 팁</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "서로에게 하루에 한 번 이상 감사의 말을 전해보세요",
                  "중요한 대화는 컨디션이 좋을 때 나눠보세요",
                  "상대방의 말을 끝까지 듣고 공감해주세요",
                ].map((tip, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: colors.primary, fontSize: 12 }}>✓</span>
                    <span style={{ fontSize: 12, color: colors.text, lineHeight: 1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Support 버튼 (잠금해제 상태에서도 표시) */}
            <button onClick={() => { setAdModalType("support"); setShowAdModal(true); }} style={{
              width: "100%", marginTop: 14,
              background: "#F8F5FF", borderRadius: 14, padding: "16px 18px",
              border: `1px solid ${colors.primary}20`, cursor: "pointer",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, justifyContent: "center" }}>
                <Heart size={14} color={colors.primary} />
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>Support</span>
              </div>
              <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
                광고 시청은 서비스 운영에 도움이 되며,<br/>
                더 정확한 AI 분석 개선에 사용됩니다.
              </p>
            </button>
          </>);
            }

            // 데이터가 있지만 잠금 상태
            return (
            /* 잠금 상태 - 포도알 10개 필요 */
            <div style={{
              background: "#fff", borderRadius: 20, padding: "32px 24px",
              border: `1px solid ${colors.border}`, textAlign: "center",
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📈</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
                심화 관계 보고서
              </h3>
              <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 6 }}>
                긍정 언어 황금 비율, 가사 분담 체감 지수,<br/>
                AI 대화 개선도, 취약 시간대 분석까지!
              </p>
              <p style={{ fontSize: 12, color: colors.grape, fontWeight: 600, marginBottom: 20 }}>
                🍇 포도알 10개로 열람 가능
              </p>

              <button onClick={async () => {
                if ((user.grapePoints || 0) < 10) {
                  showToast("포도알이 부족해요! (10개 필요) 🍇");
                  return;
                }
                if (authUser) {
                  const { error } = await spendGrapes(authUser.uid, user.coupleId || null, 10, 'report_unlock');
                  if (error) { showToast(error); return; }
                }
                setReportTodayUnlocked(true);
                showToast("심화 보고서가 열렸어요! 📈");
              }} style={{
                width: "100%", padding: "16px", borderRadius: 14,
                background: (user.grapePoints || 0) >= 10
                  ? `linear-gradient(135deg, ${colors.grape}, ${colors.grapeDark})`
                  : "#E5E7EB",
                color: (user.grapePoints || 0) >= 10 ? "#fff" : "#9CA3AF",
                border: "none", fontSize: 15, fontWeight: 700,
                cursor: (user.grapePoints || 0) >= 10 ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                🍇 포도알 10개로 열기 (보유: {user.grapePoints || 0}개)
              </button>
            </div>
            );
          })()}
        </div>
      )}

      {/* ── 대화 분석 ── */}
      {reportSubTab === "voice" && (
        <div>
          {/* 프리미엄 기능 배지 */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg, #FFD700, #FFA500)",
            padding: "6px 14px", borderRadius: 20, marginBottom: 16,
          }}>
            <Sparkles size={14} color="#fff" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>프리미엄 기능</span>
          </div>

          {voiceUnlocked ? (
            <>
            {/* Upload Area */}
            {!voiceResult ? (
              <div>
                <div style={{
                  background: "#fff", borderRadius: 16, padding: "32px 20px",
                  border: `2px dashed ${voiceFile ? colors.primary : colors.border}`,
                  textAlign: "center", marginBottom: 16,
                  transition: "border-color 0.2s",
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎙️</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 6 }}>대화 녹음 파일 업로드</h3>
                  <p style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16, lineHeight: 1.6 }}>
                    녹음 파일을 업로드하면 AI가 대화를 분석해요<br/>
                    MP3, MP4, WAV, M4A 파일을 지원해요
                  </p>
                  <label style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "12px 24px", borderRadius: 12,
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                    color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}>
                    📂 파일 선택
                    <input type="file" accept="audio/*,video/mp4" style={{ display: "none" }}
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) setVoiceFile(f);
                      }}
                    />
                  </label>
                  {voiceFile && (
                    <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: colors.primaryLight, display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: colors.primary }}>{voiceFile.name}</span>
                      <button onClick={() => setVoiceFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textTertiary }}><X size={14}/></button>
                    </div>
                  )}
                </div>
              {voiceFile && (
                <button onClick={async () => {
                  setVoiceAnalyzing(true);
                  try {
                    let result;
                    // 서버 API 먼저 시도
                    try {
                      const formData = new FormData();
                      formData.append('audio', voiceFile);
                      const response = await fetch('/api/analyze', {
                        method: 'POST',
                        body: formData,
                      });
                      if (!response.ok) throw new Error('서버 API 실패');
                      result = await response.json();
                    } catch {
                      // 직접 Gemini 멀티모달 호출 (음성→분석 한 번에)
                      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
                      if (!apiKey) throw new Error('API 키 없음');

                      // 오디오 파일을 base64로 변환
                      const audioBuffer = await voiceFile.arrayBuffer();
                      const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
                      const mimeType = voiceFile.type || 'audio/webm';

                      const analysisPrompt = `당신은 커플 대화 분석 전문가입니다. 이 오디오 파일의 대화 내용을 인식하고 분석해주세요.

다음 JSON 형식으로 분석 결과를 반환해주세요:
{"topic":"전체 대화 주제 (20자 이내)","moodSummary":"대화 분위기 요약 (2-3문장)","conflictContribution":{"A":0-100,"B":0-100,"interpretation":"갈등 기여도 해석"},"personality":{"A":{"type":"성향 타입","desc":"설명"},"B":{"type":"성향 타입","desc":"설명"}},"goodPoints":{"A":["잘한 점"],"B":["잘한 점"]},"improvements":{"A":["개선 포인트"],"B":["개선 포인트"]},"actionSentences":["실천 문장 1","실천 문장 2"],"tone":{"positive":0-100,"neutral":0-100,"negative":0-100}}`;

                      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          system_instruction: { parts: [{ text: '당신은 커플 대화 분석 전문 상담사입니다.' }] },
                          contents: [{ parts: [
                            { text: analysisPrompt },
                            { inlineData: { mimeType, data: audioBase64 } },
                          ] }],
                          generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
                        }),
                      });
                      if (!geminiRes.ok) throw new Error('Gemini API 실패');
                      const geminiData = await geminiRes.json();
                      result = JSON.parse(geminiData.candidates[0].content.parts[0].text);
                      result.duration = "분석 완료";
                    }
                    setVoiceResult(result);
                  } catch (error) {
                    console.error('Analysis error:', error);
                    showToast("분석에 실패했어요. 다시 시도해주세요.", "error");
                  }
                  setVoiceAnalyzing(false);
                }} style={{
                  width: "100%", padding: "16px", borderRadius: 14,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                  color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {voiceAnalyzing ? (
                    <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }}/> 분석 중...</>
                  ) : (
                    <>🔍 대화 분석 시작</>
                  )}
                </button>
              )}
            </div>
          ) : (
            /* Analysis Results */
            <div>
              {/* 1. 전체 대화 주제 */}
              <div style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                borderRadius: 16, padding: "20px", marginBottom: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>전체 대화 주제</p>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{voiceResult.topic}</h2>
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>⏱ {voiceResult.duration}</span>
                </div>
              </div>

              {/* 2. 대화 분위기 요약 */}
              <div style={{
                background: "#fff", borderRadius: 16, padding: "20px",
                border: `1px solid ${colors.border}`, marginBottom: 12,
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 12 }}>🎭 대화 분위기 요약</h3>
                <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.7 }}>{voiceResult.moodSummary}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  {[
                    { label: "긍정", value: voiceResult.tone.positive, color: colors.mint, bg: colors.mintLight },
                    { label: "중립", value: voiceResult.tone.neutral, color: colors.textTertiary, bg: "#F3F4F6" },
                    { label: "부정", value: voiceResult.tone.negative, color: colors.rose, bg: colors.roseLight },
                  ].map(t => (
                    <div key={t.label} style={{ flex: 1, textAlign: "center", padding: "10px 6px", borderRadius: 10, background: t.bg }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: t.color }}>{t.value}%</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: t.color, marginTop: 2 }}>{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 갈등 기여도 해석 */}
              <div style={{
                background: "#fff", borderRadius: 16, padding: "20px",
                border: `1px solid ${colors.border}`, marginBottom: 12,
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 14 }}>⚖️ 갈등 기여도</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: colors.primary, marginBottom: 4 }}>A</div>
                    <div style={{ height: 8, borderRadius: 4, background: colors.primaryLight, overflow: "hidden" }}>
                      <div style={{ width: `${voiceResult.conflictContribution.A}%`, height: "100%", background: colors.primary, borderRadius: 4 }}/>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: colors.primary, marginTop: 4 }}>{voiceResult.conflictContribution.A}%</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: colors.rose, marginBottom: 4 }}>B</div>
                    <div style={{ height: 8, borderRadius: 4, background: colors.roseLight, overflow: "hidden" }}>
                      <div style={{ width: `${voiceResult.conflictContribution.B}%`, height: "100%", background: colors.rose, borderRadius: 4 }}/>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: colors.rose, marginTop: 4 }}>{voiceResult.conflictContribution.B}%</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6, padding: "12px", background: "#F9FAFB", borderRadius: 10 }}>
                  {voiceResult.conflictContribution.interpretation}
                </p>
              </div>

              {/* 4. 성향 분석 */}
              <div style={{
                background: "#fff", borderRadius: 16, padding: "20px",
                border: `1px solid ${colors.border}`, marginBottom: 12,
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 14 }}>🧠 성향 분석</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { person: "A", data: voiceResult.personality.A, color: colors.primary, bg: colors.primaryLight },
                    { person: "B", data: voiceResult.personality.B, color: colors.rose, bg: colors.roseLight }
                  ].map(p => (
                    <div key={p.person} style={{ padding: "14px", borderRadius: 12, background: p.bg }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: p.color, padding: "2px 8px", background: "#fff", borderRadius: 6 }}>{p.person}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.data.type}</span>
                      </div>
                      <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>{p.data.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. 잘한 점 */}
              <div style={{
                background: "#fff", borderRadius: 16, padding: "20px",
                border: `1px solid ${colors.border}`, marginBottom: 12,
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 14 }}>💚 잘한 점</h3>
                {[
                  { person: "A", points: voiceResult.goodPoints.A, color: colors.primary },
                  { person: "B", points: voiceResult.goodPoints.B, color: colors.rose }
                ].map(p => (
                  <div key={p.person} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: p.color, marginBottom: 8 }}>{p.person}의 잘한 점</div>
                    {p.points.map((point, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 12, marginTop: 1 }}>✅</span>
                        <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>{point}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* 6. 개선 포인트 */}
              <div style={{
                background: "#fff", borderRadius: 16, padding: "20px",
                border: `1px solid ${colors.border}`, marginBottom: 12,
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 14 }}>💡 개선 포인트</h3>
                {[
                  { person: "A", points: voiceResult.improvements.A, color: colors.primary, bg: colors.primaryLight },
                  { person: "B", points: voiceResult.improvements.B, color: colors.rose, bg: colors.roseLight }
                ].map(p => (
                  <div key={p.person} style={{ marginBottom: 12, padding: "14px", borderRadius: 12, background: p.bg }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: p.color, marginBottom: 8 }}>{p.person}에게 드리는 제안</div>
                    {p.points.map((point, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 12, marginTop: 1 }}>💬</span>
                        <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>{point}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* 7. 실천 문장 */}
              <div style={{
                background: `linear-gradient(135deg, ${colors.mintLight}, ${colors.primaryLight})`,
                borderRadius: 16, padding: "20px",
                border: `1px solid ${colors.mint}30`, marginBottom: 12,
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 14 }}>🌱 오늘부터 실천해봐요</h3>
                {voiceResult.actionSentences.map((sentence, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 10, alignItems: "center",
                    padding: "12px 14px", background: "#fff", borderRadius: 12, marginBottom: 8,
                    border: `1px solid ${colors.mint}40`,
                  }}>
                    <span style={{ fontSize: 16 }}>{i === 0 ? "💜" : "💚"}</span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: colors.text, lineHeight: 1.4 }}>"{sentence}"</p>
                  </div>
                ))}
              </div>

              {/* New Analysis Button */}
              <button onClick={() => { setVoiceResult(null); setVoiceFile(null); }} style={{
                width: "100%", padding: "14px", borderRadius: 14,
                background: "#F3F4F6", border: "none",
                fontSize: 14, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
              }}>
                🔄 새로운 대화 분석하기
              </button>
            </div>
          )}
          </>
          ) : (
            /* 잠금 상태 - 포도알 10개 필요 */
            <div style={{
              background: "#fff", borderRadius: 20, padding: "32px 24px",
              border: `1px solid ${colors.border}`, textAlign: "center",
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎙️</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
                AI 대화 분석
              </h3>
              <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 6 }}>
                대화 녹음 파일을 업로드하면<br/>
                AI가 대화 패턴과 개선점을 분석해요
              </p>
              <p style={{ fontSize: 12, color: colors.grape, fontWeight: 600, marginBottom: 20 }}>
                🍇 포도알 10개로 이용 가능
              </p>

              <button onClick={async () => {
                if ((user.grapePoints || 0) < 10) {
                  showToast("포도알이 부족해요! (10개 필요) 🍇");
                  return;
                }
                if (authUser) {
                  const { error } = await spendGrapes(authUser.uid, user.coupleId || null, 10, 'voice_analysis_unlock');
                  if (error) { showToast(error); return; }
                }
                setVoiceUnlocked(true);
                showToast("대화 분석 기능이 열렸어요! 🎙️");
              }} style={{
                width: "100%", padding: "16px", borderRadius: 14,
                background: (user.grapePoints || 0) >= 10
                  ? `linear-gradient(135deg, ${colors.grape}, ${colors.grapeDark})`
                  : "#E5E7EB",
                color: (user.grapePoints || 0) >= 10 ? "#fff" : "#9CA3AF",
                border: "none", fontSize: 15, fontWeight: 700,
                cursor: (user.grapePoints || 0) >= 10 ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                🍇 포도알 10개로 열기 (보유: {user.grapePoints || 0}개)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 갈등 심판 ── */}
      {reportSubTab === "judge" && (
        <div>
          {/* 프리미엄 기능 배지 */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg, #FFD700, #FFA500)",
            padding: "6px 14px", borderRadius: 20, marginBottom: 16,
          }}>
            <Sparkles size={14} color="#fff" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>프리미엄 기능</span>
          </div>

          {judgeUnlocked ? (
            <>
              {!judgeResult ? (
                <div>
                  {/* 대상 선택 */}
                  {!judgeTargetType ? (
                    <div style={{
                      background: "#fff", borderRadius: 16, padding: "24px 20px",
                      border: `1px solid ${colors.border}`, marginBottom: 16,
                    }}>
                      <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 6 }}>
                          누구와의 갈등인가요?
                        </h3>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <button onClick={() => setJudgeTargetType('partner')} style={{
                          padding: "16px", borderRadius: 14, border: `1.5px solid ${colors.primary}`,
                          background: colors.primaryLight, color: colors.primary,
                          fontSize: 15, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}>
                          💑 연인과의 갈등
                          <span style={{ fontSize: 10, background: colors.primary, color: "#fff", borderRadius: 6, padding: "2px 6px" }}>지표 반영</span>
                        </button>
                        <button onClick={() => setJudgeTargetType('other')} style={{
                          padding: "16px", borderRadius: 14, border: `1.5px solid ${colors.border}`,
                          background: "#F9FAFB", color: colors.textSecondary,
                          fontSize: 15, fontWeight: 600, cursor: "pointer",
                        }}>
                          👤 다른 사람과의 갈등
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div style={{
                    background: "#fff", borderRadius: 16, padding: "24px 20px",
                    border: `1px solid ${colors.border}`, marginBottom: 16,
                  }}>
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 6 }}>
                        AI 갈등 심판
                      </h3>
                      <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6 }}>
                        상황을 설명해주시면 AI가 공정하게<br/>
                        누가 더 잘못했는지 판별해드려요
                      </p>
                      <span style={{
                        display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 600, borderRadius: 8, padding: "3px 10px",
                        background: judgeTargetType === 'partner' ? colors.primaryLight : "#F3F4F6",
                        color: judgeTargetType === 'partner' ? colors.primary : colors.textTertiary,
                      }}>
                        {judgeTargetType === 'partner' ? '💑 연인과의 갈등' : '👤 다른 사람과의 갈등'}
                      </span>
                    </div>

                    <textarea
                      value={judgeText}
                      onChange={e => setJudgeText(e.target.value)}
                      placeholder="갈등 상황을 자세히 적어주세요.&#10;&#10;예) 어제 남편이 설거지하기로 했는데 안 하고 게임만 했어요. 제가 화났다고 하니까 오히려 왜 짜증내냐고 하더라고요..."
                      style={{
                        width: "100%", minHeight: 150, padding: "16px", borderRadius: 14,
                        border: `1.5px solid ${colors.border}`, fontSize: 14, resize: "none",
                        outline: "none", lineHeight: 1.6, boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />

                    <button onClick={async () => {
                      if (!judgeText.trim()) return;
                      setJudgeAnalyzing(true);

                      try {
                        let result;
                        try {
                          const response = await fetch('/api/judge', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${authUser ? await authUser.getIdToken() : ''}`,
                            },
                            body: JSON.stringify({ text: judgeText }),
                          });
                          if (!response.ok) throw new Error('서버 API 실패');
                          result = await response.json();
                        } catch {
                          // 직접 Gemini 호출
                          const systemPrompt = `너는 갈등을 중재하는 상담가가 아니라, 행동 기반으로 책임 비율을 판정하는 심판 AI다.

A는 상황을 작성한 사람, B는 상대방이다.

[1단계: 책임 비율 산출]
- 감정이 아니라 행동을 기준으로 책임을 계산한다.
- 억지 균형(50:50, 60:40)을 만들지 않는다.
- 명백한 위반이 있으면 높은 비율을 부여한다.
- 책임이 한쪽에 집중될 수 있다 (0~100 허용).
- aFaultPercent + bFaultPercent = 반드시 100

판단 기준:
1) 사실 위반: 약속 존재 여부, 약속 위반 여부, 사전 통보 여부, 거짓말 여부, 책임 인정 여부, 상대 공격 여부, 반복 여부
2) 고의성: 고의인가, 반복 패턴인가, 즉시 사과했는가
3) 감정 과장 여부 (보조 요소)

[2단계: 잘못 항목 분해]
- 추상적 표현 금지 ("배려가 부족했다" 같은 표현 금지)
- 실제 행동 단위로 잘못을 정리한다 ("설거지 약속을 어기고 게임을 했다" 같은 구체적 행동)
- 감정 비난이 아니라 행동 중심으로 기술한다

[3단계: 화해 문장 생성]
- 방어심을 낮추는 문장 생성
- 책임 공방 유도 금지
- 짧고 실제로 말할 수 있는 문장으로 작성
- "너 때문에" 금지, 과한 사과 강요 금지
- 자연스러운 일상 대화 톤
- 한 문장 2줄 이내

반드시 다음 JSON 형식으로 응답하라:
{
  "verdict": "A" 또는 "B" 또는 "둘다",
  "aFaultPercent": 0-100,
  "bFaultPercent": 0-100,
  "summary": "판단 근거 3줄 이내 요약. 감정 위로 포함하지 말 것.",
  "aFaults": ["A의 구체적 행동 잘못 1", "행동 잘못 2"],
  "bFaults": ["B의 구체적 행동 잘못 1", "행동 잘못 2"],
  "aPhrases": ["A가 먼저 건넬 수 있는 화해 문장 1", "문장 2", "문장 3"],
  "bPhrases": ["B가 먼저 건넬 수 있는 화해 문장 1", "문장 2", "문장 3"]
}`;
                          result = await callGemini(systemPrompt, judgeText);
                        }
                        setJudgeResult(result);
                        // Firestore에 저장 (targetType 포함)
                        if (authUser && ctxActiveCoupleId) {
                          try {
                            const { saveJudgeRecord } = await import('./services/judgeService');
                            await saveJudgeRecord(ctxActiveCoupleId, authUser.uid, {
                              ...result,
                              inputText: judgeText,
                              targetType: judgeTargetType || 'other',
                            });
                          } catch (e) { console.error('Judge save error:', e); }
                        }
                      } catch (error) {
                        console.error('Judge API error:', error);
                        showToast("AI 분석에 실패했어요. 다시 시도해주세요.", "error");
                      } finally {
                        setJudgeAnalyzing(false);
                      }
                    }} disabled={!judgeText.trim() || judgeAnalyzing} style={{
                      width: "100%", padding: "16px", borderRadius: 14, marginTop: 12,
                      background: judgeText.trim() && !judgeAnalyzing
                        ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                        : "#E5E7EB",
                      color: judgeText.trim() && !judgeAnalyzing ? "#fff" : "#9CA3AF",
                      border: "none", fontSize: 15, fontWeight: 700,
                      cursor: judgeText.trim() && !judgeAnalyzing ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                      {judgeAnalyzing ? (
                        <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }}/> AI가 판별 중...</>
                      ) : (
                        <>⚖️ 공정한 판결 받기</>
                      )}
                    </button>
                  </div>
                )}
                </div>
              ) : (
                <div>
                  {/* 판결 결과 */}
                  <div style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.grape})`,
                    borderRadius: 20, padding: "24px", marginBottom: 16, textAlign: "center",
                  }}>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>AI 판결 결과</p>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>⚖️</div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
                      {judgeResult.verdict === "둘다" ? "양쪽 다 잘못" : judgeResult.verdict === "A" ? "나의 잘못이 더 커요" : "상대방 잘못이 더 커요"}
                    </h2>
                    <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
                      <div>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>나</span>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{judgeResult.aFaultPercent}%</div>
                      </div>
                      <div style={{ width: 1, background: "rgba(255,255,255,0.3)" }}/>
                      <div>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>상대</span>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{judgeResult.bFaultPercent}%</div>
                      </div>
                    </div>
                  </div>

                  {/* 상황 요약 */}
                  <div style={{
                    background: "#fff", borderRadius: 16, padding: "16px",
                    border: `1px solid ${colors.border}`, marginBottom: 12,
                  }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 8 }}>📋 상황 요약</h3>
                    <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6 }}>{judgeResult.summary}</p>
                  </div>

                  {/* 잘못 분석 */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1, background: colors.primaryLight, borderRadius: 14, padding: "14px" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>나의 잘못</p>
                      {judgeResult.aFaults.map((f, i) => (
                        <p key={i} style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4, lineHeight: 1.4 }}>• {f}</p>
                      ))}
                    </div>
                    <div style={{ flex: 1, background: colors.roseLight, borderRadius: 14, padding: "14px" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: colors.rose, marginBottom: 8 }}>상대방 잘못</p>
                      {judgeResult.bFaults.map((f, i) => (
                        <p key={i} style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4, lineHeight: 1.4 }}>• {f}</p>
                      ))}
                    </div>
                  </div>

                  {/* 화해 문장 - 내가 건넬 문장 */}
                  <div style={{
                    background: "#fff", borderRadius: 14, padding: "16px", marginBottom: 12,
                    border: `1px solid ${colors.border}`,
                  }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.primary, marginBottom: 10 }}>🕊️ 내가 먼저 건넬 수 있는 말</h3>
                    {(judgeResult.aPhrases || []).map((phrase, i) => (
                      <div key={i} style={{
                        background: colors.primaryLight, borderRadius: 10, padding: "10px 12px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: i < (judgeResult.aPhrases || []).length - 1 ? 8 : 0,
                      }}>
                        <p style={{ fontSize: 13, color: colors.primary, fontWeight: 500, flex: 1, margin: 0 }}>"{phrase}"</p>
                        <button onClick={() => {
                          navigator.clipboard?.writeText?.(phrase);
                          showToast("복사되었어요!");
                        }} style={{
                          background: colors.primary, border: "none", borderRadius: 8,
                          padding: "6px 10px", cursor: "pointer", flexShrink: 0, marginLeft: 8,
                        }}>
                          <Copy size={14} color="#fff" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* 화해 문장 - 상대가 건넬 문장 */}
                  <div style={{
                    background: "#fff", borderRadius: 14, padding: "16px", marginBottom: 16,
                    border: `1px solid ${colors.border}`,
                  }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.rose, marginBottom: 10 }}>💬 상대가 먼저 건넬 수 있는 말</h3>
                    {(judgeResult.bPhrases || []).map((phrase, i) => (
                      <div key={i} style={{
                        background: colors.roseLight, borderRadius: 10, padding: "10px 12px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: i < (judgeResult.bPhrases || []).length - 1 ? 8 : 0,
                      }}>
                        <p style={{ fontSize: 13, color: colors.rose, fontWeight: 500, flex: 1, margin: 0 }}>"{phrase}"</p>
                        <button onClick={() => {
                          navigator.clipboard?.writeText?.(phrase);
                          showToast("복사되었어요!");
                        }} style={{
                          background: colors.rose, border: "none", borderRadius: 8,
                          padding: "6px 10px", cursor: "pointer", flexShrink: 0, marginLeft: 8,
                        }}>
                          <Copy size={14} color="#fff" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => { setJudgeResult(null); setJudgeText(""); setJudgeTargetType(null); }} style={{
                    width: "100%", padding: "14px", borderRadius: 14,
                    background: "#F3F4F6", border: "none",
                    fontSize: 14, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
                  }}>
                    🔄 새로운 상황 심판받기
                  </button>
                </div>
              )}
            </>
          ) : (
            /* 잠금 상태 - 포도알 10개 필요 */
            <div style={{
              background: "#fff", borderRadius: 20, padding: "32px 24px",
              border: `1px solid ${colors.border}`, textAlign: "center",
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>⚖️</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
                AI 갈등 심판
              </h3>
              <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 6 }}>
                갈등 상황을 적으면 AI가 공정하게<br/>
                누가 더 잘못했는지 판별해드려요
              </p>
              <p style={{ fontSize: 12, color: colors.grape, fontWeight: 600, marginBottom: 20 }}>
                🍇 포도알 10개로 이용 가능
              </p>

              <button onClick={async () => {
                if ((user.grapePoints || 0) < 10) {
                  showToast("포도알이 부족해요! (10개 필요) 🍇");
                  return;
                }
                if (authUser) {
                  const { error } = await spendGrapes(authUser.uid, user.coupleId || null, 10, 'judge_unlock');
                  if (error) { showToast(error); return; }
                }
                setJudgeUnlocked(true);
                showToast("갈등 심판 기능이 열렸어요! ⚖️");
              }} style={{
                width: "100%", padding: "16px", borderRadius: 14,
                background: (user.grapePoints || 0) >= 10
                  ? `linear-gradient(135deg, ${colors.grape}, ${colors.grapeDark})`
                  : "#E5E7EB",
                color: (user.grapePoints || 0) >= 10 ? "#fff" : "#9CA3AF",
                border: "none", fontSize: 15, fontWeight: 700,
                cursor: (user.grapePoints || 0) >= 10 ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                🍇 포도알 10개로 열기 (보유: {user.grapePoints || 0}개)
              </button>
            </div>
          )}
        </div>
      )}
      {/* ── 지표 가이드 모달 ── */}
      {showGuideModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setShowGuideModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: "24px 20px",
            width: "90%", maxWidth: 380, maxHeight: "80vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: colors.text }}>📋 지표 산출 가이드</h3>
              <button onClick={() => setShowGuideModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} color={colors.textTertiary} />
              </button>
            </div>

            {/* 종합 점수 */}
            <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "14px", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 8 }}>종합 점수 계산법</div>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <th style={{ textAlign: "left", padding: "6px 4px", color: colors.textSecondary }}>카테고리</th>
                    <th style={{ textAlign: "center", padding: "6px 4px", color: colors.textSecondary }}>비중</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "📊 소통 활발도", weight: "30%" },
                    { label: "🎯 취향 일치도", weight: "25%" },
                    { label: "🕊️ 갈등 빈도", weight: "20%" },
                    { label: "💕 애정 표현", weight: "25%" },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: "6px 4px", color: colors.text }}>{r.label}</td>
                      <td style={{ padding: "6px 4px", textAlign: "center", fontWeight: 700, color: colors.primary }}>{r.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 11, color: colors.textTertiary, marginTop: 8 }}>
                종합 = 소통×0.30 + 취향×0.25 + 갈등×0.20 + 애정×0.25
              </p>
            </div>

            {/* 소통 활발도 */}
            {[
              { title: "📊 소통 활발도 (100점)", items: [
                "연속 접속 (20점): 7일 이상 = 20점",
                "질문 참여율 (25점): 30일 중 양쪽 답변 비율",
                "칭찬 보내기 (20점): 주 3회 이상 = 20점",
                "몰래 한마디 (20점): 주 3회 이상 = 20점",
                "대화 변환 (15점): 주 2회 이상 = 15점 ⚠️ 연인 대상만",
              ]},
              { title: "🎯 취향 일치도 (100점)", items: [
                "같은 답변 비율 (50점): 최근 30일 같은 선택 %",
                "예측 적중률 (50점): 맞춘 횟수 / 예측 횟수 %",
              ]},
              { title: "🕊️ 갈등 빈도 (100점)", items: [
                "갈등심판 월간 사용 ⚠️ 연인 대상만",
                "0회 = 100점 / 1~2회 = 80점 / 3~4회 = 60점 / 5회+ = 40점",
                "전월 대비: 감소 +10 / 증가 -10",
              ]},
              { title: "💕 애정 표현 (100점)", items: [
                "칭찬 보내기 (30점): 월 10회 이상 = 30점",
                "쿠폰 사용 (25점): 월 3회 이상 = 25점",
                "몰래 한마디 (25점): 월 8회 이상 = 25점",
                "포도판 완성 (20점): 1개당 5점, 최대 20점",
              ]},
              { title: "💜 Gottman 5:1 비율", items: [
                "긍정 = 칭찬 + 몰래한마디 + 쿠폰 + 질문참여 + 예측시도",
                "부정 = 갈등심판 (연인 대상만)",
                "비율 = 긍정 횟수 / 부정 횟수",
                "5:1 이상이면 건강한 관계 (Gottman 연구 기준)",
              ]},
            ].map((section, si) => (
              <div key={si} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 6 }}>{section.title}</div>
                {section.items.map((item, ii) => (
                  <div key={ii} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: colors.primary, marginTop: 2 }}>•</span>
                    <span style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}

            <div style={{
              background: colors.primaryLight, borderRadius: 10, padding: "12px", marginTop: 8,
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: colors.primary, marginBottom: 4 }}>
                💡 점수를 올리려면?
              </p>
              <p style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
                매일 칭찬 1번 + 몰래 한마디 1번만 해도 소통·애정 점수가 크게 올라요!
                오늘의 질문에서 예측도 해보세요.
              </p>
            </div>

            <button onClick={() => setShowGuideModal(false)} style={{
              width: "100%", padding: "12px", borderRadius: 12, marginTop: 16,
              background: colors.primary, color: "#fff", border: "none",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              확인
            </button>
          </div>
        </div>
      )}

      </>
      )}
    </div>
  );

  const tabs = [
    { key: "home", label: "tabHome", icon: Home },
    { key: "grape", label: "tabGrape", icon: Heart },
    { key: "coupon", label: "coupon", icon: Ticket },
    { key: "shop", label: "tabShop", icon: Gift },
    { key: "report", label: "tabReport", icon: BarChart3 },
  ];

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", background: colors.bg,
      minHeight: "100vh", position: "relative",
      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
        * { margin: 0; padding: 0; box-sizing: border-box; color-scheme: only light; -webkit-tap-highlight-color: transparent; }
        input, textarea { font-family: inherit; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes grapePop { 0% { transform: scale(1); } 30% { transform: scale(1.15); } 50% { transform: scale(0.95); } 70% { transform: scale(1.05); } 100% { transform: scale(1); } }
        @keyframes grapeFloat { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-48px) scale(1.3); opacity: 0; } }
        @keyframes grapeGlow { 0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); } 50% { box-shadow: 0 0 12px 4px rgba(124,58,237,0.25); } 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); } }
        @keyframes grapeShine { 0% { transform: scale(0) rotate(-20deg); opacity: 0; } 50% { transform: scale(1.2) rotate(10deg); opacity: 1; } 100% { transform: scale(0) rotate(20deg); opacity: 0; } }
        @keyframes confettiFall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(105vh) rotate(720deg); opacity: 0.3; } }
        @keyframes rewardCardHover { 0% { transform: translateY(0); } 50% { transform: translateY(-3px); } 100% { transform: translateY(0); } }
        button:active { transform: scale(0.97); }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <Toast {...toast} />

      {isOffline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          background: colors.rose, color: "#fff",
          padding: "10px 16px", fontSize: 13, fontWeight: 600,
          textAlign: "center", zIndex: 10000,
        }}>
          인터넷 연결이 끊겼어요. 연결을 확인해주세요.
        </div>
      )}

      {/* ── 스트릭 달력 모달 ── */}
      {showStreakCalendar && (() => {
        const { year, month } = streakCalendarMonth;
        const activeDates = ctxStreak?.activeDates || [];
        const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(year, month, 0).getDate();
        const monthDates = activeDates.filter(d => d.startsWith(`${year}-${String(month).padStart(2, '0')}`));
        const monthCount = monthDates.length;
        const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

        return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
          }} onClick={() => setShowStreakCalendar(false)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: "#fff", borderRadius: 24, padding: "24px 20px",
              width: "90%", maxWidth: 360,
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <button onClick={() => {
                  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
                  setStreakCalendarMonth(prev);
                }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>‹</button>
                <div style={{ fontSize: 16, fontWeight: 800, color: colors.text }}>
                  {year}년 {month}월
                </div>
                <button onClick={() => {
                  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
                  setStreakCalendarMonth(next);
                }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>›</button>
              </div>

              {/* Day labels */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                {dayLabels.map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: colors.textTertiary, padding: "4px 0" }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isActive = activeDates.includes(dateStr);
                  const isToday = dateStr === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
                  return (
                    <div key={day} style={{
                      textAlign: "center", padding: "8px 0",
                      borderRadius: 10,
                      background: isActive ? colors.primaryLight : "transparent",
                      border: isToday ? `2px solid ${colors.primary}` : "2px solid transparent",
                    }}>
                      <div style={{
                        fontSize: 13, fontWeight: isActive ? 700 : 400,
                        color: isActive ? colors.primary : colors.textSecondary,
                      }}>{day}</div>
                      {isActive && <div style={{ fontSize: 8, marginTop: 1 }}>🔥</div>}
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div style={{
                marginTop: 16, textAlign: "center", padding: "12px",
                background: colors.primaryLight, borderRadius: 12,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: colors.primary }}>
                  이번달 총 {monthCount}일 방문
                </span>
                {ctxStreak?.current > 0 && (
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    🔥 현재 {ctxStreak.current}일 연속 · 최고 {ctxStreak.longest || ctxStreak.current}일
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Full-screen Settings Modal */}
      {showSettings && (
        <div style={{
          position: "fixed", inset: 0, background: colors.bg,
          zIndex: 200, overflowY: "auto",
        }}>
          {settingsTab === "main" ? (
            <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px 40px" }}>
              {/* Settings Header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 0 24px",
              }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>{t("settings")}</h2>
                <button onClick={() => { setShowSettings(false); setSettingsTab("main"); }} style={{
                  width: 38, height: 38, borderRadius: 12, background: "#fff",
                  border: `1px solid ${colors.border}`, display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer",
                }}>
                  <X size={18} color={colors.textSecondary} />
                </button>
              </div>

              {/* Notification Toggle */}
              <div style={{
                background: "#fff", borderRadius: 16, padding: "18px 20px",
                border: `1px solid ${colors.border}`, marginBottom: 12,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: colors.primaryLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Bell size={18} color={colors.primary} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>알림 설정</div>
                    <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>
                      칭찬, 가사 알림 수신
                    </div>
                  </div>
                </div>
                <button onClick={() => {
                  setNotificationsOn(!notificationsOn);
                  showToast(notificationsOn ? "알림이 꺼졌어요" : "알림이 켜졌어요 🔔");
                }} style={{
                  width: 52, height: 30, borderRadius: 15, border: "none", cursor: "pointer",
                  background: notificationsOn ? colors.primary : "#D1D5DB",
                  position: "relative", transition: "background 0.3s",
                  padding: 0,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 12, background: "#fff",
                    position: "absolute", top: 3,
                    left: notificationsOn ? 25 : 3,
                    transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }} />
                </button>
              </div>

              {/* Language / 언어 */}
              <div style={{
                background: "#fff", borderRadius: 16, padding: "18px 20px",
                border: `1px solid ${colors.border}`, marginBottom: 12,
              }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginBottom: 12 }}>
                  🌐 {t("language")}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {LANGS.map(l => {
                    const isKorean = l === "ko";
                    const isActive = lang === l;
                    return (
                      <button key={l} onClick={() => {
                        if (isKorean) { setLang(l); }
                        else { showToast("준비중입니다"); }
                      }} style={{
                        padding: "8px 16px", borderRadius: 20, border: "none",
                        cursor: isKorean ? "pointer" : "default",
                        fontSize: 13, fontWeight: isActive ? 700 : 500,
                        background: isActive ? colors.primary : isKorean ? colors.primaryLight : "#F3F4F6",
                        color: isActive ? "#fff" : isKorean ? colors.primary : "#C0C0C0",
                        opacity: isKorean ? 1 : 0.5,
                        transition: "all 0.2s",
                      }}>
                        {LANG_LABELS[l]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 짝꿍 연결 */}
              <div style={{
                background: "#fff", borderRadius: 16, padding: "18px 20px",
                border: `1px solid ${colors.border}`, marginBottom: 12,
              }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginBottom: 12 }}>
                  💑 짝꿍 연결
                </div>

                {/* 나의 초대 코드 */}
                <div style={{
                  background: colors.primaryLight, borderRadius: 12, padding: "14px 16px",
                  textAlign: "center", marginBottom: 12,
                }}>
                  <p style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>나의 초대 코드</p>
                  <div style={{ fontSize: 20, fontWeight: 800, color: colors.primary, letterSpacing: 3, marginBottom: 8 }}>
                    {user.inviteCode || "---"}
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                    {!user.inviteCode ? (
                      <button onClick={async () => { await generateInviteCodeOnce(); showToast("초대 코드가 생성되었어요!"); }} style={{
                        background: colors.primary, color: "#fff", border: "none",
                        padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}>
                        <Plus size={12} /> 코드 생성하기
                      </button>
                    ) : (
                      <>
                        <button onClick={() => {
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(user.inviteCode).then(() => showToast("초대 코드가 복사되었어요!"));
                          } else {
                            const ta = document.createElement("textarea"); ta.value = user.inviteCode; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
                            showToast("초대 코드가 복사되었어요!");
                          }
                        }} style={{
                          background: colors.primary, color: "#fff", border: "none",
                          padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                          <Copy size={12} /> 복사
                        </button>
                        <button onClick={async () => {
                          const shareText = `말랑에서 짝꿍이 되어주세요! 초대 코드: ${user.inviteCode}`;
                          if (navigator.share) {
                            try { await navigator.share({ title: "말랑 - 짝꿍 초대", text: shareText }); } catch (e) { /* 취소 */ }
                          } else {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              navigator.clipboard.writeText(shareText).then(() => showToast("공유 메시지가 복사되었어요!"));
                            } else {
                              const ta = document.createElement("textarea"); ta.value = shareText; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
                              showToast("공유 메시지가 복사되었어요!");
                            }
                          }
                        }} style={{
                          background: colors.primaryLight, color: colors.primary, border: `1px solid ${colors.primary}`,
                          padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                          <Share2 size={12} /> 공유
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 짝꿍 연결 상태 */}
                {user.partnerConnected ? (
                  <div style={{
                    background: colors.mintLight, borderRadius: 12, padding: "12px 14px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", background: colors.mint,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Heart size={14} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.mint }}>
                        {user.partnerName || "짝꿍"}님과 연결됨
                      </div>
                      <div style={{ fontSize: 11, color: colors.textTertiary }}>실시간 동기화 중</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
                      짝꿍의 초대 코드를 입력하면 연결돼요
                    </p>
                    <div style={{ display: "flex", gap: 8, width: "100%", boxSizing: "border-box" }}>
                      <input
                        type="text"
                        placeholder="짝꿍 초대 코드"
                        value={welcomePartnerCode}
                        onChange={e => setWelcomePartnerCode(e.target.value.toUpperCase())}
                        style={{
                          flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 10,
                          border: `1.5px solid ${colors.border}`, fontSize: 14,
                          fontWeight: 600, letterSpacing: 2, textAlign: "center",
                          outline: "none", boxSizing: "border-box",
                        }}
                      />
                      <button onClick={async () => {
                        if (!welcomePartnerCode.trim()) {
                          showToast("코드를 입력해주세요", "error");
                          return;
                        }
                        if (authUser) {
                          const { error } = await createPair(authUser.uid, welcomePartnerCode.trim());
                          if (error) {
                            showToast(error, "error");
                          } else {
                            setUser(u => ({ ...u, partnerConnected: true }));
                            setWelcomePartnerCode("");
                            showToast("짝꿍과 연결되었어요! 💜");
                          }
                        }
                      }} style={{
                        padding: "10px 14px", borderRadius: 10,
                        background: colors.primary, color: "#fff", border: "none",
                        fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}>
                        연결
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 내 대화 취향 */}
              <button onClick={() => setSettingsTab("taste")} style={{
                width: "100%", background: "#fff", borderRadius: 16, padding: "18px 20px",
                border: `1px solid ${colors.border}`, marginBottom: 12,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: colors.warmLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <MessageCircle size={18} color={colors.warm} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>내 대화 취향</div>
                    <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>
                      좋아하는 말 · 싫어하는 말 설정
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color={colors.textTertiary} />
              </button>

              {/* 온보딩 설문 다시하기 */}
              <button onClick={() => { setShowSettings(false); setSettingsTab("main"); setScreen("onboarding"); }} style={{
                width: "100%", background: "#fff", borderRadius: 16, padding: "18px 20px",
                border: `1px solid ${colors.border}`, marginBottom: 12,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: colors.grapeLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <RefreshCw size={18} color={colors.grape} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>성향 분석 다시하기</div>
                    <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>
                      대화 스타일 · 사랑의 언어 재설정
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color={colors.textTertiary} />
              </button>

              {/* Profile summary */}
              <div style={{
                background: "#fff", borderRadius: 16, padding: "18px 20px",
                border: `1px solid ${colors.border}`, marginBottom: 12,
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 12 }}>내 프로필</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: colors.textSecondary, display: "block", marginBottom: 4 }}>내 이름</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="text"
                        value={user.name}
                        onChange={e => setUser(u => ({ ...u, name: e.target.value }))}
                        style={{
                          flex: 1, padding: "10px 12px", borderRadius: 10,
                          border: `1.5px solid ${colors.border}`, fontSize: 14, fontWeight: 600,
                          outline: "none", boxSizing: "border-box",
                        }}
                      />
                      <button
                        onClick={async () => {
                          if (!user.name || !user.name.trim()) {
                            showToast("이름을 입력해주세요", "error");
                            return;
                          }
                          const { error } = await updateUserData(authUser.uid, { displayName: user.name.trim() });
                          if (error) {
                            showToast("저장에 실패했어요", "error");
                          } else {
                            showToast("이름이 저장되었어요!");
                          }
                        }}
                        style={{
                          padding: "10px 16px", borderRadius: 10, border: "none",
                          background: colors.primary, color: "#fff", fontSize: 13, fontWeight: 700,
                          cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                        }}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: colors.textSecondary, display: "block", marginBottom: 4 }}>짝꿍 이름</label>
                    {user.partnerConnected ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{
                          flex: 1, padding: "10px 12px", borderRadius: 10,
                          border: `1.5px solid ${colors.border}`, fontSize: 14, fontWeight: 600,
                          background: "#F9FAFB", color: colors.text,
                        }}>
                          {user.partnerName || "짝꿍"}
                        </div>
                        <button onClick={() => {
                          if (window.confirm(`정말 ${user.partnerName || "짝꿍"}님과 연결을 해제하시겠어요?\n\n⚠️ 상대방과의 모든 데이터(포도판, 쿠폰, 칭찬, 질문, 몰래 한마디 등)가 삭제되며 복구할 수 없습니다.`)) {
                            if (window.confirm("정말로 연결 해제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                              (async () => {
                                const { error } = await dissolvePair(user.coupleId, authUser.uid);
                                if (error) {
                                  showToast(error, "error");
                                } else {
                                  setUser(u => ({ ...u, partnerConnected: false, partnerName: "", coupleId: "" }));
                                  setGrapeBoards([]);
                                  setMyCoupons([]);
                                  setShopCoupons([]);
                                  showToast("짝꿍 연결이 해제되었어요");
                                  setShowSettings(false);
                                }
                              })();
                            }
                          }
                        }} style={{
                          padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${colors.rose}`,
                          background: "#fff", color: colors.rose, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                        }}>
                          연결 해제
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        padding: "10px 12px", borderRadius: 10,
                        background: "#F9FAFB", border: `1.5px dashed ${colors.borderActive}`,
                        fontSize: 13, color: colors.textTertiary, textAlign: "center",
                      }}>
                        짝꿍 코드를 등록하면 자동으로 표시돼요
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderTop: `1px solid ${colors.border}`,
                  }}>
                    <span style={{ fontSize: 13, color: colors.textSecondary }}>초대 코드</span>
                    <button onClick={() => {
                      if (user.inviteCode) {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(user.inviteCode).then(() => showToast("초대 코드가 복사되었어요!"));
                        } else {
                          const ta = document.createElement("textarea"); ta.value = user.inviteCode; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
                          showToast("초대 코드가 복사되었어요!");
                        }
                      } else {
                        generateInviteCodeOnce().then(() => showToast("초대 코드가 생성되었어요!"));
                      }
                    }} style={{
                      fontSize: 13, fontWeight: 600, color: colors.primary,
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      {user.inviteCode || "코드 생성하기"} <Copy size={12} />
                    </button>
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderTop: `1px solid ${colors.border}`,
                  }}>
                    <span style={{ fontSize: 13, color: colors.textSecondary }}>오늘 분석</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                      {reportTodayUnlocked ? "열람 완료 ✅" : (!reportFreeUsed ? "첫 분석 무료 🎁" : "포도알 10개 필요 🔒")}
                    </span>
                  </div>
                </div>
              </div>

              {/* 로그아웃 버튼 */}
              <button onClick={handleLogout} style={{
                width: "100%", background: "#fff", borderRadius: 16, padding: "16px 20px",
                border: `1px solid ${colors.rose}`, marginBottom: 12,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: "pointer",
              }}>
                <LogOut size={18} color={colors.rose} />
                <span style={{ fontSize: 15, fontWeight: 600, color: colors.rose }}>로그아웃</span>
              </button>
            </div>
          ) : (
            /* 내 대화 취향 상세 */
            <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "16px 0 24px",
              }}>
                <button onClick={() => setSettingsTab("main")} style={{
                  width: 38, height: 38, borderRadius: 12, background: "#fff",
                  border: `1px solid ${colors.border}`, display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer",
                }}>
                  <ChevronLeft size={18} color={colors.textSecondary} />
                </button>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>💬 내 대화 취향</h2>
              </div>

              <div style={{
                background: colors.warmLight, borderRadius: 12, padding: "12px 14px",
                fontSize: 12, color: colors.warm, marginBottom: 20, lineHeight: 1.6,
              }}>
                💡 여기서 설정한 내용은 AI가 대화를 추천할 때 참고해요. 편하게 작성해주세요!
              </div>

              {/* 좋아하는 말 */}
              <div style={{
                background: "#fff", borderRadius: 16, padding: "20px",
                border: `1px solid ${colors.border}`, marginBottom: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: colors.mintLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Heart size={16} color={colors.mint} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>내가 좋아하는 말</h3>
                    <p style={{ fontSize: 11, color: colors.textTertiary }}>이런 말을 들으면 기분이 좋아요</p>
                  </div>
                </div>
                <textarea
                  value={likedWords}
                  onChange={e => setLikedWords(e.target.value)}
                  placeholder="예: 괜찮아, 고마워, 같이 하자, 잘했어"
                  style={{
                    width: "100%", minHeight: 80, padding: "12px 14px", borderRadius: 12,
                    border: `1.5px solid ${colors.border}`, fontSize: 13, resize: "none",
                    outline: "none", lineHeight: 1.6, boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* 싫어하는 말 */}
              <div style={{
                background: "#fff", borderRadius: 16, padding: "20px",
                border: `1px solid ${colors.border}`, marginBottom: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: colors.roseLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <X size={16} color={colors.rose} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>내가 싫어하는 말</h3>
                    <p style={{ fontSize: 11, color: colors.textTertiary }}>이런 말은 듣기 힘들어요</p>
                  </div>
                </div>
                <textarea
                  value={dislikedWords}
                  onChange={e => setDislikedWords(e.target.value)}
                  placeholder="예: 알아서 해, 또?, 맨날 그러네"
                  style={{
                    width: "100%", minHeight: 80, padding: "12px 14px", borderRadius: 12,
                    border: `1.5px solid ${colors.border}`, fontSize: 13, resize: "none",
                    outline: "none", lineHeight: 1.6, boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <button onClick={() => {
                setSettingsTab("main");
                showToast("대화 취향이 저장되었어요! 💜");
              }} style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                color: "#fff", border: "none", fontSize: 15, fontWeight: 700,
                cursor: "pointer", marginBottom: 20,
              }}>
                저장하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* Global Coupon Creation/Edit Modal */}
      {showCouponCreate && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => { setCouponCreateMode("personal"); setShowCouponCreate(false); setEditCouponId(null); setNewCoupon({ title: "", desc: "", expiry: "" }); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: "28px 22px",
            width: "90%", maxWidth: 370, maxHeight: "85vh", overflowY: "auto",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
              {editCouponId ? "✏️ 쿠폰 수정" : couponCreateMode === "shop" ? "🍇 포도알 상점 쿠폰 등록" : "🎫 말랑 쿠폰 만들기"}
            </h3>
            <p style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 20 }}>
              {couponCreateMode === "shop"
                ? `${partnerDisplayName}님이 포도알로 구매할 수 있는 쿠폰을 등록하세요`
                : `${partnerDisplayName}님에게 보낼 특별한 쿠폰을 만들어보세요`}
            </p>
            <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>쿠폰 이름</label>
            <input type="text" placeholder="예: 설거지 면제권, 소원 1가지 들어주기"
              value={newCoupon.title} onChange={e => setNewCoupon({ ...newCoupon, title: e.target.value })}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${colors.border}`, fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box" }}
            />
            <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>쿠폰 설명</label>
            <textarea placeholder="예: 사용 시 하루 동안 설거지를 안 해도 됩니다!"
              value={newCoupon.desc} onChange={e => setNewCoupon({ ...newCoupon, desc: e.target.value })}
              style={{ width: "100%", minHeight: 70, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${colors.border}`, fontSize: 13, resize: "none", outline: "none", marginBottom: 14, boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.5 }}
            />
            <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>유효기간</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[{ label: "7일", days: 7 }, { label: "14일", days: 14 }, { label: "30일", days: 30 }, { label: "90일", days: 90 }].map(opt => {
                const d = new Date(); d.setDate(d.getDate() + opt.days);
                const val = d.toISOString().split("T")[0];
                return (
                  <button key={opt.days} onClick={() => setNewCoupon({ ...newCoupon, expiry: val })} style={{
                    flex: 1, padding: "8px 4px", borderRadius: 10,
                    background: newCoupon.expiry === val ? colors.primary : "#F3F4F6",
                    color: newCoupon.expiry === val ? "#fff" : colors.textSecondary,
                    border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}>{opt.label}</button>
                );
              })}
            </div>
            {/* Grapes price - shop mode only */}
            {couponCreateMode === "shop" && !editCouponId && (
              <>
                <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>포도알 가격</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <button onClick={() => setNewCouponGrapes(Math.max(1, newCouponGrapes - 1))} style={{
                    width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${colors.border}`,
                    background: "#fff", fontSize: 18, fontWeight: 700, color: colors.textSecondary,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>−</button>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 16 }}>🍇</span>
                    <input type="number" min="1" value={newCouponGrapes}
                      onChange={e => setNewCouponGrapes(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: 56, padding: "6px 4px", borderRadius: 8, border: `1.5px solid ${colors.border}`,
                        fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none",
                        color: colors.grape, boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.textSecondary }}>개</span>
                  </div>
                  <button onClick={() => setNewCouponGrapes(newCouponGrapes + 1)} style={{
                    width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${colors.border}`,
                    background: "#fff", fontSize: 18, fontWeight: 700, color: colors.textSecondary,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>+</button>
                </div>
              </>
            )}
            <div style={{ background: `linear-gradient(135deg, ${colors.primaryLight}, #E0D4FC)`, borderRadius: 14, padding: "16px", marginBottom: 16, border: `1px dashed ${colors.primary}`, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: colors.primary, fontWeight: 600, marginBottom: 6 }}>쿠폰 미리보기</div>
              <div style={{ width: 48, height: 48, borderRadius: 14, margin: "0 auto 8px", background: `linear-gradient(135deg, ${colors.primary}, ${colors.grape})`, display: "flex", alignItems: "center", justifyContent: "center" }}><CouponIcon size={24} color="#fff" /></div>
              <div style={{ fontSize: 15, fontWeight: 700, color: newCoupon.title ? colors.primaryDark : colors.textTertiary }}>{newCoupon.title || "쿠폰 이름"}</div>
              {newCoupon.desc ? <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>{newCoupon.desc}</div> : <div style={{ fontSize: 11, color: colors.textTertiary, marginTop: 4 }}>설명을 입력해보세요</div>}
              {couponCreateMode === "shop" && <div style={{ fontSize: 12, color: colors.grape, fontWeight: 700, marginTop: 6 }}>🍇 {newCouponGrapes}포도알</div>}
              {newCoupon.expiry ? <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 4 }}>유효기간: ~{newCoupon.expiry}</div> : <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 4 }}>유효기간을 선택해주세요</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setCouponCreateMode("personal"); setShowCouponCreate(false); setNewCoupon({ title: "", desc: "", expiry: "" }); setEditCouponId(null); }} style={{
                padding: "14px 12px", borderRadius: 12, background: "#F3F4F6", color: colors.textSecondary, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>취소</button>
              {editCouponId ? (
                <button onClick={async () => {
                  if (!newCoupon.title.trim() || !newCoupon.expiry) return;
                  const coupleId = user.coupleId;
                  if (coupleId && authUser) {
                    const { error } = await updateCoupon(coupleId, editCouponId, authUser.uid, { title: newCoupon.title, desc: newCoupon.desc || "", expiry: newCoupon.expiry });
                    if (error) { showToast(error, "error"); return; }
                  } else {
                    setMyCoupons(prev => prev.map(c => c.id === editCouponId ? { ...c, title: newCoupon.title, desc: newCoupon.desc || "", expiry: newCoupon.expiry } : c));
                  }
                  showToast("쿠폰이 수정되었어요! ✏️");
                  setNewCoupon({ title: "", desc: "", expiry: "" }); setEditCouponId(null); setShowCouponCreate(false);
                }} style={{
                  flex: 1, padding: "14px", borderRadius: 12,
                  background: (newCoupon.title.trim() && newCoupon.expiry) ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` : "#E5E7EB",
                  color: (newCoupon.title.trim() && newCoupon.expiry) ? "#fff" : "#9CA3AF",
                  border: "none", fontSize: 14, fontWeight: 700, cursor: (newCoupon.title.trim() && newCoupon.expiry) ? "pointer" : "default",
                }}>수정하기</button>
              ) : couponCreateMode === "shop" ? (
                <button onClick={async () => {
                  if (!newCoupon.title.trim() || !newCoupon.expiry) return;
                  const coupleId = user.coupleId;
                  if (coupleId && authUser) {
                    const { error } = await createShopListing(coupleId, authUser.uid, {
                      title: newCoupon.title, desc: newCoupon.desc || "",
                      hearts: newCouponGrapes, grapes: newCouponGrapes, expiry: newCoupon.expiry, registeredBy: user.name,
                    });
                    if (error) { showToast(error, "error"); return; }
                  } else {
                    setShopCoupons(prev => [...prev, {
                      id: Date.now(), title: newCoupon.title, desc: newCoupon.desc || "",
                      hearts: newCouponGrapes, grapes: newCouponGrapes, expiry: newCoupon.expiry, registeredBy: user.name,
                    }]);
                  }
                  showToast("상점에 쿠폰을 등록했어요! 🍇");
                  setNewCoupon({ title: "", desc: "", expiry: "" }); setNewCouponGrapes(10); setCouponCreateMode("personal"); setShowCouponCreate(false);
                }} style={{
                  flex: 1, padding: "14px", borderRadius: 12,
                  background: (newCoupon.title.trim() && newCoupon.expiry) ? `linear-gradient(135deg, ${colors.grape}, ${colors.grapeDark})` : "#E5E7EB",
                  color: (newCoupon.title.trim() && newCoupon.expiry) ? "#fff" : "#9CA3AF",
                  border: "none", fontSize: 14, fontWeight: 700, cursor: (newCoupon.title.trim() && newCoupon.expiry) ? "pointer" : "default",
                }}>등록하기</button>
              ) : (<>
                <button onClick={async () => {
                  if (!newCoupon.title.trim() || !newCoupon.expiry) return;
                  const coupleId = user.coupleId;
                  if (coupleId && authUser) {
                    const { error } = await createCoupon(coupleId, authUser.uid, { title: newCoupon.title, desc: newCoupon.desc || "", expiry: newCoupon.expiry }, 0);
                    if (error) { showToast(error, "error"); return; }
                  } else {
                    setMyCoupons(prev => [...prev, { id: Date.now(), title: newCoupon.title, desc: newCoupon.desc || "", from: user.name, to: partnerDisplayName, expiry: newCoupon.expiry, status: "draft", origin: "direct" }]);
                  }
                  showToast("쿠폰을 보관했어요. 나중에 보낼 수 있어요! 📦");
                  setNewCoupon({ title: "", desc: "", expiry: "" }); setEditCouponId(null); setShowCouponCreate(false);
                }} style={{
                  flex: 1, padding: "14px", borderRadius: 12,
                  background: (newCoupon.title.trim() && newCoupon.expiry) ? "#F3F4F6" : "#E5E7EB",
                  color: (newCoupon.title.trim() && newCoupon.expiry) ? colors.text : "#9CA3AF",
                  border: (newCoupon.title.trim() && newCoupon.expiry) ? `1px solid ${colors.border}` : "none",
                  fontSize: 13, fontWeight: 600, cursor: (newCoupon.title.trim() && newCoupon.expiry) ? "pointer" : "default",
                }}>보관하기</button>
                <button onClick={async () => {
                  if (!newCoupon.title.trim() || !newCoupon.expiry) return;
                  if (!user.partnerConnected) {
                    setShowCouponCreate(false);
                    setPartnerRequiredAction("coupon");
                    setShowPartnerRequiredPopup(true);
                    return;
                  }
                  const coupleId = user.coupleId;
                  if (coupleId && authUser) {
                    const { error } = await createCoupon(coupleId, authUser.uid, { title: newCoupon.title, desc: newCoupon.desc || "", expiry: newCoupon.expiry, toUid: user.partnerUid }, 0);
                    if (error) { showToast(error, "error"); return; }
                  } else {
                    setMyCoupons(prev => [...prev, { id: Date.now(), title: newCoupon.title, desc: newCoupon.desc || "", from: user.name, to: partnerDisplayName, expiry: newCoupon.expiry, status: "sent", origin: "direct" }]);
                  }
                  showToast(`${partnerDisplayName}님에게 쿠폰을 보냈어요! 🎫`);
                  setNewCoupon({ title: "", desc: "", expiry: "" }); setEditCouponId(null); setShowCouponCreate(false);
                }} style={{
                  flex: 1, padding: "14px", borderRadius: 12,
                  background: (newCoupon.title.trim() && newCoupon.expiry) ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` : "#E5E7EB",
                  color: (newCoupon.title.trim() && newCoupon.expiry) ? "#fff" : "#9CA3AF",
                  border: "none", fontSize: 13, fontWeight: 700, cursor: (newCoupon.title.trim() && newCoupon.expiry) ? "pointer" : "default",
                }}>바로 보내기</button>
              </>)}
            </div>
          </div>
        </div>
      )}

      {tab === "home" && renderHome()}
      {tab === "grape" && renderGrape()}
      {tab === "shop" && renderShop()}
      {tab === "coupon" && renderCoupon()}
      {tab === "report" && renderReport()}

      {/* ═══ Global Modals ═══ */}

      {/* Coupon Delete Confirm Modal - Global */}
      {confirmDeleteCoupon && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setConfirmDeleteCoupon(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: "24px", width: "82%", maxWidth: 300, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 8 }}>쿠폰을 삭제할까요?</h3>
            <p style={{ fontSize: 13, color: colors.rose, fontWeight: 600, marginBottom: 4 }}>
              {partnerDisplayName}님의 쿠폰에서도 함께 삭제돼요
            </p>
            <p style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 20 }}>
              삭제한 쿠폰은 복구할 수 없어요
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDeleteCoupon(null)} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: "#F3F4F6",
                border: "none", fontSize: 14, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
              }}>취소</button>
              <button onClick={async () => {
                const coupleId = user.coupleId;
                if (coupleId && authUser) {
                  const { error } = await deleteCoupon(coupleId, confirmDeleteCoupon, authUser.uid);
                  if (error) { showToast(error, "error"); return; }
                } else {
                  setMyCoupons(prev => prev.filter(c => c.id !== confirmDeleteCoupon));
                }
                setConfirmDeleteCoupon(null);
                showToast("쿠폰이 삭제되었어요");
              }} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: colors.rose,
                border: "none", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
              }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Todo Delete Confirm Modal - Global */}
      {confirmDeleteTodo && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setConfirmDeleteTodo(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: "24px", width: "82%", maxWidth: 300, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 8 }}>할 일을 삭제할까요?</h3>
            <p style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 20 }}>
              삭제한 할 일은 복구할 수 없어요
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDeleteTodo(null)} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: "#F3F4F6",
                border: "none", fontSize: 14, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
              }}>취소</button>
              <button onClick={() => {
                setChores(prev => prev.filter(c => c.id !== confirmDeleteTodo));
                setConfirmDeleteTodo(null);
                showToast("할 일이 삭제되었어요");
              }} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: colors.rose,
                border: "none", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
              }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Shop Coupon Delete Confirm Modal - Global */}
      {confirmDeleteShopCoupon && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setConfirmDeleteShopCoupon(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: "24px", width: "80%", maxWidth: 300, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 8 }}>쿠폰을 삭제할까요?</h3>
            <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>삭제한 쿠폰은 복구할 수 없어요</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDeleteShopCoupon(null)} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: "#F3F4F6",
                border: "none", fontSize: 14, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
              }}>취소</button>
              <button onClick={async () => {
                const coupleId = user.coupleId;
                if (coupleId) {
                  const { error } = await deleteShopListing(coupleId, confirmDeleteShopCoupon);
                  if (error) { showToast(error, "error"); return; }
                } else {
                  setShopCoupons(prev => prev.filter(c => c.id !== confirmDeleteShopCoupon));
                }
                setConfirmDeleteShopCoupon(null);
                showToast("쿠폰이 삭제되었어요");
              }} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: colors.rose,
                border: "none", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
              }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Mood Selection Popup - Global */}
      {showMoodPopup && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 250, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, padding: "28px 24px",
            width: "90%", maxWidth: 360, textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💜</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.text, marginBottom: 8 }}>
              오늘 기분이 어때요?
            </h2>
            <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 24 }}>
              매일 기분을 기록하면 관계 분석에 도움이 돼요
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { emoji: "😊", label: "좋아요", value: "good" },
                { emoji: "🥰", label: "행복해요", value: "happy" },
                { emoji: "😐", label: "그냥그래요", value: "neutral" },
                { emoji: "😔", label: "우울해요", value: "sad" },
                { emoji: "😤", label: "화나요", value: "angry" },
              ].map(mood => (
                <button key={mood.value} onClick={async () => {
                  const today = getLocalToday();
                  const moodEntry = {
                    date: today,
                    mood: mood.value,
                    emoji: mood.emoji,
                    timestamp: new Date().toISOString(),
                  };
                  setMoodHistory(prev => [...prev.filter(m => m.date !== today), moodEntry]);
                  localStorage.setItem("mallang_lastMoodDate", today);
                  moodPopupShownRef.current = today;
                  setShowMoodPopup(false);
                  showToast(`오늘 기분: ${mood.emoji} ${mood.label}`);
                  if (authUser) {
                    const { error } = await saveMoodEntry(authUser.uid, moodEntry);
                    if (error) console.error('Mood save error:', error);
                  }
                }} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "14px 16px", borderRadius: 16, background: "#F9FAFB",
                  border: `1.5px solid ${colors.border}`, cursor: "pointer",
                  transition: "all 0.2s", minWidth: 60,
                }}>
                  <span style={{ fontSize: 28 }}>{mood.emoji}</span>
                  <span style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 600 }}>{mood.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowMoodPopup(false)} style={{
              background: "none", border: "none", color: colors.textTertiary, fontSize: 13, cursor: "pointer",
            }}>나중에 할게요</button>
          </div>
        </div>
      )}

      {/* Coupon Send Confirm Modal - Global */}
      {confirmSendCoupon && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setConfirmSendCoupon(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: "24px", width: "82%", maxWidth: 300, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎫</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 8 }}>보내시겠습니까?</h3>
            <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
              {partnerDisplayName}님에게 쿠폰이 전달돼요
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmSendCoupon(null)} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: "#F3F4F6",
                border: "none", fontSize: 14, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
              }}>취소</button>
              <button onClick={async () => {
                const coupleId = user.coupleId;
                if (coupleId && authUser) {
                  const { error } = await sendCoupon(coupleId, confirmSendCoupon, user.partnerUid);
                  if (error) { showToast(error, "error"); return; }
                } else {
                  setMyCoupons(prev => prev.map(c => c.id === confirmSendCoupon ? { ...c, status: "sent" } : c));
                }
                setConfirmSendCoupon(null);
                showToast(`${partnerDisplayName}님에게 쿠폰을 보냈어요! 🎫`);
                trackFeatureUse('coupon_send');
              }} style={{
                flex: 1, padding: "12px", borderRadius: 12,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                border: "none", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
              }}>보내기</button>
            </div>
          </div>
        </div>
      )}

      {/* Reward Modal on 100% completion - global */}
      {showRewardModal && (() => {
        const completionMessages = [
          `🎉 축하해요! 목표를 달성했어요!\n${partnerDisplayName}님에게 쿠폰으로 보답해보세요!`,
          `💜 대단해요! 포도판을 완성했어요!\n이 기쁨을 ${partnerDisplayName}님과 함께 나눠보세요!`,
          `🍇 달콤한 결실을 맺었어요!\n서로의 노력에 쿠폰과 선물로 감사를 전해보세요!`,
        ];
        const randomMsg = completionMessages[Math.floor(Math.random() * completionMessages.length)];
        return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              background: "#fff", borderRadius: 24, padding: "32px 22px 24px",
              width: "90%", maxWidth: 370, textAlign: "center",
              animation: "slideUp 0.4s ease",
            }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>🍇</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.text, marginBottom: 4, lineHeight: 1.4 }}>
                포도판 달성 완료!
              </h2>
              <p style={{ fontSize: 14, fontWeight: 600, color: colors.grape, marginBottom: 12 }}>"{rewardBoardTitle}"</p>
              <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {randomMsg}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <button onClick={() => { setShowRewardModal(false); setTab("coupon"); setCouponCreateMode("personal"); setShowCouponCreate(true); }} style={{
                  background: `linear-gradient(135deg, ${colors.primaryLight}, #E0D4FC)`,
                  border: `1.5px solid ${colors.primary}`, borderRadius: 16, padding: "18px 16px",
                  cursor: "pointer", textAlign: "left",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 32 }}>🎫</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: colors.primaryDark, marginBottom: 4 }}>{partnerDisplayName}님에게 쿠폰 선물하기</div>
                      <div style={{ fontSize: 11, color: colors.textSecondary }}>마음을 담은 쿠폰을 만들어보세요</div>
                    </div>
                    <ChevronRight size={18} color={colors.primary} />
                  </div>
                </button>
                <button onClick={() => { setShowRewardModal(false); setTab("shop"); }} style={{
                  background: `linear-gradient(135deg, ${colors.goldLight}, #FEF3C7)`,
                  border: `1.5px solid ${colors.gold}`, borderRadius: 16, padding: "18px 16px",
                  cursor: "pointer", textAlign: "left",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 32 }}>🎁</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>선물하러 가기</div>
                      <div style={{ fontSize: 11, color: colors.textSecondary }}>포도알로 상점에서 특별한 선물을 골라보세요</div>
                    </div>
                    <ChevronRight size={18} color={colors.gold} />
                  </div>
                </button>
              </div>
              <button onClick={() => { setShowRewardModal(false); }} style={{
                background: "none", border: "none", color: colors.textTertiary, fontSize: 13, cursor: "pointer", padding: "8px",
              }}>나중에 할게요</button>
            </div>
          </div>
        );
      })()}

      {/* 짝꿍 미등록 경고 팝업 */}
      {showPartnerRequiredPopup && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "28px 24px",
            width: "85%", maxWidth: 320, textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
              짝꿍을 등록해주세요
            </h3>
            <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
              {partnerRequiredAction === "praise"
                ? "칭찬을 보내려면 먼저 짝꿍과 연결해야 해요."
                : partnerRequiredAction === "coupon"
                ? "쿠폰을 보내려면 먼저 짝꿍과 연결해야 해요."
                : "이 기능은 짝꿍과 연결해야 사용할 수 있어요."}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowPartnerRequiredPopup(false)} style={{
                flex: 1, padding: "13px", borderRadius: 12,
                background: "#F3F4F6", color: colors.textSecondary,
                border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>닫기</button>
              <button onClick={() => {
                setShowPartnerRequiredPopup(false);
                setShowSettings(true);
              }} style={{
                flex: 1, padding: "13px", borderRadius: 12,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>짝꿍코드<br/>등록하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 포도판 삭제 확인 팝업 */}
      {confirmDeleteBoard && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setConfirmDeleteBoard(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: "24px", width: "82%", maxWidth: 300, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🍇</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
              포도판을 삭제할까요?
            </h3>
            <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
              삭제하면 복구할 수 없어요.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDeleteBoard(null)} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: "#F3F4F6",
                border: "none", fontSize: 14, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
              }}>취소</button>
              <button onClick={async () => {
                const coupleId = user.coupleId;
                if (coupleId) {
                  const { error } = await deleteGrapeBoard(coupleId, confirmDeleteBoard);
                  if (error) { showToast(error, "error"); return; }
                } else {
                  setGrapeBoards(prev => prev.filter(b => b.id !== confirmDeleteBoard));
                }
                setConfirmDeleteBoard(null);
                showToast("포도판이 삭제되었어요");
              }} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: colors.rose,
                border: "none", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
              }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 칭찬 삭제 확인 팝업 */}
      {confirmDeletePraise && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setConfirmDeletePraise(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 20, padding: "24px", width: "82%", maxWidth: 300, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💜</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 8 }}>칭찬을 삭제할까요?</h3>
            <p style={{ fontSize: 12, color: colors.textTertiary, marginBottom: 20 }}>삭제한 칭찬은 복구할 수 없어요</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDeletePraise(null)} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: "#F3F4F6",
                border: "none", fontSize: 14, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
              }}>취소</button>
              <button onClick={() => {
                setPraiseLog(prev => prev.filter(p => p.id !== confirmDeletePraise));
                setConfirmDeletePraise(null);
                showToast("칭찬이 삭제되었어요");
              }} style={{
                flex: 1, padding: "12px", borderRadius: 12, background: colors.rose,
                border: "none", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
              }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 앱 종료 확인 팝업 */}
      {showExitConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "28px 24px",
            width: "82%", maxWidth: 300, textAlign: "center",
          }}>
            <img src="/splash-logo.png" alt="말랑" width={40} height={40} style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
              앱을 종료할까요?
            </h3>
            <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 24 }}>
              다음에 또 만나요!
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowExitConfirm(false)} style={{
                flex: 1, padding: "14px", borderRadius: 12, background: "#F3F4F6",
                border: "none", fontSize: 14, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
              }}>취소</button>
              <button onClick={() => {
                // PWA나 브라우저에서 창 닫기 시도
                window.close();
                // window.close()가 안 되면 뒤로 가기
                window.history.back();
              }} style={{
                flex: 1, padding: "14px", borderRadius: 12,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                border: "none", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
              }}>종료</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 420, background: "#fff",
        borderTop: `1px solid ${colors.border}`,
        display: "flex", padding: "6px 0 env(safe-area-inset-bottom, 8px)",
        zIndex: 50,
      }}>
        {tabs.map(tb => {
          const active = tab === tb.key;
          const Icon = tb.icon;
          return (
            <button key={tb.key} onClick={() => {
              if (tab === "report" && tb.key !== "report" && !reportFreeUsed) {
                setReportFreeUsed(true);
              }
              setTab(tb.key);
            }} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, padding: "8px 0", background: "none", border: "none", cursor: "pointer",
            }}>
              <Icon size={20} color={active ? colors.primary : colors.textTertiary}
                fill={active && tb.key === "grape" ? colors.primary : "none"}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? colors.primary : colors.textTertiary,
              }}>
                {t(tb.label)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
