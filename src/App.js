import { useState, useEffect, useCallback } from "react";
import {
  Heart, MessageCircle, Home, BarChart3,
  ChevronRight, ChevronLeft, Copy, Share2, Check, X, Plus,
  Gift, Sparkles, Ticket,
  Send, Bell, Settings,
  RefreshCw, Leaf, Utensils, Shirt,
  Trash2, LogOut
} from "lucide-react";
import { signInWithGoogle, logOut, onAuthChange, saveUserData, getUserData } from "./firebase";


// ─── i18n (Internationalization) ─────────────────────────
const LANGS = ["ko", "en", "zh", "ja"];
const LANG_LABELS = { ko: "한국어", en: "English", zh: "中文", ja: "日本語" };

const i18n = {
  // ── Splash / Welcome ──
  splashSub:       { ko: "말랑해진 우리사이", en: "Softening our bond", zh: "让我们的关系更柔软", ja: "ふたりの距離をやわらかく" },
  welcomeSub1:     { ko: "우리 사이를 더 달콤하게", en: "Make our bond sweeter", zh: "让我们的关系更甜蜜", ja: "ふたりの関係をもっと甘く" },
  welcomeSub2:     { ko: "말랑말랑한 대화의 시작", en: "The start of a soft conversation", zh: "柔软对话的开始", ja: "やわらかい会話のはじまり" },
  myName:          { ko: "내 이름 (닉네임)", en: "My Name (Nickname)", zh: "我的名字（昵称）", ja: "名前（ニックネーム）" },
  namePlaceholder: { ko: "예: 말랑", en: "e.g. Mallang", zh: "例：软软", ja: "例：まるまる" },
  partnerCode:     { ko: "짝꿍의 초대 코드", en: "Partner's Invite Code", zh: "伴侣的邀请码", ja: "パートナーの招待コード" },
  codePlaceholder: { ko: "예: MALL-7K2X", en: "e.g. MALL-7K2X", zh: "例：MALL-7K2X", ja: "例：MALL-7K2X" },
  startTogether:   { ko: "함께 시작하기", en: "Start Together", zh: "一起开始", ja: "一緒にはじめる" },
  skipCode:        { ko: "초대 코드 없이 시작", en: "Start without code", zh: "没有邀请码也能开始", ja: "招待コードなしで始める" },
  skipConfirm:     { ko: "초대 코드 없이 시작하면 짝꿍과 연결 없이 혼자 사용하게 돼요. 나중에 설정에서 연결할 수 있어요.", en: "Starting without a code means you'll use the app solo. You can connect later in settings.", zh: "没有邀请码将独自使用，稍后可在设置中连接。", ja: "招待コードなしで始めると一人で使うことになります。後で設定から接続できます。" },
  continueAlone:   { ko: "혼자 시작하기", en: "Continue Alone", zh: "独自开始", ja: "ひとりで始める" },
  enterCode:       { ko: "코드 입력하기", en: "Enter Code", zh: "输入邀请码", ja: "コードを入力" },
  myInviteCode:    { ko: "나의 초대 코드", en: "My Invite Code", zh: "我的邀请码", ja: "わたしの招待コード" },
  codeCopied:      { ko: "초대 코드가 복사되었어요!", en: "Invite code copied!", zh: "邀请码已复制！", ja: "招待コードをコピーしました！" },
  or:              { ko: "또는", en: "or", zh: "或者", ja: "または" },
  // ── Navigation ──
  tabHome:    { ko: "홈", en: "Home", zh: "首页", ja: "ホーム" },
  tabGrape:   { ko: "포도", en: "Grape", zh: "葡萄", ja: "ぶどう" },
  tabChat:    { ko: "대화", en: "Chat", zh: "聊天", ja: "会話" },
  tabShop:    { ko: "상점", en: "Shop", zh: "商店", ja: "ショップ" },
  tabReport:  { ko: "분석", en: "Report", zh: "分析", ja: "分析" },
  // ── Home ──
  hello:          { ko: "안녕하세요", en: "Hello", zh: "你好", ja: "こんにちは" },
  homeGreeting:   { ko: "오늘도 함께해요 💜", en: "Together again today 💜", zh: "今天也一起吧 💜", ja: "今日も一緒に 💜" },
  partnerDefault: { ko: "짝꿍", en: "Partner", zh: "伴侣", ja: "パートナー" },
  todoStatus:     { ko: "⚖️ 할일 현황", en: "⚖️ Task Status", zh: "⚖️ 任务状况", ja: "⚖️ タスク状況" },
  todayTodo:      { ko: "오늘의 할 일", en: "Today's Tasks", zh: "今天的待办", ja: "今日のタスク" },
  addTask:        { ko: "할 일 추가", en: "Add Task", zh: "添加任务", ja: "タスク追加" },
  complete:       { ko: "완료", en: "Done", zh: "完成", ja: "完了" },
  grapeBoard:     { ko: "포도판", en: "Grape Board", zh: "葡萄板", ja: "ぶどうボード" },
  grapePoints:    { ko: "포도알", en: "Grapes", zh: "葡萄粒", ja: "ぶどう粒" },
  chatHelper:     { ko: "대화 도우미", en: "Chat Helper", zh: "聊天助手", ja: "会話ヘルパー" },
  praise:         { ko: "칭찬", en: "Praise", zh: "表扬", ja: "ほめる" },
  praiseHistory:  { ko: "칭찬 기록", en: "Praise History", zh: "表扬记录", ja: "ほめる記録" },
  noPraise:       { ko: "아직 칭찬 기록이 없어요", en: "No praise yet", zh: "还没有表扬记录", ja: "まだほめる記録がありません" },
  praisePlaceholder: { ko: "칭찬 한마디를 적어보세요 💜", en: "Write a word of praise 💜", zh: "写一句表扬吧 💜", ja: "ほめ言葉を書いてみて 💜" },
  send:           { ko: "보내기", en: "Send", zh: "发送", ja: "送る" },
  // ── Grape Board ──
  newBoard:      { ko: "새 포도판 만들기", en: "New Grape Board", zh: "新建葡萄板", ja: "新しいぶどうボード" },
  boardTitle:    { ko: "포도판 이름", en: "Board Name", zh: "葡萄板名称", ja: "ボード名" },
  goal:          { ko: "목표", en: "Goal", zh: "目标", ja: "目標" },
  perSuccess:    { ko: "성공당", en: "Per Success", zh: "每次成功", ja: "成功ごと" },
  owner:         { ko: "담당", en: "Owner", zh: "负责人", ja: "担当" },
  ownerUs:       { ko: "우리", en: "Us", zh: "我们", ja: "ふたり" },
  ownerMe:       { ko: "나", en: "Me", zh: "我", ja: "わたし" },
  ownerPartner:  { ko: "상대", en: "Partner", zh: "对方", ja: "相手" },
  create:        { ko: "만들기", en: "Create", zh: "创建", ja: "作成" },
  register:      { ko: "등록하기", en: "Register", zh: "登记", ja: "登録" },
  cancel:        { ko: "취소", en: "Cancel", zh: "取消", ja: "キャンセル" },
  edit:          { ko: "수정", en: "Edit", zh: "编辑", ja: "編集" },
  editSave:      { ko: "수정하기", en: "Save", zh: "保存修改", ja: "保存" },
  delete:        { ko: "삭제", en: "Delete", zh: "删除", ja: "削除" },
  noBoard:       { ko: "아직 포도판이 없어요", en: "No grape boards yet", zh: "还没有葡萄板", ja: "まだぶどうボードがありません" },
  achieved:      { ko: "달성 완료! 🎉", en: "Goal achieved! 🎉", zh: "达成目标！🎉", ja: "目標達成！🎉" },
  // ── Chat / AI Transform ──
  aiTransform:     { ko: "AI 말투 변환", en: "AI Tone Transform", zh: "AI语气转换", ja: "AIトーン変換" },
  aiTransformBtn:  { ko: "AI 말투 변환하기", en: "Transform with AI", zh: "用AI转换语气", ja: "AIでトーン変換" },
  conflictPlaceholder: { ko: "지금 하고 싶은 말을 적어보세요...", en: "Write what you want to say...", zh: "写下你想说的话...", ja: "今伝えたいことを書いてみて..." },
  transformed:     { ko: "변환된 표현", en: "Transformed", zh: "转换后的表达", ja: "変換後の表現" },
  original:        { ko: "원래 표현", en: "Original", zh: "原始表达", ja: "元の表現" },
  copyDone:        { ko: "문장이 복사되었어요! 📋", en: "Copied! 📋", zh: "已复制！📋", ja: "コピーしました！📋" },
  // ── Coupon ──
  coupon:        { ko: "쿠폰", en: "Coupon", zh: "优惠券", ja: "クーポン" },
  sentCoupon:    { ko: "보낸 쿠폰", en: "Sent", zh: "发送的", ja: "送った" },
  rcvdCoupon:    { ko: "받은 쿠폰", en: "Received", zh: "收到的", ja: "もらった" },
  newCoupon:     { ko: "새 쿠폰 만들기", en: "New Coupon", zh: "新建优惠券", ja: "新しいクーポン" },
  couponName:    { ko: "쿠폰 이름", en: "Coupon Name", zh: "优惠券名称", ja: "クーポン名" },
  couponDesc:    { ko: "설명을 입력해보세요", en: "Add a description", zh: "请输入描述", ja: "説明を入力" },
  sendNow:       { ko: "바로 보내기", en: "Send Now", zh: "立即发送", ja: "すぐ送る" },
  keepDraft:     { ko: "보관하기", en: "Save Draft", zh: "保存", ja: "保存" },
  use:           { ko: "사용하기", en: "Use", zh: "使用", ja: "使う" },
  used:          { ko: "사용완료", en: "Used", zh: "已使用", ja: "使用済み" },
  undoUse:       { ko: "사용완료 취소", en: "Undo", zh: "取消使用", ja: "使用取消" },
  expiry:        { ko: "유효기간", en: "Validity", zh: "有效期", ja: "有効期間" },
  noExpiry:      { ko: "무제한", en: "No Limit", zh: "无限制", ja: "無制限" },
  all:           { ko: "전체", en: "All", zh: "全部", ja: "すべて" },
  unused:        { ko: "미사용", en: "Unused", zh: "未使用", ja: "未使用" },
  expired:       { ko: "만료", en: "Expired", zh: "已过期", ja: "期限切れ" },
  // ── Shop ──
  shop:           { ko: "상점", en: "Shop", zh: "商店", ja: "ショップ" },
  gifticon:       { ko: "기프티콘", en: "Gift Cards", zh: "礼品卡", ja: "ギフトカード" },
  grapeShop:      { ko: "포도알 상점", en: "Grape Shop", zh: "葡萄粒商店", ja: "ぶどうショップ" },
  credits:        { ko: "크레딧", en: "Credits", zh: "积分", ja: "クレジット" },
  myGrapes:       { ko: "보유 포도알", en: "My Grapes", zh: "我的葡萄粒", ja: "所持ぶどう" },
  giftTo:         { ko: "선물하러 가기", en: "Send Gift", zh: "去送礼", ja: "プレゼントする" },
  // ── Report ──
  report:            { ko: "관계 보고서", en: "Relationship Report", zh: "关系报告", ja: "関係レポート" },
  voiceAnalysis:     { ko: "대화 분석", en: "Voice Analysis", zh: "对话分析", ja: "会話分析" },
  relationScore:     { ko: "우리의 관계 점수", en: "Our Relationship Score", zh: "我们的关系分数", ja: "ふたりの関係スコア" },
  todayAnalysis:     { ko: "오늘의 관계 분석", en: "Today's Analysis", zh: "今日的关系分析", ja: "今日の関係分析" },
  watchAdBtn:        { ko: "🎬 광고 보고 오늘 분석 보기", en: "🎬 Watch ad to see analysis", zh: "🎬 看广告查看分析", ja: "🎬 広告を見て分析を見る" },
  adSupport:         { ko: "Support", en: "Support", zh: "支持", ja: "サポート" },
  adSupportDesc:     { ko: "광고 시청은 서비스 운영에 도움이 되며, 더 정확한 AI 분석 개선에 사용됩니다.", en: "Watching ads helps support the service and improve AI analysis.", zh: "观看广告有助于服务运营和改进AI分析。", ja: "広告視聴はサービス運営とAI分析の改善に役立ちます。" },
  watchAdTitle:      { ko: "광고 시청하고 분석 보기", en: "Watch Ad for Analysis", zh: "看广告查看分析", ja: "広告を見て分析を見る" },
  watchAdDesc:       { ko: "짧은 광고 2편을 시청하면 오늘의 관계 분석을 확인할 수 있어요", en: "Watch 2 short ads to unlock today's analysis", zh: "观看2个短广告即可查看今日分析", ja: "短い広告2本を見ると今日の分析が見れます" },
  adStart1:          { ko: "광고 시청 시작 (1/2)", en: "Start Ad (1/2)", zh: "开始播放广告 (1/2)", ja: "広告再生開始 (1/2)" },
  adComplete1:       { ko: "✅ 1편 완료! 다음 광고로 →", en: "✅ 1 done! Next ad →", zh: "✅ 第1个完成！下一个 →", ja: "✅ 1本完了！次の広告へ →" },
  adStart2:          { ko: "마지막 광고 시청 (2/2)", en: "Last Ad (2/2)", zh: "最后一个广告 (2/2)", ja: "最後の広告 (2/2)" },
  adComplete2:       { ko: "🎉 완료! 분석 보기", en: "🎉 Done! View Analysis", zh: "🎉 完成！查看分析", ja: "🎉 完了！分析を見る" },
  adWait:            { ko: "광고가 끝날 때까지 기다려주세요", en: "Please wait until the ad ends", zh: "请等广告播放完毕", ja: "広告が終わるまでお待ちください" },
  adArea:            { ko: "광고 영역", en: "Ad Space", zh: "广告区域", ja: "広告エリア" },
  weeklyTip:         { ko: "이번 주 팁", en: "Weekly Tip", zh: "本周提示", ja: "今週のヒント" },
  reportDone:        { ko: "오늘 분석 열람 완료", en: "Today's report viewed", zh: "今日分析已查看", ja: "今日の分析閲覧済み" },
  // ── Settings ──
  settings:       { ko: "⚙️ 설정", en: "⚙️ Settings", zh: "⚙️ 设置", ja: "⚙️ 設定" },
  myProfile:      { ko: "내 프로필", en: "My Profile", zh: "我的资料", ja: "プロフィール" },
  myNameLabel:    { ko: "내 이름", en: "My Name", zh: "我的名字", ja: "名前" },
  notifications:  { ko: "알림 설정", en: "Notifications", zh: "通知设置", ja: "通知設定" },
  on:             { ko: "켜짐", en: "On", zh: "开启", ja: "オン" },
  off:            { ko: "꺼짐", en: "Off", zh: "关闭", ja: "オフ" },
  language:       { ko: "언어", en: "Language", zh: "语言", ja: "言語" },
  chatPrefs:      { ko: "내 대화 취향", en: "Chat Preferences", zh: "聊天偏好", ja: "会話の好み" },
  likedWords:     { ko: "내가 좋아하는 말", en: "Words I like", zh: "我喜欢的话", ja: "好きな言葉" },
  dislikedWords:  { ko: "내가 싫어하는 말", en: "Words I dislike", zh: "我不喜欢的话", ja: "苦手な言葉" },
  saveTaste:      { ko: "대화 취향 저장", en: "Save Preferences", zh: "保存偏好", ja: "好みを保存" },
  tasteSaved:     { ko: "대화 취향이 저장되었어요! 💜", en: "Preferences saved! 💜", zh: "偏好已保存！💜", ja: "好みを保存しました！💜" },
  retakeSurvey:   { ko: "성향 분석 다시하기", en: "Retake Survey", zh: "重新做性格测试", ja: "性格診断をやり直す" },
  doSurveyFirst:  { ko: "성향 분석을 먼저 완료해주세요!", en: "Complete the survey first!", zh: "请先完成性格测试！", ja: "まず性格診断を完了してください！" },
  close:          { ko: "닫기", en: "Close", zh: "关闭", ja: "閉じる" },
  // ── Survey ──
  surveyTitle:    { ko: "커플 성향 분석", en: "Couple Style Analysis", zh: "情侣性格分析", ja: "カップル性格分析" },
  surveyDesc:     { ko: "우리 관계를 더 잘 이해하기 위한 짧은 질문이에요", en: "Short questions to better understand our relationship", zh: "为了更好地了解我们的关系的简短问题", ja: "ふたりの関係をもっとよく知るための質問です" },
  surveyStart:    { ko: "시작하기", en: "Start", zh: "开始", ja: "始める" },
  prev:           { ko: "← 이전", en: "← Back", zh: "← 上一步", ja: "← 戻る" },
  next:           { ko: "다음 →", en: "Next →", zh: "下一步 →", ja: "次へ →" },
  submitSurvey:   { ko: "제출하기 →", en: "Submit →", zh: "提交 →", ja: "提出 →" },
  // ── Misc ──
  todayOnly:       { ko: "⚡ 오늘만", en: "⚡ Today only", zh: "⚡ 仅限今天", ja: "⚡ 今日だけ" },
  daily:           { ko: "매일", en: "Daily", zh: "每天", ja: "毎日" },
  confirm:         { ko: "확인", en: "OK", zh: "确认", ja: "確認" },
  save:            { ko: "저장", en: "Save", zh: "保存", ja: "保存" },
  analyzing:       { ko: "분석 중...", en: "Analyzing...", zh: "分析中...", ja: "分析中..." },
  uploadAudio:     { ko: "대화 녹음 파일 업로드", en: "Upload conversation audio", zh: "上传对话录音", ja: "会話の録音をアップロード" },
  positive:        { ko: "긍정", en: "Positive", zh: "积极", ja: "ポジティブ" },
  negative:        { ko: "부정", en: "Negative", zh: "消极", ja: "ネガティブ" },
  neutral:         { ko: "중립", en: "Neutral", zh: "中立", ja: "ニュートラル" },
  chatSuccess:     { ko: "대화 성공!", en: "Chat success!", zh: "聊天成功！", ja: "会話成功！" },
  // Days
  mon: { ko: "월", en: "Mon", zh: "一", ja: "月" },
  tue: { ko: "화", en: "Tue", zh: "二", ja: "火" },
  wed: { ko: "수", en: "Wed", zh: "三", ja: "水" },
  thu: { ko: "목", en: "Thu", zh: "四", ja: "木" },
  fri: { ko: "금", en: "Fri", zh: "五", ja: "金" },
  sat: { ko: "토", en: "Sat", zh: "六", ja: "土" },
  sun: { ko: "일", en: "Sun", zh: "日", ja: "日" },
};

