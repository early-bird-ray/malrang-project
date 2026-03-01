import { useState } from 'react';
import { colors } from '../constants/colors';

export default function DailyQuestionCard({
  question, myAnswer, partnerAnswer,
  myPrediction, partnerPrediction,
  onSubmit, onPredict,
  myName, partnerName, pastAnswers,
}) {
  // step: 'answer' | 'predict' | 'done'
  const [selected, setSelected] = useState(null);
  const [predictionSelected, setPredictionSelected] = useState(null);
  const [step, setStep] = useState('answer');
  const [submitting, setSubmitting] = useState(false);

  if (!question) return null;

  const options = question.options || [];
  const bothAnswered = myAnswer && partnerAnswer;

  // 예측 결과 계산
  const predictionCorrect = myPrediction && partnerAnswer
    ? myPrediction.text === partnerAnswer.text
    : null;
  const partnerPredictionCorrect = partnerPrediction && myAnswer
    ? partnerPrediction.text === myAnswer.text
    : null;

  // 과거 답변 찾기 (현재 날짜 제외)
  const prevEntry = pastAnswers && pastAnswers.length > 1
    ? pastAnswers[pastAnswers.length - 2]
    : null;

  const handleSubmitAnswer = async () => {
    if (selected === null || submitting) return;
    setSubmitting(true);
    await onSubmit(options[selected]);
    setSubmitting(false);
    // 예측 단계로 이동
    setStep('predict');
  };

  const handleSubmitPrediction = async () => {
    if (predictionSelected === null || submitting) return;
    setSubmitting(true);
    await onPredict(options[predictionSelected]);
    setSubmitting(false);
    setStep('done');
  };

  const handleSkipPrediction = () => {
    setStep('done');
  };

  // 포도알 보상 배지 계산
  const grapeBadge = (() => {
    let total = 0;
    if (bothAnswered) total += 1;
    if (predictionCorrect) total += 1;
    if (total === 0) return null;
    return total;
  })();

  // ── 답변 선택 UI (Step 1) ──
  const renderAnswerStep = () => (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: selected !== null ? 12 : 0 }}>
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            style={{
              padding: '12px 16px',
              borderRadius: 14,
              border: selected === i
                ? `2px solid ${colors.primary}`
                : `1.5px solid ${colors.border}`,
              background: selected === i ? colors.primaryLight : '#FAFAF8',
              color: selected === i ? colors.primary : colors.text,
              fontWeight: selected === i ? 700 : 500,
              fontSize: 14,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {selected !== null && (
        <button
          onClick={handleSubmitAnswer}
          disabled={submitting}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 14,
            border: 'none',
            background: colors.primary,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? '보내는 중...' : '선택 완료!'}
        </button>
      )}
    </div>
  );

  // ── 예측 선택 UI (Step 2) ──
  const renderPredictStep = () => (
    <div>
      <div style={{
        background: colors.goldLight, borderRadius: 14, padding: '12px 16px',
        marginBottom: 12, textAlign: 'center',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.gold }}>
          🔮 {partnerName}님은 뭘 골랐을까?
        </span>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
          맞추면 포도알 +1 보너스!
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setPredictionSelected(i)}
            style={{
              padding: '12px 16px',
              borderRadius: 14,
              border: predictionSelected === i
                ? `2px solid ${colors.gold}`
                : `1.5px solid ${colors.border}`,
              background: predictionSelected === i ? colors.goldLight : '#FAFAF8',
              color: predictionSelected === i ? '#B45309' : colors.text,
              fontWeight: predictionSelected === i ? 700 : 500,
              fontSize: 14,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleSkipPrediction}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 14,
            border: `1.5px solid ${colors.border}`,
            background: '#fff',
            color: colors.textSecondary,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          건너뛰기
        </button>
        {predictionSelected !== null && (
          <button
            onClick={handleSubmitPrediction}
            disabled={submitting}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: 14,
              border: 'none',
              background: colors.gold,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? '보내는 중...' : '예측 완료! 🔮'}
          </button>
        )}
      </div>
    </div>
  );

  // ── 결과 표시 UI (Step 3) ──
  const renderResult = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* 내 답변 */}
      <div style={{
        background: colors.primaryLight, borderRadius: 14, padding: '12px 16px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: colors.primary, marginBottom: 4 }}>
          {myName}
        </div>
        <div style={{ fontSize: 14, color: colors.text, lineHeight: 1.5 }}>
          {myAnswer.text}
        </div>
      </div>

      {/* 짝꿍 답변 */}
      {partnerAnswer ? (
        <div style={{
          background: colors.warmLight, borderRadius: 14, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.warm, marginBottom: 4 }}>
            {partnerName}
          </div>
          <div style={{ fontSize: 14, color: colors.text, lineHeight: 1.5 }}>
            {partnerAnswer.text}
          </div>
        </div>
      ) : (
        <div style={{
          background: '#F9FAFB', borderRadius: 14, padding: '12px 16px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 13, color: colors.textTertiary }}>
            {partnerName}님의 답변을 기다리고 있어요...
          </span>
        </div>
      )}

      {/* 예측 결과 */}
      {myPrediction && partnerAnswer && (
        <div style={{
          background: predictionCorrect ? colors.mintLight : '#FFF8F0',
          borderRadius: 14, padding: '12px 16px',
          border: `1px solid ${predictionCorrect ? colors.mint : '#FBBF24'}`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4,
            color: predictionCorrect ? colors.mint : '#B45309',
          }}>
            {predictionCorrect ? '맞췄어요! 🎯' : '아쉬워요 😅'}
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>
            내 예측: {myPrediction.text} → 실제: {partnerAnswer.text}
          </div>
          {predictionCorrect && (
            <div style={{ fontSize: 11, color: colors.mint, marginTop: 4, fontWeight: 600 }}>
              보너스 포도알 +1 획득!
            </div>
          )}
        </div>
      )}

      {/* 상대의 예측 결과 */}
      {partnerPrediction && myAnswer && (
        <div style={{
          background: partnerPredictionCorrect ? colors.mintLight : '#FFF8F0',
          borderRadius: 14, padding: '12px 16px',
          border: `1px solid ${partnerPredictionCorrect ? colors.mint : '#FBBF24'}`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4,
            color: partnerPredictionCorrect ? colors.mint : '#B45309',
          }}>
            {partnerName}의 예측: {partnerPredictionCorrect ? '맞췄어요! 🎯' : '아쉬워요 😅'}
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>
            예측: {partnerPrediction.text} → 실제: {myAnswer.text}
          </div>
        </div>
      )}

      {/* 과거 답변 비교 (반복 질문일 때) */}
      {prevEntry && (
        <div style={{
          background: '#F8F7FF', borderRadius: 14, padding: '12px 16px',
          border: `1px dashed ${colors.primaryLight}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.primary, marginBottom: 6 }}>
            📊 지난번 답변 비교 ({prevEntry.id})
          </div>
          {prevEntry.answers && Object.entries(prevEntry.answers).map(([uid, ans]) => {
            const currentAns = uid === Object.keys(question.answers || {})[0]
              ? myAnswer?.text : partnerAnswer?.text;
            return (
              <div key={uid} style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>
                지난번: {ans.text} → 이번: {currentAns || '미답변'}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── 현재 단계 결정 ──
  const currentStep = (() => {
    // 이미 답변한 경우
    if (myAnswer) {
      // 이미 예측도 했거나, 결과를 볼 상태
      if (myPrediction || step === 'done') return 'done';
      // 예측 아직 안 했으면 예측 단계
      if (step === 'predict') return 'predict';
      return 'done';
    }
    // 답변 전
    if (step === 'predict') return 'predict';
    return 'answer';
  })();

  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '20px',
      boxShadow: colors.shadow, marginBottom: 16,
      border: `1px solid ${colors.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>💬</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>오늘의 커플 질문</span>
        {grapeBadge && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: colors.grape,
            background: colors.grapeLight, borderRadius: 8, padding: '2px 8px', marginLeft: 'auto',
          }}>🍇 +{grapeBadge}</span>
        )}
      </div>

      <p style={{ fontSize: 16, fontWeight: 700, color: colors.text, lineHeight: 1.5, marginBottom: 16 }}>
        {question.questionText}
      </p>

      {currentStep === 'answer' && renderAnswerStep()}
      {currentStep === 'predict' && renderPredictStep()}
      {currentStep === 'done' && renderResult()}
    </div>
  );
}
