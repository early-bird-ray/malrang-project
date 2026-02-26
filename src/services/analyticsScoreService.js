// 관계 분석 점수 계산 서비스
// 모든 함수는 Context에서 이미 로드된 데이터를 인자로 받음

// ── Gottman 5:1 비율 ──
// 긍정: 칭찬, 몰래한마디, 쿠폰 선물, 오늘의 질문 참여, 예측 시도
// 부정: 갈등심판 사용 (연인 대상만, targetType === 'partner')
export const calcGottmanRatio = ({ praises, secretMessages, coupons, dailyQuestions, judgeRecords, uid, partnerUid, dateRange }) => {
  const inRange = (dateStr) => {
    if (!dateRange || !dateStr) return true;
    return dateStr >= dateRange.start && dateStr <= dateRange.end;
  };

  const getDateStr = (item) => {
    const ts = item.createdAt || item.timestamp || item.dateStr || '';
    return ts.substring(0, 10);
  };

  // 긍정 카운트
  let positive = 0;
  positive += praises.filter(p => inRange(getDateStr(p))).length;
  positive += secretMessages.filter(m => m.fromUid === uid && inRange(getDateStr(m))).length;
  positive += coupons.filter(c => c.status === 'used' && inRange(getDateStr(c))).length;
  // dailyQuestions: 양쪽 답변 완료된 날 = 1 긍정
  positive += dailyQuestions.filter(q => {
    const answers = q.answers || {};
    return Object.keys(answers).length >= 2 && inRange(q.id);
  }).length;
  // 예측 시도
  positive += dailyQuestions.filter(q => {
    const predictions = q.predictions || {};
    return predictions[uid] && inRange(q.id);
  }).length;

  // 부정 카운트 (연인 대상만)
  const negative = judgeRecords.filter(j =>
    j.targetType === 'partner' && inRange(getDateStr(j))
  ).length;

  const ratio = negative > 0 ? +(positive / negative).toFixed(1) : positive > 0 ? positive : 0;

  return { positive, negative, ratio };
};

// ── 1. 소통 활발도 (100점) ──
export const calcCommunicationScore = ({ streak, dailyQuestions, praises, secretMessages, aiTransformHistory, uid, dateRange }) => {
  const inRange = (dateStr) => {
    if (!dateRange || !dateStr) return true;
    return dateStr >= dateRange.start && dateStr <= dateRange.end;
  };
  const getDateStr = (item) => (item.createdAt || item.timestamp || item.dateStr || '').substring(0, 10);

  // 스트릭 (20점): 7일 이상 = 20점
  const streakScore = Math.min(20, Math.round((streak.current || 0) / 7 * 20));

  // 오늘의 질문 참여율 (25점): 30일 중 양쪽 답변일 비율
  const totalDays = dateRange ? Math.max(1, Math.ceil((new Date(dateRange.end) - new Date(dateRange.start)) / 86400000) + 1) : 30;
  const answeredDays = dailyQuestions.filter(q => {
    const answers = q.answers || {};
    return Object.keys(answers).length >= 2 && inRange(q.id);
  }).length;
  const questionScore = Math.min(25, Math.round((answeredDays / totalDays) * 25));

  // 칭찬 빈도 (20점): 주 3회 → 월 12회 이상 = 20점
  const praiseCount = praises.filter(p => inRange(getDateStr(p))).length;
  const praiseScore = Math.min(20, Math.round((praiseCount / 12) * 20));

  // 몰래 한마디 (20점): 주 3회 → 월 12회 이상 = 20점
  const secretCount = secretMessages.filter(m => m.fromUid === uid && inRange(getDateStr(m))).length;
  const secretScore = Math.min(20, Math.round((secretCount / 12) * 20));

  // 대화 변환 사용 (15점): 주 2회 → 월 8회 이상 = 15점 (연인 대상만)
  const transformCount = aiTransformHistory.filter(t =>
    t.targetType === 'partner' && inRange(getDateStr(t))
  ).length;
  const transformScore = Math.min(15, Math.round((transformCount / 8) * 15));

  const total = streakScore + questionScore + praiseScore + secretScore + transformScore;

  return {
    total,
    details: {
      streak: { score: streakScore, max: 20, value: streak.current || 0, label: '연속 접속', desc: '7일 이상 = 20점' },
      question: { score: questionScore, max: 25, value: answeredDays, label: '질문 참여', desc: `${totalDays}일 중 ${answeredDays}일` },
      praise: { score: praiseScore, max: 20, value: praiseCount, label: '칭찬 보내기', desc: '월 12회 이상 = 20점' },
      secret: { score: secretScore, max: 20, value: secretCount, label: '몰래 한마디', desc: '월 12회 이상 = 20점' },
      transform: { score: transformScore, max: 15, value: transformCount, label: '대화 변환', desc: '월 8회 이상 = 15점 (연인 대상)' },
    },
  };
};