// ─── Mock Data ────────────────────────────────────────────
const MOCK_USER = {
  id: "u1",
  name: "",
  partnerName: "",
  partnerConnected: false,
  partnerId: "",
  coupleId: "",
  inviteCode: "MALL-7K2X",
  isSubscribed: false,
  grapePoints: 0,
  totalGrapes: 0,
  mallangCredits: 0,
  surveyCompleted: false,
  survey: null,
  partnerSurvey: null,
};

const MOCK_CHORES = [];

const MOCK_GIFTS = [
  { id: 1, name: "스타벅스 아메리카노", credits: 4500, emoji: "☕", category: "기프티콘" },
  { id: 2, name: "배스킨라빈스 싱글킹", credits: 4700, emoji: "🍦", category: "기프티콘" },
  { id: 3, name: "설거지 1회권", grapes: 10, emoji: "🍽️", category: "커플쿠폰" },
  { id: 4, name: "안마 30분권", grapes: 15, emoji: "💆", category: "커플쿠폰" },
  { id: 5, name: "영화 선택권", grapes: 12, emoji: "🎬", category: "커플쿠폰" },
  { id: 6, name: "치킨 기프티콘", credits: 20000, emoji: "🍗", category: "기프티콘" },
  { id: 7, name: "편의점 5천원권", credits: 5000, emoji: "🏪", category: "기프티콘" },
  { id: 8, name: "늦잠 허가권", grapes: 8, emoji: "😴", category: "커플쿠폰" },
];


// ─── Styles ───────────────────────────────────────────────
const colors = {
  bg: "#FAFAF8",
  card: "#FFFFFF",
  primary: "#7C5CFC",
  primaryLight: "#EDE9FE",
  primaryDark: "#5B3FD4",
  grape: "#8B5CF6",
  grapeLight: "#F3EEFF",
  grapeDark: "#6D28D9",
  warm: "#FF8C69",
  warmLight: "#FFF0EB",
  mint: "#10B981",
  mintLight: "#ECFDF5",
  rose: "#F43F5E",
  roseLight: "#FFF1F2",
  gold: "#F59E0B",
  goldLight: "#FFFBEB",
  text: "#1A1A2E",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  border: "#F0F0ED",
  borderActive: "#E5E5E0",
  shadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
  shadowLg: "0 8px 24px rgba(0,0,0,0.08)",
};

// ─── Coupon Icon Component ────────────────────────────────
function CouponIcon({ size = 20, color = "#7C3AED" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 9V6.5C2 5.67 2.67 5 3.5 5h17c.83 0 1.5.67 1.5 1.5V9c-1.1 0-2 .9-2 2s.9 2 2 2v2.5c0 .83-.67 1.5-1.5 1.5h-17C2.67 17 2 16.33 2 15.5V13c1.1 0 2-.9 2-2s-.9-2-2-2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 5v1.5M9 10v1M9 14.5V17" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="0.5 3"/>
    </svg>
  );
}

// ─── Toast Component ──────────────────────────────────────
function Toast({ message, visible, type = "success" }) {
  if (!visible) return null;
  const bgColor = type === "success" ? colors.mint : type === "warning" ? colors.gold : colors.primary;
  return (
    <div style={{
      position: "fixed", top: 48, left: "50%", transform: "translateX(-50%)",
      background: bgColor, color: "#fff", padding: "10px 20px", borderRadius: 12,
      fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: colors.shadowLg,
      animation: "slideDown 0.3s ease", maxWidth: "85vw", textAlign: "center",
    }}>
      {message}
    </div>
  );
}

// ─── Grape Cluster Visualization ──────────────────────────
function GrapeCluster({ filled, total, size = "large" }) {
  const s = size === "large" ? 22 : 14;
  const gap = size === "large" ? 3 : 2;
  const rows = [];
  let idx = 0;
  const pattern = [3, 4, 5, 5, 4, 4, 3, 3, 2, 2, 1];
  const maxItems = total || pattern.reduce((a, b) => a + b, 0);

  for (let r = 0; r < pattern.length && idx < maxItems; r++) {
    const count = Math.min(pattern[r], maxItems - idx);
    const row = [];
    for (let c = 0; c < count && idx < maxItems; c++) {
      const isFilled = idx < filled;
      row.push(
        <div key={idx} style={{
          width: s, height: s, borderRadius: "50%",
          background: isFilled
            ? `linear-gradient(135deg, #A78BFA, #7C3AED)`
            : "#EDE9FE",
          border: isFilled ? "none" : "1.5px dashed #C4B5FD",
          transition: "all 0.3s ease",
          boxShadow: isFilled ? "0 2px 4px rgba(124,58,237,0.3)" : "none",
        }} />
      );
      idx++;
    }
    rows.push(
      <div key={r} style={{ display: "flex", gap, justifyContent: "center" }}>
        {row}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap, alignItems: "center" }}>
      <div style={{ width: 4, height: 16, background: "#8B6914", borderRadius: 2, marginBottom: -2 }} />
      <Leaf size={16} color="#22C55E" style={{ marginBottom: -6, marginTop: -8 }} />
      {rows}
    </div>
  );
}


// ─── Survey / Onboarding Screen ───────────────────────────
function OnboardingScreen({ onComplete, onClose, savedAnswers = {} }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(savedAnswers);
  const [inviteCode, setInviteCode] = useState("");
  const [textInput, setTextInput] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const questions = [
    {
      title: "연락의 적정 온도",
      subtitle: "바쁜 일과 중 짝꿍의 카톡, 나에게는 어떤 의미인가요?",
      key: "contactTemp",
      emoji: "📱",
      options: [
        { value: "support", label: "든든한 응원이자 사랑이다", emoji: "💪" },
        { value: "burden", label: "가끔은 답장 부담이 느껴진다", emoji: "😅" },
        { value: "practical", label: "용건이 있을 때만 하는 게 편하다", emoji: "📋" },
      ],
    },
    {
      title: "칭찬을 받는 기분",
      subtitle: "짝꿍이 나를 칭찬할 때, 언제 가장 진심이 느껴지나요?",
      key: "praiseStyle",
      emoji: "🥰",
      options: [
        { value: "private", label: "둘만 있을 때 조용히 말해줄 때", emoji: "🤫" },
        { value: "public", label: "지인들 앞에서 내 자랑을 해줄 때", emoji: "🗣️" },
        { value: "letter", label: "예상치 못한 깜짝 편지로 전해줄 때", emoji: "💌" },
      ],
    },
    {
      title: "사랑을 느끼는 언어",
      subtitle: "짝꿍이 어떻게 할 때 '아, 나 사랑받고 있구나'라고 확신하나요?",
      key: "loveLanguage",
      emoji: "💜",
      options: [
        { value: "words", label: "따뜻한 말 한마디", emoji: "💬" },
        { value: "service", label: "말없이 도와주는 가사", emoji: "🧹" },
        { value: "touch", label: "다정한 스킨십", emoji: "🤗" },
        { value: "gifts", label: "작지만 정성어린 선물", emoji: "🎁" },
      ],
    },
    {
      title: "가사와 노력의 인정",
      subtitle: "집안일을 마친 후, 내가 가장 듣고 싶은 반응은?",
      key: "choreRecognition",
      emoji: "🏠",
      options: [
        { value: "immediate", label: '즉시 알아보고 "고생했어"라고 하기', emoji: "👏" },
        { value: "remember", label: "나중에라도 그 수고를 기억해 주기", emoji: "🧠" },
        { value: "action", label: "말보다는 다음번에 짝꿍이 대신 해주기", emoji: "🤝" },
      ],
    },
    {
      title: "서운함의 신호",
      subtitle: "서운한 감정이 들 때, 나는 주로 어떻게 행동하나요?",
      key: "hurtSignal",
      emoji: "😢",
      options: [
        { value: "direct", label: "즉시 조목조목 말한다", emoji: "🗣️" },
        { value: "cold", label: "말투가 차가워지며 알아주길 기다린다", emoji: "🧊" },
        { value: "withdraw", label: "생각을 정리할 시간이 필요해 입을 닫는다", emoji: "🤐" },
      ],
    },
    {
      title: "갈등 시 필요한 산소",
      subtitle: "다툼이 시작되려 할 때, 나에게 가장 필요한 것은?",
      key: "cooldown",
      emoji: "🌬️",
      options: [
        { value: "now", label: "그 자리에서 끝까지 대화하기", emoji: "💬" },
        { value: "short", label: "잠시(30분 내외) 감정 가라앉히기", emoji: "⏳" },
        { value: "long", label: "하루 정도 충분히 생각할 시간 갖기", emoji: "🌙" },
      ],
    },
    {
      title: "대화의 안전장치",
      subtitle: '싸울 때 이 말만은 정말 듣기 싫어요 (직접 입력해주세요)',
      key: "forbiddenWords",
      emoji: "🚫",
      type: "text",
      placeholder: "예: 그게 왜 니 잘못이야?, 그래서 어쩌라고?, 네가 항상 그렇지 뭐",
    },
    {
      title: "대화의 지향점",
      subtitle: "내가 힘든 고민을 털어놓을 때, 짝꿍이 어떻게 해주길 바라나요?",
      key: "conversationGoal",
      emoji: "🧭",
      options: [
        { value: "empathy", label: "내 편이 되어주는 감정적 공감", emoji: "🫂" },
        { value: "advice", label: "상황을 해결할 수 있는 객관적 조언", emoji: "🎯" },
        { value: "presence", label: "말없이 곁에 있어 주는 것", emoji: "🤲" },
      ],
    },
    {
      title: "사과의 온전한 전달",
      subtitle: "갈등 후 짝꿍의 사과, 어떤 방식이 내 마음을 가장 잘 녹이나요?",
      key: "apologyStyle",
      emoji: "💐",
      options: [
        { value: "verbal", label: "정중한 말과 사과 톡", emoji: "💬" },
        { value: "touch", label: "진심 어린 포옹과 스킨십", emoji: "🤗" },
        { value: "gift", label: "맛있는 음식이나 가벼운 선물", emoji: "🎁" },
        { value: "promise", label: "재발 방지를 위한 구체적인 약속", emoji: "📝" },
      ],
    },
    {
      title: "비언어적 민감도",
      subtitle: "대화할 때 말의 내용보다 짝꿍의 표정이나 말투에 더 예민한 편인가요?",
      key: "nonverbalSensitivity",
      emoji: "👀",
      options: [
        { value: "high", label: "매우 그렇다 (말투가 중요)", emoji: "🎭" },
        { value: "mid", label: "중간이다", emoji: "⚖️" },
        { value: "low", label: "내용만 명확하면 상관없다", emoji: "📄" },
      ],
    },
  ];

  const totalSteps = questions.length + 1; // +1 for invite code step

  if (step < questions.length) {
    const q = questions[step];
    const isTextQ = q.type === "text";
    return (
      <div style={{
        minHeight: "100vh", background: "#FAFAF8",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
        {/* 종료 확인 모달 */}
        {showExitConfirm && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              background: "#fff", borderRadius: 20, padding: "28px 24px",
              width: "85%", maxWidth: 320, textAlign: "center",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤔</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
                분석을 종료하시겠습니까?
              </h3>
              <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
                지금까지 입력한 내용은 저장되어<br/>
                다음에 이어서 진행할 수 있어요.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowExitConfirm(false)} style={{
                  flex: 1, padding: "12px", borderRadius: 12,
                  background: "#F3F4F6", border: "none",
                  fontSize: 14, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
                }}>
                  계속하기
                </button>
                <button onClick={() => {
                  setShowExitConfirm(false);
                  onClose && onClose(answers);
                }} style={{
                  flex: 1, padding: "12px", borderRadius: 12,
                  background: colors.primary, border: "none",
                  fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer",
                }}>
                  종료하기
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} style={{ background: "none", border: "none", padding: 8, cursor: "pointer" }}>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </button>
          ) : <div style={{ width: 36 }} />}
          <span style={{ fontSize: 13, color: colors.textTertiary }}>{step + 1} / {totalSteps}</span>
          <button onClick={() => setShowExitConfirm(true)} style={{
            background: "none", border: "none", padding: 8, cursor: "pointer",
          }}>
            <X size={20} color={colors.textSecondary} />
          </button>
        </div>

        <div style={{ flex: 1, padding: "20px 24px" }}>
          <div style={{
            width: "100%", height: 4, background: "#E5E7EB", borderRadius: 2, marginBottom: 28,
          }}>
            <div style={{
              width: `${((step + 1) / totalSteps) * 100}%`, height: 4,
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.grape})`,
              borderRadius: 2, transition: "width 0.4s ease",
            }} />
          </div>

          <div style={{ fontSize: 36, marginBottom: 12 }}>{q.emoji}</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginBottom: 6, letterSpacing: "-0.3px" }}>
            {q.title}
          </h2>
          <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 1.5 }}>{q.subtitle}</p>

          {isTextQ ? (
            /* Text input question (Q7 - forbidden words) */
            <div>
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder={q.placeholder}
                style={{
                  width: "100%", minHeight: 120, padding: "14px 16px", borderRadius: 14,
                  border: `1.5px solid ${colors.border}`, fontSize: 14, resize: "none",
                  outline: "none", lineHeight: 1.7, boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
              <div style={{
                background: colors.roseLight, borderRadius: 10, padding: "10px 14px",
                fontSize: 12, color: colors.rose, marginTop: 12, lineHeight: 1.5,
              }}>
                🚫 여기에 적은 표현은 AI가 절대 추천하지 않아요. 짝꿍에게도 공유돼요.
              </div>
              <button onClick={() => {
                if (textInput.trim()) {
                  setAnswers({ ...answers, [q.key]: textInput.trim() });
                  setTextInput("");
                  setStep(step + 1);
                }
              }} disabled={!textInput.trim()} style={{
                width: "100%", padding: "14px", borderRadius: 12, marginTop: 16,
                background: textInput.trim()
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                  : "#E5E7EB",
                color: textInput.trim() ? "#fff" : "#9CA3AF",
                border: "none", fontSize: 15, fontWeight: 700,
                cursor: textInput.trim() ? "pointer" : "default",
              }}>
                다음으로
              </button>
            </div>
          ) : (
            /* Multiple choice questions */
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.options.map((opt) => {
                const selected = answers[q.key] === opt.value;
                return (
                  <button key={opt.value} onClick={() => {
                    setAnswers({ ...answers, [q.key]: opt.value });
                    setTimeout(() => setStep(step + 1), 300);
                  }} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 18px", borderRadius: 14,
                    border: selected ? `2px solid ${colors.primary}` : `1.5px solid ${colors.border}`,
                    background: selected ? colors.primaryLight : "#fff",
                    cursor: "pointer", textAlign: "left", transition: "all 0.2s ease",
                  }}>
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{opt.emoji}</span>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: colors.text, lineHeight: 1.4 }}>
                      {opt.label}
                    </div>
                    {selected && <Check size={18} color={colors.primary} style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    );
  }

  // Invite code step
  return (
    <div style={{
      minHeight: "100vh", background: "#FAFAF8",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
      {/* 종료 확인 모달 */}
      {showExitConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "28px 24px",
            width: "85%", maxWidth: 320, textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤔</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
              분석을 종료하시겠습니까?
            </h3>
            <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
              지금까지 입력한 내용은 저장되어<br/>
              다음에 이어서 진행할 수 있어요.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowExitConfirm(false)} style={{
                flex: 1, padding: "12px", borderRadius: 12,
                background: "#F3F4F6", border: "none",
                fontSize: 14, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
              }}>
                계속하기
              </button>
              <button onClick={() => {
                setShowExitConfirm(false);
                onClose && onClose(answers);
              }} style={{
                flex: 1, padding: "12px", borderRadius: 12,
                background: colors.primary, border: "none",
                fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer",
              }}>
                종료하기
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => setStep(step - 1)} style={{ background: "none", border: "none", padding: 8, cursor: "pointer" }}>
          <ChevronLeft size={20} color={colors.textSecondary} />
        </button>
        <span style={{ fontSize: 13, color: colors.textTertiary }}>{totalSteps} / {totalSteps}</span>
        <button onClick={() => setShowExitConfirm(true)} style={{
          background: "none", border: "none", padding: 8, cursor: "pointer",
        }}>
          <X size={20} color={colors.textSecondary} />
        </button>
      </div>

      <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{
          width: "100%", height: 4, background: "#E5E7EB", borderRadius: 2, marginBottom: 32,
        }}>
          <div style={{
            width: "100%", height: 4,
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.grape})`,
            borderRadius: 2,
          }} />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
          짝꿍과 연결하기 💑
        </h2>
        <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 32 }}>
          초대 코드를 공유하거나, 짝꿍의 코드를 입력해주세요
        </p>

        <div style={{
          background: colors.primaryLight, borderRadius: 16, padding: "24px 20px",
          textAlign: "center", marginBottom: 20,
        }}>
          <p style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>나의 초대 코드</p>
          <div style={{ fontSize: 24, fontWeight: 800, color: colors.primary, letterSpacing: 3, marginBottom: 12 }}>
            MALL-7K2X
          </div>
          <button onClick={() => navigator.clipboard?.writeText?.("MALL-7K2X")} style={{
            background: colors.primary, color: "#fff", border: "none",
            padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <Copy size={14} /> 코드 복사하기
          </button>
        </div>

        <div style={{ textAlign: "center", color: colors.textTertiary, fontSize: 13, marginBottom: 20 }}>또는</div>

        <input
          type="text"
          placeholder="짝꿍의 초대 코드 입력"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          style={{
            width: "100%", padding: "14px 16px", borderRadius: 12,
            border: `1.5px solid ${colors.border}`, fontSize: 16, textAlign: "center",
            letterSpacing: 2, fontWeight: 600, outline: "none", boxSizing: "border-box",
          }}
        />

        <div style={{ flex: 1 }} />

        <button onClick={() => onComplete(answers)} style={{
          width: "100%", padding: "16px", borderRadius: 14,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
          color: "#fff", border: "none", fontSize: 16, fontWeight: 700,
          cursor: "pointer", marginBottom: 20,
        }}>
          함께 시작하기 🍇
        </button>

        <button onClick={() => onComplete(answers)} style={{
          width: "100%", padding: "12px", background: "none",
          border: "none", color: colors.textTertiary, fontSize: 13, cursor: "pointer",
        }}>
          나중에 연결할게요
        </button>
      </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────
export default function MallangApp() {
  // Firebase Auth 상태
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState(null);

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

  const [screen, setScreen] = useState("splash");
  const [lang, setLang] = useState("ko");
  const t = (key) => (i18n[key] && i18n[key][lang]) || (i18n[key] && i18n[key]["ko"]) || key;

  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [user, setUser] = useState(() => loadFromStorage("user", MOCK_USER));

  // 오늘의 기분 관련 state
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [moodHistory, setMoodHistory] = useState(() => loadFromStorage("moodHistory", []));
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
  const [reportTodayUnlocked, setReportTodayUnlocked] = useState(false); // unlocked for this session
  const [voiceUnlocked, setVoiceUnlocked] = useState(false); // 대화 분석 잠금 해제
  const [judgeUnlocked, setJudgeUnlocked] = useState(false); // 갈등 심판 잠금 해제
  const [judgeText, setJudgeText] = useState(""); // 갈등 심판 입력 텍스트
  const [judgeResult, setJudgeResult] = useState(null); // 갈등 심판 결과
  const [judgeAnalyzing, setJudgeAnalyzing] = useState(false); // 갈등 심판 분석 중
  const [selectedReportMonth, setSelectedReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }); // 심화 보고서 월 선택 (YYYY-MM 형식)
  const [selectedGift, setSelectedGift] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
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
  const [reportSubTab, setReportSubTab] = useState("report"); // "report" | "voice"
  const [voiceFile, setVoiceFile] = useState(null);
  const [voiceAnalyzing, setVoiceAnalyzing] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null); // "전체" | "사용" | "미사용"
  const [editCouponId, setEditCouponId] = useState(null);
  const [couponViewTab, setCouponViewTab] = useState("sent"); // "sent" | "received"

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ ...toast, visible: false }), 2200);
  };

  const partnerDisplayName = user.partnerConnected && user.partnerName ? user.partnerName : "짝꿍";
  const reportUnlocked = reportTodayUnlocked; // 포도알 10개 결제 필요

  // Firebase Auth 리스너
  useEffect(() => {
    let unsubscribe = () => {};

    // 3초 타임아웃 - Firebase 연결 실패해도 앱 진행
    const timeout = setTimeout(() => {
      setAuthLoading(false);
    }, 3000);

    try {
      unsubscribe = onAuthChange(async (firebaseUser) => {
        clearTimeout(timeout);
        if (firebaseUser) {
          setAuthUser(firebaseUser);
          // Firebase에서 사용자 데이터 로드
          try {
            const { data } = await getUserData(firebaseUser.uid);
            if (data) {
              // Firebase 데이터로 상태 업데이트
              if (data.user) setUser(data.user);
              if (data.chores) setChores(data.chores);
              if (data.praiseLog) setPraiseLog(data.praiseLog);
              if (data.grapeBoards) setGrapeBoards(data.grapeBoards);
              if (data.myCoupons) setMyCoupons(data.myCoupons);
              if (data.shopCoupons) setShopCoupons(data.shopCoupons);
              if (data.moodHistory) setMoodHistory(data.moodHistory);
              if (data.conversationHistory) setConversationHistory(data.conversationHistory);
              if (data.savedSurveyAnswers) setSavedSurveyAnswers(data.savedSurveyAnswers);
            }
          } catch (e) {
            console.error("Failed to load user data:", e);
          }
        } else {
          setAuthUser(null);
        }
        setAuthLoading(false);
      });
    } catch (e) {
      console.error("Firebase auth error:", e);
      setAuthLoading(false);
    }

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  // Firebase에 데이터 저장 함수
  const syncToFirebase = useCallback(async () => {
    if (!authUser) return;
    await saveUserData(authUser.uid, {
      user,
      chores,
      praiseLog,
      grapeBoards,
      myCoupons,
      shopCoupons,
      moodHistory,
      conversationHistory,
      savedSurveyAnswers,
    });
  }, [authUser, user, chores, praiseLog, grapeBoards, myCoupons, shopCoupons, moodHistory, conversationHistory, savedSurveyAnswers]);

  // 데이터 변경 시 Firebase에 자동 저장 (디바운스)
  useEffect(() => {
    if (!authUser) return;
    const timer = setTimeout(() => {
      syncToFirebase();
    }, 2000); // 2초 후 저장 (너무 자주 저장하지 않도록)
    return () => clearTimeout(timer);
  }, [authUser, user, chores, praiseLog, grapeBoards, myCoupons, shopCoupons, moodHistory, conversationHistory, savedSurveyAnswers, syncToFirebase]);

  // 구글 로그인 핸들러
  const handleGoogleLogin = async () => {
    setLoginError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setLoginError(error);
    }
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await logOut();
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
    setScreen("splash");
  };

  // Splash screen auto-transition
  useEffect(() => {
    if (authLoading) return; // 인증 로딩 중이면 대기

    if (screen === "splash") {
      const timer = setTimeout(() => {
        // 이미 이름이 있으면 홈으로, 없으면 환영화면으로
        if (user.name) {
          setScreen("main");
          // 오늘 기분을 아직 선택하지 않았으면 팝업 표시
          const today = new Date().toISOString().split('T')[0];
          const todayMood = moodHistory.find(m => m.date === today);
          if (!todayMood) {
            setShowMoodPopup(true);
          }
        } else {
          setScreen("welcome");
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [screen, user.name, moodHistory, authLoading]);

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

  // 안드로이드 뒤로가기 버튼 처리
  useEffect(() => {
    // 페이지 로드 시 history state 추가
    window.history.pushState({ screen: "main" }, "");

    const handlePopState = (e) => {
      e.preventDefault();

      // 모달이 열려있으면 모달 닫기
      if (showSettings) {
        setShowSettings(false);
        setSettingsTab("main");
        window.history.pushState({ screen: "main" }, "");
        return;
      }
      if (showMoodPopup) {
        setShowMoodPopup(false);
        window.history.pushState({ screen: "main" }, "");
        return;
      }
      if (showNewBoard) {
        setShowNewBoard(false);
        window.history.pushState({ screen: "main" }, "");
        return;
      }
      if (showCouponCreate) {
        setShowCouponCreate(false);
        window.history.pushState({ screen: "main" }, "");
        return;
      }
      if (showAddTodo) {
        setShowAddTodo(false);
        window.history.pushState({ screen: "main" }, "");
        return;
      }

      // 탭별 이전 화면 처리
      if (screen === "main") {
        // 메인 화면에서는 종료 확인
        setShowExitConfirm(true);
        window.history.pushState({ screen: "main" }, "");
        return;
      }

      // 다른 화면에서는 메인으로 이동
      if (screen !== "splash" && screen !== "welcome" && screen !== "welcome_done" && screen !== "onboarding") {
        setScreen("main");
        window.history.pushState({ screen: "main" }, "");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [screen, showSettings, showMoodPopup, showNewBoard, showCouponCreate, showAddTodo]);

  // Ad watching simulation timer
  useEffect(() => {
    if (adWatching && adProgress < 100) {
      const timer = setInterval(() => {
        setAdProgress(p => Math.min(100, p + (100 / 30)));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [adWatching, adProgress]);

  const handleConflictSubmit = async () => {
    if (!conflictText.trim()) return;

    try {
      // GPT API 호출
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `당신은 커플 대화 전문가입니다. 사용자가 하고 싶은 말을 짝꿍이 좋아하는 스타일로 부드럽게 변환해주세요.
변환 시 다음 원칙을 따르세요:
1. 감정을 먼저 인정하고 공감하는 표현 사용
2. "나는 ~해서 ~했어" 같은 I-message 형태로
3. 상대방을 비난하지 않고 해결책 제안
4. 따뜻하고 다정한 어조 유지

반드시 다음 JSON 형식으로만 응답하세요:
{"transformed": "변환된 문장", "tip": "짧은 대화 팁 (20자 이내)", "style": "스타일 이름 (예: 차분한 공감형)"}`
            },
            { role: 'user', content: conflictText }
          ],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);

        const suggestion = {
          id: Date.now(),
          original: conflictText,
          transformed: result.transformed,
          tip: result.tip,
          partnerStyle: result.style || "차분한 공감형",
          timestamp: new Date().toISOString(),
          feedback: null, // 나중에 피드백 저장
        };

        setAiSuggestion(suggestion);
        // 기록에 저장
        setConversationHistory(prev => [suggestion, ...prev]);
      } else {
        throw new Error('API 호출 실패');
      }
    } catch (error) {
      console.error('GPT API error:', error);
      // Fallback 데모 데이터
      const suggestion = {
        id: Date.now(),
        original: conflictText,
        transformed: getAiTransformedMessage(conflictText),
        tip: "감정을 먼저 인정해주면 대화가 잘 풀려요",
        partnerStyle: "차분한 공감형",
        timestamp: new Date().toISOString(),
        feedback: null,
      };
      setAiSuggestion(suggestion);
      setConversationHistory(prev => [suggestion, ...prev]);
    }
  };

  const getAiTransformedMessage = (text) => {
    const suggestions = {
      default: `"나도 좀 힘들었는데, 네 마음도 이해해. 우리 같이 방법을 찾아볼까?"`,
    };
    if (text.includes("설거지") || text.includes("집안일")) {
      return `"요즘 집안일 때문에 내가 좀 지쳤나 봐. 혹시 너도 힘든 건 아닌지 걱정돼서 말하는 건데, 우리 분담을 다시 한번 이야기해볼까?"`;
    }
    if (text.includes("늦") || text.includes("약속")) {
      return `"기다리면서 좀 서운했어. 근데 네가 바빴을 수도 있다는 것도 알아. 다음엔 미리 알려줄 수 있을까?"`;
    }
    if (text.includes("돈") || text.includes("소비")) {
      return `"우리 살림 때문에 내가 조금 걱정이 되긴 해. 한번 같이 이번 달 지출을 편하게 얘기해볼까? 네 생각도 듣고 싶어."`;
    }
    return suggestions.default;
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

  const sendPraise = () => {
    if (!praiseText.trim()) return;
    const newPraise = {
      id: Date.now(),
      from: user.name || "나",
      message: praiseText.trim(),
      grapes: 3,
      date: new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" }),
    };
    setPraiseLog(prev => [newPraise, ...prev]);
    showToast(`${partnerDisplayName}님에게 칭찬을 보냈어요! 💜`);
    setPraiseText("");
  };

  const choreIcon = (icon) => {
    const iconMap = {
      utensils: <Utensils size={16} />,
      shirt: <Shirt size={16} />,
      home: <Home size={16} />,
      trash: <Trash2 size={16} />,
      dog: <Heart size={16} />,
    };
    return iconMap[icon] || <Home size={16} />;
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
        <div style={{ fontSize: 48, marginBottom: 16 }}>🍇</div>
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
          <div style={{
            fontSize: 72, marginBottom: 12,
            animation: "splashFadeIn 0.8s ease-out, splashFloat 3s ease-in-out 1s infinite",
          }}>🍇</div>
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
        `}</style>
        <div style={{ textAlign: "center", marginBottom: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🍇</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.primary, marginBottom: 8 }}>말랑</h1>
          <p style={{
            fontSize: 13, color: colors.textSecondary, lineHeight: 1.5,
          }}>
            {t("welcomeSub1")}<br/>{t("welcomeSub2")}
          </p>
        </div>

        {/* 구글 로그인 버튼 */}
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
            <button onClick={handleGoogleLogin} style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              background: "#fff", border: `1.5px solid ${colors.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>Google로 로그인</span>
            </button>
            <p style={{ fontSize: 11, color: colors.textTertiary, textAlign: "center", marginTop: 8 }}>
              로그인하면 기기 간 데이터 동기화가 가능해요
            </p>
          </div>
        ) : (
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
        )}

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

        <label style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "block", marginBottom: 6 }}>
          {t("partnerCode")}
        </label>
        <input
          type="text"
          placeholder={t("codePlaceholder")}
          value={welcomePartnerCode}
          onChange={e => setWelcomePartnerCode(e.target.value.toUpperCase())}
          style={{
            width: "100%", padding: "14px 16px", borderRadius: 12,
            border: `1.5px solid ${colors.border}`, fontSize: 16,
            outline: "none", boxSizing: "border-box", letterSpacing: 2,
            fontWeight: 600, textAlign: "center", marginBottom: 8,
          }}
        />

        <button onClick={() => {
          if (!welcomeName.trim()) {
            showToast("이름을 입력해주세요", "error");
            return;
          }
          if (!welcomePartnerCode.trim()) {
            setShowSkipCodeConfirm(true);
            return;
          }
          setUser(u => ({ ...u, name: welcomeName.trim(), partnerConnected: true }));
          setScreen("welcome_done");
        }} style={{
          width: "100%", padding: "16px", borderRadius: 14, marginTop: 16,
          background: welcomeName.trim()
            ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
            : "#E5E7EB",
          color: welcomeName.trim() ? "#fff" : "#9CA3AF",
          border: "none", fontSize: 16, fontWeight: 700,
          cursor: welcomeName.trim() ? "pointer" : "default",
        }}>
          시작하기
        </button>

        {/* Skip partner code confirm popup */}
        {showSkipCodeConfirm && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
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
                짝꿍 코드는 나중에<br/>입력하시겠습니까?
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowSkipCodeConfirm(false)} style={{
                  flex: 1, padding: "13px", borderRadius: 12,
                  background: "#F3F4F6", color: colors.textSecondary,
                  border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>
                  돌아가기
                </button>
                <button onClick={() => {
                  setShowSkipCodeConfirm(false);
                  setUser(u => ({ ...u, name: welcomeName.trim(), partnerConnected: false, partnerName: "" }));
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

        <Toast {...toast} />
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
    return <OnboardingScreen
      savedAnswers={savedSurveyAnswers}
      onComplete={(answers) => {
        setUser(u => ({ ...u, survey: answers, surveyCompleted: true }));
        setSavedSurveyAnswers({}); // 완료 시 임시 저장 초기화
        setScreen("main");
        showToast("설문 완료! 말랑에 오신 걸 환영해요 🍇");
      }}
      onClose={(answers) => {
        setSavedSurveyAnswers(answers); // 진행 상황 저장
        setScreen("main");
        showToast("성향 분석이 저장되었어요. 나중에 이어서 진행할 수 있어요!");
      }}
    />;
  }

  // ─── TAB CONTENT ─────────────────────────────────────────
  const renderHome = () => (
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
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowSettings(true)} style={{
            width: 38, height: 38, borderRadius: 12, background: "#fff",
            border: `1px solid ${colors.border}`, display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer",
          }}>
            <Settings size={18} color={colors.textSecondary} />
          </button>
        </div>
      </div>

      {/* Grape Boards Summary - compact horizontal scroll */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>🍇 내 포도판</h3>
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
            const myBoards = grapeBoards.filter(b => !b.owner || b.owner === "우리" || b.owner === user.name);
            return myBoards.length > 0 ? myBoards.map(board => {
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
          {grapeBoards.filter(b => !b.owner || b.owner === "우리" || b.owner === user.name).length > 0 && (
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

      {/* My Coupons - compact */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>🎫 내 쿠폰</h3>
            {myCoupons.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: colors.warm,
                background: colors.warmLight, borderRadius: 10, padding: "2px 8px",
              }}>{myCoupons.length}</span>
            )}
          </div>
          {myCoupons.length > 0 && (
            <button onClick={() => setTab("coupon")} style={{
              background: "none", border: "none", fontSize: 12, color: colors.primary,
              fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 2,
            }}>
              관리 <ChevronRight size={14} />
            </button>
          )}
        </div>
        {myCoupons.length > 0 ? (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2, WebkitOverflowScrolling: "touch" }}>
            {myCoupons.map(coupon => {
              const daysLeft = Math.max(0, Math.ceil((new Date(coupon.expiry) - new Date()) / 86400000));
              return (
                <div key={coupon.id} style={{
                  minWidth: 130, flex: "0 0 auto", display: "flex", alignItems: "center", gap: 10,
                  background: "#fff", borderRadius: 12, padding: "10px 12px",
                  border: `1px solid ${colors.border}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: "#fff",
                    border: `1.5px solid ${colors.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}><CouponIcon size={18} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {coupon.title}
                    </div>
                    <div style={{ fontSize: 10, color: daysLeft <= 7 ? colors.rose : colors.textTertiary, fontWeight: 500 }}>
                      {daysLeft <= 0 ? "만료" : `D-${daysLeft}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            background: "#fff", borderRadius: 12, padding: "14px",
            border: `1px dashed ${colors.borderActive}`, textAlign: "center",
          }}>
            <span style={{ fontSize: 13, color: colors.textTertiary }}>
              아직 쿠폰이 없어요. 포도알을 채워 보상 쿠폰을 만들어보세요!
            </span>
          </div>
        )}
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


      {/* 말랑 도구 */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 10 }}>💬 말랑 도구</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={() => {
            if (!user.surveyCompleted) {
              setShowSurveyPrompt(true);
              return;
            }
            setShowConflictInput(true);
          }} style={{
            background: "#fff", border: `1px solid ${colors.border}`, borderRadius: 14,
            padding: "14px 14px", cursor: "pointer", textAlign: "left",
            boxShadow: colors.shadow, transition: "all 0.2s",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: colors.warmLight, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MessageCircle size={16} color={colors.warm} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>대화 도우미</div>
              <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 1 }}>AI 말투 변환</div>
            </div>
          </button>

          <button onClick={() => { setGrapeSubTab("praise"); setTab("grape"); }} style={{
            background: "#fff", border: `1px solid ${colors.border}`, borderRadius: 14,
            padding: "14px 14px", cursor: "pointer", textAlign: "left",
            boxShadow: colors.shadow, display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: colors.grapeLight, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Heart size={16} color={colors.grape} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>칭찬하기</div>
            </div>
          </button>
        </div>
      </div>

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
        }} onClick={() => { setShowConflictInput(false); setAiSuggestion(null); setFeedbackGiven(null); setConflictText(""); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
            width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto",
            animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>💬 AI 대화 도우미</h3>
              <button onClick={() => { setShowConflictInput(false); setAiSuggestion(null); setFeedbackGiven(null); setConflictText(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} color={colors.textTertiary} />
              </button>
            </div>

            <div style={{
              background: colors.warmLight, borderRadius: 12, padding: "12px 14px",
              fontSize: 12, color: colors.warm, marginBottom: 16, lineHeight: 1.6,
            }}>
              💡 지금 하려는말 대신 짝꿍님이 좋아하는 스타일로 바꿔드릴게요.
            </div>

            {!aiSuggestion ? (
              <>
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
              </>
            ) : (
              <div>
                <div style={{
                  background: "#F9FAFB", borderRadius: 12, padding: "14px",
                  marginBottom: 12, borderLeft: `3px solid ${colors.textTertiary}`,
                }}>
                  <p style={{ fontSize: 11, color: colors.textTertiary, marginBottom: 6 }}>원래 하려던 말</p>
                  <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>{aiSuggestion.original}</p>
                </div>

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

                <div style={{
                  background: colors.mintLight, borderRadius: 10, padding: "10px 14px",
                  fontSize: 12, color: colors.mint, marginBottom: 16, lineHeight: 1.5,
                }}>
                  🌱 {aiSuggestion.tip}
                </div>

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
                  <button onClick={() => showToast("카카오톡으로 공유 준비 중!")} style={{
                    flex: 1, padding: "12px", borderRadius: 12,
                    background: "#FEE500", color: "#3C1E1E", border: "none",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    <Share2 size={14} /> 카톡 공유
                  </button>
                </div>

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
                          // 대화 기록에도 피드백 저장
                          if (aiSuggestion?.id) {
                            updateConversationFeedback(aiSuggestion.id, fb.value);
                          }
                          if (fb.value === "success") {
                            setUser(u => ({ ...u, grapePoints: u.grapePoints + 2 }));
                            showToast("대화 성공! 포도알 +2 🍇");
                          } else {
                            showToast("피드백 감사해요! 더 나은 제안을 할게요");
                          }
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
                              if (fb.value === "success") {
                                setUser(u => ({ ...u, grapePoints: u.grapePoints + 2 }));
                                showToast("대화 성공! 포도알 +2 🍇");
                              } else {
                                showToast("피드백 감사해요!");
                              }
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

      {/* Todo Section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>📋 오늘의 할 일</h3>
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

        {/* Add Todo Popup */}
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

        {/* Routine tasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {chores.filter(c => c.type === "routine").map(c => (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", borderRadius: 14, background: "#fff",
              border: `1px solid ${c.completed ? colors.mintLight : colors.border}`,
              transition: "all 0.2s",
              opacity: c.completed ? 0.6 : 1,
            }}>
              <div onClick={() => toggleChore(c.id)} style={{
                width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                background: c.completed ? colors.mint : "transparent",
                border: c.completed ? "none" : `2px solid ${colors.borderActive}`,
                transition: "all 0.2s", cursor: "pointer",
              }}>
                {c.completed && <Check size={14} color="#fff" />}
              </div>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: "#F3F4F6",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: colors.textSecondary,
              }}>
                {choreIcon(c.icon)}
              </div>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => toggleChore(c.id)}>
                <div style={{
                  fontSize: 14, fontWeight: 500, color: colors.text,
                  textDecoration: c.completed ? "line-through" : "none",
                }}>{c.task}</div>
                {c.days && (
                  <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                    {["월","화","수","목","금","토","일"].map(d => (
                      <span key={d} style={{
                        width: 18, height: 18, borderRadius: 4, fontSize: 9, fontWeight: 600,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: c.days.includes(d) ? colors.primaryLight : "transparent",
                        color: c.days.includes(d) ? colors.primary : colors.textTertiary,
                      }}>{d}</span>
                    ))}
                  </div>
                )}
                {!c.days && (
                  <span style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2, display: "block" }}>매일</span>
                )}
              </div>
              <span style={{
                fontSize: 11, color: c.assignee === "우리" ? colors.grape : (c.assignee === user.name ? colors.primary : colors.warm),
                background: c.assignee === "우리" ? colors.grapeLight : (c.assignee === user.name ? colors.primaryLight : colors.warmLight),
                padding: "3px 8px", borderRadius: 6, fontWeight: 600,
              }}>
                {c.assignee}
              </span>
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
          ))}
        </div>

        {/* One-time tasks */}
        {chores.filter(c => c.type === "once").length > 0 && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {chores.filter(c => c.type === "once").map(c => (
                <div key={c.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", borderRadius: 14, background: "#fff",
                  border: `1px solid ${c.completed ? colors.mintLight : colors.border}`,
                  transition: "all 0.2s",
                  opacity: c.completed ? 0.6 : 1,
                }}>
                  <div onClick={() => toggleChore(c.id)} style={{
                    width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                    background: c.completed ? colors.mint : "transparent",
                    border: c.completed ? "none" : `2px solid ${colors.borderActive}`,
                    cursor: "pointer",
                  }}>
                    {c.completed && <Check size={14} color="#fff" />}
                  </div>
                  <div style={{ flex: 1, cursor: "pointer" }} onClick={() => toggleChore(c.id)}>
                    <div style={{
                      fontSize: 14, fontWeight: 500, color: colors.text,
                      textDecoration: c.completed ? "line-through" : "none",
                    }}>{c.task}</div>
                  </div>
                  <span style={{
                    fontSize: 11, color: c.assignee === "우리" ? colors.grape : (c.assignee === user.name ? colors.primary : colors.warm),
                    background: c.assignee === "우리" ? colors.grapeLight : (c.assignee === user.name ? colors.primaryLight : colors.warmLight),
                    padding: "3px 8px", borderRadius: 6, fontWeight: 600,
                  }}>
                    {c.assignee}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
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
          </>
        )}

      </div>

      {/* Recent Praise */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 12 }}>💜 최근 칭찬</h3>
        {praiseLog.length > 0 ? praiseLog.slice(0, 2).map(p => (
          <div key={p.id} style={{
            background: "#fff", borderRadius: 14, padding: "14px 16px",
            border: `1px solid ${colors.border}`, marginBottom: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.primary }}>{p.from}</span>
              <span style={{ fontSize: 11, color: colors.textTertiary }}>{p.date}</span>
            </div>
            <p style={{ fontSize: 13, color: colors.text, marginTop: 6, lineHeight: 1.5 }}>{p.message}</p>
          </div>
        )) : (
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px", border: `1px dashed ${colors.borderActive}`, textAlign: "center" }}>
            <span style={{ fontSize: 13, color: colors.textTertiary }}>아직 칭찬 기록이 없어요. {partnerDisplayName}님에게 첫 칭찬을 보내보세요!</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderGrape = () => (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ padding: "16px 0 12px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>🍇 포도알 현황</h2>
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
                  <button onClick={() => {
                    if (pct >= 100) return;
                    setAnimatingBoardId(board.id);
                    setTimeout(() => setAnimatingBoardId(null), 800);
                    const newCurrent = Math.min(board.current + board.perSuccess, board.goal);
                    const willComplete = newCurrent >= board.goal;
                    setGrapeBoards(boards => boards.map(b =>
                      b.id === board.id ? { ...b, current: newCurrent } : b
                    ));
                    setUser(u => ({ ...u, grapePoints: u.grapePoints + board.perSuccess }));
                    if (willComplete) {
                      setTimeout(() => {
                        setRewardBoardTitle(board.title);
                        setShowConfetti(true);
                        setShowRewardModal(true);
                        setTimeout(() => setShowConfetti(false), 3500);
                      }, 600);
                    } else {
                      showToast(`${board.title} 성공! 포도알 +${board.perSuccess} 🍇`);
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
            목표를 세우고 포도알을 모아보세요!<br/>포도알로 쿠폰도 구매할 수 있어요
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
              <button onClick={() => {
                if (!newBoard.title.trim()) return;
                if (editBoard) {
                  setGrapeBoards(prev => prev.map(b =>
                    b.id === editBoard.id
                      ? { ...b, title: newBoard.title, goal: newBoard.goal, perSuccess: newBoard.perSuccess, owner: newBoard.owner }
                      : b
                  ));
                  showToast("포도판이 수정되었어요! ✏️");
                } else {
                  setGrapeBoards(prev => [...prev, { ...newBoard, id: Date.now(), current: 0 }]);
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
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="칭찬 한 마디를 적어주세요"
            value={praiseText}
            onChange={e => setPraiseText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendPraise()}
            style={{
              flex: 1, padding: "12px 14px", borderRadius: 12,
              border: `1.5px solid ${colors.border}`, fontSize: 13,
              outline: "none", boxSizing: "border-box",
            }}
          />
          <button onClick={sendPraise} style={{
            padding: "12px 16px", borderRadius: 12,
            background: colors.grape, color: "#fff", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center",
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
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.primary }}>{p.from}</span>
              <span style={{ fontSize: 11, color: colors.textTertiary }}>· {p.date}</span>
            </div>
            <p style={{ fontSize: 13, color: colors.text, marginTop: 4 }}>{p.message}</p>
          </div>
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
                          <button onClick={() => setConfirmSendCoupon(coupon.id)} style={{
                            padding: "5px 10px", borderRadius: 6,
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                            border: "none", fontSize: 10, fontWeight: 700, color: "#fff", cursor: "pointer",
                          }}>보내기</button>
                        )}
                        <button onClick={() => { setEditCouponId(coupon.id); setNewCoupon({ title: coupon.title, desc: coupon.desc, expiry: coupon.expiry }); setShowCouponCreate(true); }} style={{
                          padding: "5px 8px", borderRadius: 6, background: "#F3F4F6", border: "none", fontSize: 10, fontWeight: 600, color: colors.textSecondary, cursor: "pointer",
                        }}>수정</button>
                        <button onClick={() => setConfirmDeleteCoupon(coupon.id)} style={{
                          padding: "5px 8px", borderRadius: 6, background: colors.roseLight, border: "none", fontSize: 10, fontWeight: 600, color: colors.rose, cursor: "pointer",
                        }}>삭제</button>
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
                      <button onClick={() => { setMyCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, status: "sent" } : c)); showToast("사용 완료를 취소했어요"); }} style={{
                        padding: "5px 10px", borderRadius: 6, background: colors.mintLight, border: `1px solid ${colors.mint}40`, fontSize: 10, fontWeight: 700, color: colors.mint, cursor: "pointer",
                      }}>사용완료 취소</button>
                    ) : (
                      <button onClick={() => { setMyCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, status: "used" } : c)); showToast("쿠폰을 사용했어요! 🎉"); }} style={{
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
              🍇 {user.grapePoints} 포도알 보유 중
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

            {/* 상대방이 등록한 포도알 상점 쿠폰 */}
            {shopCoupons.filter(sc => sc.registeredBy !== user.name).length > 0 && (
              <>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 10 }}>🍇 {partnerDisplayName}님이 등록한 쿠폰</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {shopCoupons.filter(sc => sc.registeredBy !== user.name).map(sc => {
                    const canBuy = user.grapePoints >= sc.grapes;
                    return (
                      <div key={sc.id} onClick={() => setSelectedShopCoupon(sc)} style={{
                        background: "#fff", borderRadius: 16, padding: "16px 12px",
                        border: `1px solid ${colors.border}`, textAlign: "center",
                        cursor: "pointer", opacity: canBuy ? 1 : 0.5, boxShadow: colors.shadow,
                      }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><CouponIcon size={28} /></div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{sc.title}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: canBuy ? colors.grape : colors.textTertiary }}>🍇 {sc.grapes}</div>
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
                    const canBuy = user.grapePoints >= sc.grapes;
                    return (
                      <div key={sc.id} onClick={() => setSelectedShopCoupon(sc)} style={{
                        background: "#fff", borderRadius: 16, padding: "16px 12px",
                        border: `1px solid ${colors.border}`, textAlign: "center",
                        cursor: "pointer", opacity: canBuy ? 1 : 0.5, boxShadow: colors.shadow,
                      }}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><CouponIcon size={28} /></div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{sc.title}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: canBuy ? colors.grape : colors.textTertiary }}>🍇 {sc.grapes}</div>
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
          const canBuy = user.grapePoints >= sc.grapes;
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
                  }}>🍇 {sc.grapes}알</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: daysLeft <= 7 ? colors.rose : colors.textTertiary,
                    background: daysLeft <= 7 ? colors.roseLight : "#F3F4F6",
                    padding: "4px 10px", borderRadius: 8,
                  }}>유효기간 D-{daysLeft}</span>
                </div>
                <div style={{ marginBottom: 16 }}/>
                <button onClick={() => {
                  if (!canBuy) { showToast("포도알이 부족해요 🍇"); return; }
                  setUser(u => ({ ...u, grapePoints: u.grapePoints - sc.grapes }));
                  setMyCoupons(prev => [...prev, {
                    id: Date.now(), title: sc.title, desc: sc.desc,
                    from: sc.registeredBy, to: user.name, expiry: sc.expiry, status: "sent", origin: "shop",
                  }]);
                  setSelectedShopCoupon(null);
                  showToast(`${sc.title}을(를) 구매했어요! 🎉`);
                }} style={{
                  width: "100%", padding: "14px", borderRadius: 12,
                  background: canBuy ? `linear-gradient(135deg, ${colors.grape}, ${colors.primary})` : "#E5E7EB",
                  color: canBuy ? "#fff" : "#9CA3AF",
                  border: "none", fontSize: 15, fontWeight: 700,
                  cursor: canBuy ? "pointer" : "default", marginBottom: 8,
                }}>
                  {canBuy ? `구매하기 🍇 -${sc.grapes}` : "포도알 부족"}
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
          const cost = isGifticon ? selectedGift.credits : selectedGift.grapes;
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
              <button onClick={() => {
                if (isGifticon) {
                  setUser(u => ({ ...u, mallangCredits: u.mallangCredits - selectedGift.credits }));
                } else {
                  setUser(u => ({ ...u, grapePoints: u.grapePoints - selectedGift.grapes }));
                }
                setSelectedGift(null);
                showToast(`${partnerDisplayName}님에게 ${selectedGift.name}을(를) 선물했어요! 🎉`);
              }} style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: isGifticon
                  ? `linear-gradient(135deg, ${colors.gold}, #D97706)`
                  : `linear-gradient(135deg, ${colors.grape}, ${colors.primary})`,
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

      {/* Sub-tabs - 2x2 Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
        {[
          { key: "report", label: "📋 기본 보고서", premium: false },
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

      {/* ── 관계 보고서 (기본 - 항상 무료) ── */}
      {reportSubTab === "report" && (<>
        {(() => {
          const totalPraise = praiseLog.length;
          const totalChoresCompleted = chores.filter(c => c.completed).length;
          const totalChores = chores.length;
          const completedBoards = grapeBoards.filter(b => b.current >= b.goal).length;
          const totalBoards = grapeBoards.length;
          const sentCoupons = myCoupons.filter(c => c.from === user.name).length;
          const receivedCoupons = myCoupons.filter(c => c.to === user.name && c.status !== "draft").length;
          const usedCoupons = myCoupons.filter(c => c.status === "used").length;
          const totalGrapes = user.grapePoints;
          const choreCompletionRate = totalChores > 0 ? Math.round((totalChoresCompleted / totalChores) * 100) : 0;
          const boardCompletionRate = totalBoards > 0 ? Math.round((completedBoards / totalBoards) * 100) : 0;
          const relationScore = Math.min(100, Math.round((totalPraise * 5 + totalChoresCompleted * 3 + completedBoards * 10 + sentCoupons * 4 + receivedCoupons * 4) / Math.max(1, (totalPraise + totalChores + totalBoards + sentCoupons + receivedCoupons)) * 20));

          return (<>
          {/* Overall Score */}
          <div style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.grape})`,
            borderRadius: 20, padding: "24px", marginTop: 12, marginBottom: 12, textAlign: "center",
          }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>우리의 관계 점수</p>
            <div style={{ fontSize: 48, fontWeight: 800, color: "#fff" }}>{relationScore || 0}</div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
              칭찬, 할일 완수, 포도판 달성, 쿠폰 교환을 기반으로 산출
            </p>
          </div>

          {/* Activity Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[
              { icon: "💜", label: "칭찬 횟수", value: `${totalPraise}회`, color: colors.primary, bg: colors.primaryLight },
              { icon: "✅", label: "할일 완료율", value: `${choreCompletionRate}%`, color: colors.mint, bg: colors.mintLight },
              { icon: "🍇", label: "포도판 달성", value: `${completedBoards}/${totalBoards}`, color: colors.grape, bg: colors.grapeLight },
              { icon: "🎫", label: "쿠폰 교환", value: `${sentCoupons + receivedCoupons}장`, color: colors.warm, bg: colors.warmLight },
            ].map((s, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 14, padding: "16px",
                border: `1px solid ${colors.border}`, textAlign: "center",
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Grape Points Summary */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: "20px",
            border: `1px solid ${colors.border}`, marginBottom: 12,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 12 }}>🍇 포도알 현황</h3>
            <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: colors.grape }}>{totalGrapes}</div>
                <div style={{ fontSize: 11, color: colors.textTertiary }}>보유 포도알</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: colors.primary }}>{boardCompletionRate}%</div>
                <div style={{ fontSize: 11, color: colors.textTertiary }}>포도판 달성률</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: colors.warm }}>{usedCoupons}</div>
                <div style={{ fontSize: 11, color: colors.textTertiary }}>사용한 쿠폰</div>
              </div>
            </div>
          </div>

          {/* Chore Balance */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: "20px",
            border: `1px solid ${colors.border}`, marginBottom: 12,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 12 }}>⚖️ 할일 현황</h3>
            {totalChores > 0 ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>완료율</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: colors.mint }}>{choreCompletionRate}%</span>
                </div>
                <div style={{ height: 10, background: "#E5E7EB", borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ width: `${choreCompletionRate}%`, height: 10, background: `linear-gradient(90deg, ${colors.mint}, ${colors.primary})`, borderRadius: 6, transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>
                  총 {totalChores}개 중 {totalChoresCompleted}개 완료
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: colors.textTertiary, fontSize: 13, padding: "10px 0" }}>
                할 일을 등록하면 데이터가 표시돼요
              </div>
            )}
          </div>

          {/* Mood History - 이번 달 기분 기록 */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: "20px",
            border: `1px solid ${colors.border}`, marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>😊 이번 달 기분 기록</h3>
              <button onClick={() => setShowMoodPopup(true)} style={{
                background: colors.primaryLight, border: "none", borderRadius: 8,
                padding: "6px 12px", fontSize: 11, fontWeight: 600, color: colors.primary, cursor: "pointer",
              }}>오늘 기분 기록</button>
            </div>
            {(() => {
              const currentMonth = new Date().toISOString().substring(0, 7);
              const monthMoods = moodHistory.filter(m => m.date.startsWith(currentMonth));
              const moodCounts = monthMoods.reduce((acc, m) => {
                acc[m.mood] = (acc[m.mood] || 0) + 1;
                return acc;
              }, {});
              const moodLabels = {
                good: { emoji: "😊", label: "좋아요", color: colors.mint },
                happy: { emoji: "🥰", label: "행복해요", color: colors.primary },
                neutral: { emoji: "😐", label: "그냥그래요", color: colors.textSecondary },
                sad: { emoji: "😔", label: "우울해요", color: colors.warm },
                angry: { emoji: "😤", label: "화나요", color: colors.rose },
              };
              if (monthMoods.length === 0) {
                return (
                  <div style={{ textAlign: "center", padding: "16px 0", color: colors.textTertiary }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
                    <p style={{ fontSize: 13 }}>아직 기록이 없어요</p>
                    <p style={{ fontSize: 11 }}>매일 기분을 기록해보세요!</p>
                  </div>
                );
              }
              return (
                <div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    {Object.entries(moodCounts).map(([mood, count]) => {
                      const info = moodLabels[mood];
                      return (
                        <div key={mood} style={{
                          display: "flex", alignItems: "center", gap: 6,
                          background: "#F9FAFB", padding: "8px 12px", borderRadius: 10,
                        }}>
                          <span style={{ fontSize: 18 }}>{info?.emoji}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: info?.color }}>{count}회</span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 11, color: colors.textTertiary }}>
                    이번 달 {monthMoods.length}일 기록됨
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Tips */}
          <div style={{
            background: colors.primaryLight, borderRadius: 14, padding: "16px",
            border: `1px solid ${colors.primary}30`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.primary, marginBottom: 6 }}>💡 이번 주 팁</div>
            <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6 }}>
              {totalPraise < 3
                ? `칭찬을 더 자주 해보세요! ${partnerDisplayName}님에게 감사한 점을 하루 한 번 말해보는 건 어떨까요?`
                : totalChoresCompleted < totalChores * 0.5
                  ? "할 일 완료율을 높여보세요! 작은 것부터 함께 해나가면 관계가 더 단단해져요."
                  : "좋은 흐름이에요! 서로에 대한 관심을 유지하며 쿠폰으로 마음을 표현해보세요 🎫"
              }
            </p>
          </div>
          {/* 심화 보고서 안내 카드 */}
          <div style={{
            background: `linear-gradient(135deg, ${colors.grape}15, ${colors.primary}10)`,
            borderRadius: 16, padding: "20px", marginTop: 16,
            border: `1px solid ${colors.grape}30`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Sparkles size={18} color={colors.grape} />
              <span style={{ fontSize: 14, fontWeight: 700, color: colors.grape }}>더 깊은 분석이 필요하신가요?</span>
            </div>
            <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5, marginBottom: 14 }}>
              긍정 언어 황금 비율, 가사 분담 체감 지수,<br/>
              AI 대화 개선도, 취약 시간대까지 확인해보세요!
            </p>
            <button onClick={() => setReportSubTab("advanced")} style={{
              width: "100%", padding: "12px", borderRadius: 12,
              background: `linear-gradient(135deg, ${colors.grape}, ${colors.primary})`,
              color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              📈 심화 보고서 보러가기
            </button>
          </div>

          {/* Support 버튼 (클릭시 광고) */}
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

          {/* 데이터 유무 체크 - conversationHistory에서 해당 월 데이터 확인 */}
          {(() => {
            const monthData = conversationHistory.filter(item => {
              if (!item.timestamp) return false;
              const itemMonth = item.timestamp.substring(0, 7); // YYYY-MM
              return itemMonth === selectedReportMonth;
            });
            const hasData = monthData.length > 0;

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
                    <strong style={{ color: colors.primary }}>대화 분석</strong>을 해보세요!
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

              return (<>
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
              <p style={{ fontSize: 12, color: colors.primary, fontWeight: 600, marginBottom: 20 }}>
                🍇 포도알 10개로 열람 가능
              </p>

              <button onClick={() => {
                if (user.grapePoints < 10) {
                  showToast("포도알이 부족해요! (10개 필요) 🍇");
                  return;
                }
                setUser(u => ({ ...u, grapePoints: u.grapePoints - 10 }));
                setReportTodayUnlocked(true);
                showToast("심화 보고서가 열렸어요! 📈");
              }} style={{
                width: "100%", padding: "16px", borderRadius: 14,
                background: user.grapePoints >= 10
                  ? `linear-gradient(135deg, ${colors.grape}, ${colors.primary})`
                  : "#E5E7EB",
                color: user.grapePoints >= 10 ? "#fff" : "#9CA3AF",
                border: "none", fontSize: 15, fontWeight: 700,
                cursor: user.grapePoints >= 10 ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                🍇 포도알 10개로 열기 (현재: {user.grapePoints}개)
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
                    const formData = new FormData();
                    formData.append('audio', voiceFile);

                    const response = await fetch('/api/analyze', {
                      method: 'POST',
                      body: formData,
                    });

                    if (!response.ok) {
                      throw new Error('분석 실패');
                    }

                    const result = await response.json();
                    setVoiceResult(result);
                  } catch (error) {
                    console.error('Analysis error:', error);
                    setVoiceAnalyzing(false);
                    // 로컬 환경에서는 API가 없어서 실패함
                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    showToast(
                      isLocal
                        ? "로컬에서는 분석이 불가능해요. Vercel 배포 후 사용해주세요!"
                        : "분석에 실패했어요. 다시 시도해주세요.",
                      "error"
                    );
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
              <p style={{ fontSize: 12, color: colors.primary, fontWeight: 600, marginBottom: 20 }}>
                🍇 포도알 10개로 이용 가능
              </p>

              <button onClick={() => {
                if (user.grapePoints < 10) {
                  showToast("포도알이 부족해요! (10개 필요) 🍇");
                  return;
                }
                setUser(u => ({ ...u, grapePoints: u.grapePoints - 10 }));
                setVoiceUnlocked(true);
                showToast("대화 분석 기능이 열렸어요! 🎙️");
              }} style={{
                width: "100%", padding: "16px", borderRadius: 14,
                background: user.grapePoints >= 10
                  ? `linear-gradient(135deg, ${colors.grape}, ${colors.primary})`
                  : "#E5E7EB",
                color: user.grapePoints >= 10 ? "#fff" : "#9CA3AF",
                border: "none", fontSize: 15, fontWeight: 700,
                cursor: user.grapePoints >= 10 ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                🍇 포도알 10개로 열기 (현재: {user.grapePoints}개)
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
                        const response = await fetch('https://api.openai.com/v1/chat/completions', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
                          },
                          body: JSON.stringify({
                            model: 'gpt-4o-mini',
                            messages: [
                              {
                                role: 'system',
                                content: `당신은 공정한 커플 갈등 심판관입니다. 상황을 객관적으로 분석하고 누가 더 잘못했는지 판별해주세요.

반드시 다음 JSON 형식으로 응답하세요:
{
  "verdict": "A" 또는 "B" 또는 "둘다",
  "aFaultPercent": 0-100 사이 숫자,
  "bFaultPercent": 0-100 사이 숫자,
  "summary": "상황 요약 (2문장)",
  "aFaults": ["A의 잘못 1", "A의 잘못 2"],
  "bFaults": ["B의 잘못 1", "B의 잘못 2"],
  "advice": "두 사람에게 드리는 조언 (2-3문장)",
  "peacePhrase": "화해를 위한 대화 시작 문장"
}

A는 상황을 작성한 사람, B는 상대방입니다.`
                              },
                              { role: 'user', content: judgeText }
                            ],
                            temperature: 0.7,
                          }),
                        });

                        if (response.ok) {
                          const data = await response.json();
                          setJudgeResult(JSON.parse(data.choices[0].message.content));
                        } else {
                          throw new Error('API 호출 실패');
                        }
                      } catch (error) {
                        // Fallback 데모 데이터
                        setJudgeResult({
                          verdict: "둘다",
                          aFaultPercent: 40,
                          bFaultPercent: 60,
                          summary: "양쪽 모두 상대방의 입장을 충분히 고려하지 못했어요. 하지만 약속을 지키지 않은 B의 잘못이 조금 더 커요.",
                          aFaults: ["감정적으로 화를 표현한 점", "대화 대신 지적부터 한 점"],
                          bFaults: ["약속을 지키지 않은 점", "자신의 잘못을 인정하지 않은 점"],
                          advice: "약속을 어긴 것에 대해 B가 먼저 사과하고, A도 화난 감정을 차분히 전달하는 연습이 필요해요.",
                          peacePhrase: "우리 둘 다 서운했던 것 같아. 차분히 이야기해볼까?"
                        });
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

                  {/* 조언 */}
                  <div style={{
                    background: colors.mintLight, borderRadius: 14, padding: "16px", marginBottom: 12,
                  }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.mint, marginBottom: 8 }}>💚 AI의 조언</h3>
                    <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6 }}>{judgeResult.advice}</p>
                  </div>

                  {/* 화해 문장 */}
                  <div style={{
                    background: "#fff", borderRadius: 14, padding: "16px", marginBottom: 16,
                    border: `1px solid ${colors.border}`,
                  }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 8 }}>🕊️ 화해 시작 문장</h3>
                    <div style={{
                      background: colors.primaryLight, borderRadius: 10, padding: "12px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <p style={{ fontSize: 13, color: colors.primary, fontWeight: 500, flex: 1 }}>"{judgeResult.peacePhrase}"</p>
                      <button onClick={() => {
                        navigator.clipboard?.writeText?.(judgeResult.peacePhrase);
                        showToast("복사되었어요! 📋");
                      }} style={{
                        background: colors.primary, border: "none", borderRadius: 8,
                        padding: "6px 10px", cursor: "pointer",
                      }}>
                        <Copy size={14} color="#fff" />
                      </button>
                    </div>
                  </div>

                  <button onClick={() => { setJudgeResult(null); setJudgeText(""); }} style={{
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
              <p style={{ fontSize: 12, color: colors.primary, fontWeight: 600, marginBottom: 20 }}>
                🍇 포도알 10개로 이용 가능
              </p>

              <button onClick={() => {
                if (user.grapePoints < 10) {
                  showToast("포도알이 부족해요! (10개 필요) 🍇");
                  return;
                }
                setUser(u => ({ ...u, grapePoints: u.grapePoints - 10 }));
                setJudgeUnlocked(true);
                showToast("갈등 심판 기능이 열렸어요! ⚖️");
              }} style={{
                width: "100%", padding: "16px", borderRadius: 14,
                background: user.grapePoints >= 10
                  ? `linear-gradient(135deg, ${colors.grape}, ${colors.primary})`
                  : "#E5E7EB",
                color: user.grapePoints >= 10 ? "#fff" : "#9CA3AF",
                border: "none", fontSize: 15, fontWeight: 700,
                cursor: user.grapePoints >= 10 ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                🍇 포도알 10개로 열기 (현재: {user.grapePoints}개)
              </button>
            </div>
          )}
        </div>
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

      {/* Full-screen Settings Modal */}
      {showSettings && (
        <div style={{
          position: "fixed", inset: 0, background: colors.bg,
          zIndex: 200, overflowY: "auto",
        }}>
          {settingsTab === "main" ? (
            <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 20px" }}>
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
                  {LANGS.map(l => (
                    <button key={l} onClick={() => setLang(l)} style={{
                      padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: lang === l ? 700 : 500,
                      background: lang === l ? colors.primary : colors.primaryLight,
                      color: lang === l ? "#fff" : colors.primary,
                      transition: "all 0.2s",
                    }}>
                      {LANG_LABELS[l]}
                    </button>
                  ))}
                </div>
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
                    <input
                      type="text"
                      value={user.name}
                      onChange={e => setUser(u => ({ ...u, name: e.target.value }))}
                      style={{
                        width: "100%", padding: "10px 12px", borderRadius: 10,
                        border: `1.5px solid ${colors.border}`, fontSize: 14, fontWeight: 600,
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: colors.textSecondary, display: "block", marginBottom: 4 }}>짝꿍 이름</label>
                    {user.partnerConnected ? (
                      <input
                        type="text"
                        value={user.partnerName}
                        onChange={e => setUser(u => ({ ...u, partnerName: e.target.value }))}
                        style={{
                          width: "100%", padding: "10px 12px", borderRadius: 10,
                          border: `1.5px solid ${colors.border}`, fontSize: 14, fontWeight: 600,
                          outline: "none", boxSizing: "border-box",
                        }}
                      />
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
                  {[
                    { label: "초대 코드", value: user.inviteCode },
                    { label: "오늘 분석", value: reportTodayUnlocked ? "열람 완료 ✅" : (!reportFreeUsed ? "첫 분석 무료 🎁" : "광고 시청 필요 🔒") },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 0",
                      borderTop: `1px solid ${colors.border}`,
                    }}>
                      <span style={{ fontSize: 13, color: colors.textSecondary }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{item.value}</span>
                    </div>
                  ))}
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
                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.textSecondary }}>알</span>
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
              {couponCreateMode === "shop" && <div style={{ fontSize: 12, color: colors.grape, fontWeight: 700, marginTop: 6 }}>🍇 {newCouponGrapes}알</div>}
              {newCoupon.expiry ? <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 4 }}>유효기간: ~{newCoupon.expiry}</div> : <div style={{ fontSize: 10, color: colors.textTertiary, marginTop: 4 }}>유효기간을 선택해주세요</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setCouponCreateMode("personal"); setShowCouponCreate(false); setNewCoupon({ title: "", desc: "", expiry: "" }); setEditCouponId(null); }} style={{
                padding: "14px 12px", borderRadius: 12, background: "#F3F4F6", color: colors.textSecondary, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>취소</button>
              {editCouponId ? (
                <button onClick={() => {
                  if (!newCoupon.title.trim() || !newCoupon.expiry) return;
                  setMyCoupons(prev => prev.map(c => c.id === editCouponId ? { ...c, title: newCoupon.title, desc: newCoupon.desc || "", expiry: newCoupon.expiry } : c));
                  showToast("쿠폰이 수정되었어요! ✏️");
                  setNewCoupon({ title: "", desc: "", expiry: "" }); setEditCouponId(null); setShowCouponCreate(false);
                }} style={{
                  flex: 1, padding: "14px", borderRadius: 12,
                  background: (newCoupon.title.trim() && newCoupon.expiry) ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` : "#E5E7EB",
                  color: (newCoupon.title.trim() && newCoupon.expiry) ? "#fff" : "#9CA3AF",
                  border: "none", fontSize: 14, fontWeight: 700, cursor: (newCoupon.title.trim() && newCoupon.expiry) ? "pointer" : "default",
                }}>수정하기</button>
              ) : couponCreateMode === "shop" ? (
                <button onClick={() => {
                  if (!newCoupon.title.trim() || !newCoupon.expiry) return;
                  setShopCoupons(prev => [...prev, {
                    id: Date.now(), title: newCoupon.title, desc: newCoupon.desc || "",
                    grapes: newCouponGrapes, expiry: newCoupon.expiry, registeredBy: user.name,
                  }]);
                  showToast("포도알 상점에 쿠폰을 등록했어요! 🍇");
                  setNewCoupon({ title: "", desc: "", expiry: "" }); setNewCouponGrapes(10); setCouponCreateMode("personal"); setShowCouponCreate(false);
                }} style={{
                  flex: 1, padding: "14px", borderRadius: 12,
                  background: (newCoupon.title.trim() && newCoupon.expiry) ? `linear-gradient(135deg, ${colors.grape}, ${colors.primary})` : "#E5E7EB",
                  color: (newCoupon.title.trim() && newCoupon.expiry) ? "#fff" : "#9CA3AF",
                  border: "none", fontSize: 14, fontWeight: 700, cursor: (newCoupon.title.trim() && newCoupon.expiry) ? "pointer" : "default",
                }}>등록하기</button>
              ) : (<>
                <button onClick={() => {
                  if (!newCoupon.title.trim() || !newCoupon.expiry) return;
                  setMyCoupons(prev => [...prev, { id: Date.now(), title: newCoupon.title, desc: newCoupon.desc || "", from: user.name, to: partnerDisplayName, expiry: newCoupon.expiry, status: "draft", origin: "direct" }]);
                  showToast("쿠폰을 보관했어요. 나중에 보낼 수 있어요! 📦");
                  setNewCoupon({ title: "", desc: "", expiry: "" }); setEditCouponId(null); setShowCouponCreate(false);
                }} style={{
                  flex: 1, padding: "14px", borderRadius: 12,
                  background: (newCoupon.title.trim() && newCoupon.expiry) ? "#F3F4F6" : "#E5E7EB",
                  color: (newCoupon.title.trim() && newCoupon.expiry) ? colors.text : "#9CA3AF",
                  border: (newCoupon.title.trim() && newCoupon.expiry) ? `1px solid ${colors.border}` : "none",
                  fontSize: 13, fontWeight: 600, cursor: (newCoupon.title.trim() && newCoupon.expiry) ? "pointer" : "default",
                }}>보관하기</button>
                <button onClick={() => {
                  if (!newCoupon.title.trim() || !newCoupon.expiry) return;
                  setMyCoupons(prev => [...prev, { id: Date.now(), title: newCoupon.title, desc: newCoupon.desc || "", from: user.name, to: partnerDisplayName, expiry: newCoupon.expiry, status: "sent", origin: "direct" }]);
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
              <button onClick={() => {
                setMyCoupons(prev => prev.filter(c => c.id !== confirmDeleteCoupon));
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
              <button onClick={() => {
                setShopCoupons(prev => prev.filter(c => c.id !== confirmDeleteShopCoupon));
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
                <button key={mood.value} onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setMoodHistory(prev => [...prev.filter(m => m.date !== today), {
                    date: today,
                    mood: mood.value,
                    emoji: mood.emoji,
                    timestamp: new Date().toISOString(),
                  }]);
                  setShowMoodPopup(false);
                  showToast(`오늘 기분: ${mood.emoji} ${mood.label}`);
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
              <button onClick={() => {
                setMyCoupons(prev => prev.map(c => c.id === confirmSendCoupon ? { ...c, status: "sent" } : c));
                setConfirmSendCoupon(null);
                showToast(`${partnerDisplayName}님에게 쿠폰을 보냈어요! 🎫`);
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
          `🎉 축하해요! 목표를 달성했어요!\n${partnerDisplayName}님의 노력에 사랑의 쿠폰으로 보답해보는 건 어떨까요?`,
          `💜 대단해요! 포도판을 완성했어요!\n이 기쁨을 ${partnerDisplayName}님과 함께 나눠보세요!`,
          `🍇 달콤한 결실을 맺었어요!\n서로의 노력에 작은 선물로 감사를 전해보세요!`,
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
              <button onClick={() => setShowRewardModal(false)} style={{
                background: "none", border: "none", color: colors.textTertiary, fontSize: 13, cursor: "pointer", padding: "8px",
              }}>나중에 할게요</button>
            </div>
          </div>
        );
      })()}

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
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍇</div>
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