// ── 2. 취향 일치도 (100점) ──
export const calcCompatibilityScore = ({ dailyQuestions, uid, partnerUid, dateRange }) => {
  const inRange = (id) => {
    if (!dateRange || !id) return true;
    return id >= dateRange.start && id <= dateRange.end;
  };

  const bothAnswered = dailyQuestions.filter(q => {
    const a = q.answers || {};
    return a[uid] && a[partnerUid] && inRange(q.id);
  });

  // 같은 답변 비율 (50점)
  const sameCount = bothAnswered.filter(q => q.answers[uid].text === q.answers[partnerUid].text).length;
  const matchRate = bothAnswered.length > 0 ? sameCount / bothAnswered.length : 0;
  const matchScore = Math.round(matchRate * 50);

  // 예측 적중률 (50점)
  const predicted = dailyQuestions.filter(q => {
    const p = q.predictions || {};
    const a = q.answers || {};
    return p[uid] && a[partnerUid] && inRange(q.id);
  });
  const correctCount = predicted.filter(q => q.predictions[uid].text === q.answers[partnerUid].text).length;
  const predictRate = predicted.length > 0 ? correctCount / predicted.length : 0;
  const predictScore = Math.round(predictRate * 50);

  return {
    total: matchScore + predictScore,
    details: {
      match: { score: matchScore, max: 50, value: `${Math.round(matchRate * 100)}%`, label: '같은 답변', desc: `${bothAnswered.length}문제 중 ${sameCount}개 일치` },
      predict: { score: predictScore, max: 50, value: `${Math.round(predictRate * 100)}%`, label: '예측 적중', desc: `${predicted.length}번 중 ${correctCount}번 맞춤` },
    },
  };
};

// ── 3. 갈등 빈도 (100점) ──
export const calcConflictScore = ({ judgeRecords, dateRange, prevDateRange }) => {
  const inRange = (dateStr, range) => {
    if (!range || !dateStr) return true;
    return dateStr >= range.start && dateStr <= range.end;
  };
  const getDateStr = (item) => (item.createdAt || item.timestamp || '').substring(0, 10);

  // 이번 달 갈등심판 (연인 대상만)
  const thisMonth = judgeRecords.filter(j =>
    j.targetType === 'partner' && inRange(getDateStr(j), dateRange)
  ).length;

  // 지난 달 갈등심판
  const lastMonth = judgeRecords.filter(j =>
    j.targetType === 'partner' && inRange(getDateStr(j), prevDateRange)
  ).length;

  // 기본 점수
  let baseScore;
  if (thisMonth === 0) baseScore = 100;
  else if (thisMonth <= 2) baseScore = 80;
  else if (thisMonth <= 4) baseScore = 60;
  else baseScore = 40;

  // 추세 보너스/감점
  let trendBonus = 0;
  if (prevDateRange && lastMonth > 0) {
    if (thisMonth < lastMonth) trendBonus = 10;
    else if (thisMonth > lastMonth) trendBonus = -10;
  }

  const total = Math.max(0, Math.min(100, baseScore + trendBonus));

  return {
    total,
    details: {
      count: { score: baseScore, max: 100, value: `${thisMonth}회`, label: '이번 달 갈등심판', desc: '연인 대상만 반영' },
      trend: { score: trendBonus, max: 10, value: trendBonus > 0 ? '감소' : trendBonus < 0 ? '증가' : '유지', label: '전월 대비', desc: `지난달 ${lastMonth}회 → 이번달 ${thisMonth}회` },
    },
  };
};

// ── 4. 애정 표현 (100점) ──
export const calcAffectionScore = ({ praises, coupons, secretMessages, grapeBoards, uid, dateRange }) => {
  const inRange = (dateStr) => {
    if (!dateRange || !dateStr) return true;
    return dateStr >= dateRange.start && dateStr <= dateRange.end;
  };
  const getDateStr = (item) => (item.createdAt || item.timestamp || item.dateStr || '').substring(0, 10);

  // 칭찬 (30점): 월 10회 이상 = 30점
  const praiseCount = praises.filter(p => inRange(getDateStr(p))).length;
  const praiseScore = Math.min(30, Math.round((praiseCount / 10) * 30));

  // 쿠폰 사용 (25점): 월 3회 이상 = 25점
  const couponCount = coupons.filter(c => c.status === 'used' && inRange(getDateStr(c))).length;
  const couponScore = Math.min(25, Math.round((couponCount / 3) * 25));

  // 몰래 한마디 (25점): 월 8회 이상 = 25점
  const secretCount = secretMessages.filter(m => m.fromUid === uid && inRange(getDateStr(m))).length;
  const secretScore = Math.min(25, Math.round((secretCount / 8) * 25));

  // 포도판 완성 (20점): 누적 1개당 5점, 최대 20점
  const completedBoards = grapeBoards.filter(b => (b.current || 0) >= (b.goal || Infinity)).length;
  const boardScore = Math.min(20, completedBoards * 5);

  const total = praiseScore + couponScore + secretScore + boardScore;

  return {
    total,
    details: {
      praise: { score: praiseScore, max: 30, value: `${praiseCount}회`, label: '칭찬 보내기', desc: '월 10회 이상 = 30점' },
      coupon: { score: couponScore, max: 25, value: `${couponCount}회`, label: '쿠폰 사용', desc: '월 3회 이상 = 25점' },
      secret: { score: secretScore, max: 25, value: `${secretCount}회`, label: '몰래 한마디', desc: '월 8회 이상 = 25점' },
      board: { score: boardScore, max: 20, value: `${completedBoards}개`, label: '포도판 완성', desc: '1개당 5점 (최대 20점)' },
    },
  };
};

// ── 종합 점수 ──
export const calcOverallScore = (communication, compatibility, conflict, affection) => {
  return Math.round(
    communication.total * 0.30 +
    compatibility.total * 0.25 +
    conflict.total * 0.20 +
    affection.total * 0.25
  );
};

// ── 날짜 범위 유틸 ──
export const getDateRange = (year, month) => {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
};

export const getPrevDateRange = (year, month) => {
  const prevDate = new Date(year, month - 2, 1);
  return getDateRange(prevDate.getFullYear(), prevDate.getMonth() + 1);
};
