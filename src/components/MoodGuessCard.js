import { useState } from 'react';
import { colors } from '../constants/colors';

const MOODS = [
  { emoji: '😊', label: '좋아요', value: 'good' },
  { emoji: '🥰', label: '행복해요', value: 'happy' },
  { emoji: '😐', label: '그냥그래요', value: 'neutral' },
  { emoji: '😔', label: '우울해요', value: 'sad' },
  { emoji: '😤', label: '화나요', value: 'angry' },
];

export default function MoodGuessCard({ guess, onSubmit, partnerName }) {
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    await onSubmit(selected);
    setSubmitting(false);
  };

  // 이미 추측 완료 + 결과 공개
  if (guess && guess.actualMood !== null && guess.actualMood !== undefined) {
    const guessedMoodObj = MOODS.find(m => m.value === guess.guessedMood);
    const actualMoodObj = MOODS.find(m => m.value === guess.actualMood);

    return (
      <div style={{
        background: '#fff', borderRadius: 20, padding: '20px',
        boxShadow: colors.shadow, marginBottom: 16,
        border: `1px solid ${colors.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.grape }}>기분 맞히기 결과</span>
          <span style={{
            fontSize: 10, fontWeight: 700, marginLeft: 'auto',
            color: guess.isCorrect ? colors.mint : colors.warm,
            background: guess.isCorrect ? colors.mintLight : colors.warmLight,
            borderRadius: 8, padding: '2px 8px',
          }}>
            {guess.isCorrect ? '🍇 +3 정답!' : '🍇 +1 참여'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: colors.textTertiary, marginBottom: 4 }}>내 추측</div>
            <div style={{ fontSize: 36 }}>{guessedMoodObj?.emoji || '❓'}</div>
            <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{guessedMoodObj?.label}</div>
          </div>
          <div style={{ fontSize: 24, color: colors.textTertiary }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: colors.textTertiary, marginBottom: 4 }}>{partnerName}의 기분</div>
            <div style={{ fontSize: 36 }}>{actualMoodObj?.emoji || '❓'}</div>
            <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{actualMoodObj?.label}</div>
          </div>
        </div>
      </div>
    );
  }

  // 이미 추측 완료 but 아직 상대 기분 미기록
  if (guess && guess.guessedMood) {
    const guessedMoodObj = MOODS.find(m => m.value === guess.guessedMood);
    return (
      <div style={{
        background: '#fff', borderRadius: 20, padding: '20px',
        boxShadow: colors.shadow, marginBottom: 16,
        border: `1px solid ${colors.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.grape }}>기분 맞히기</span>
        </div>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{guessedMoodObj?.emoji}</div>
          <div style={{ fontSize: 13, color: colors.textSecondary }}>
            {partnerName}님의 기분을 <strong>{guessedMoodObj?.label}</strong>로 추측했어요
          </div>
          <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 6 }}>
            {partnerName}님이 기분을 기록하면 결과가 공개돼요! ⏳
          </div>
        </div>
      </div>
    );
  }

  // 미추측 상태 → 기분 선택 UI
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '20px',
      boxShadow: colors.shadow, marginBottom: 16,
      border: `1px solid ${colors.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>🎯</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.grape }}>기분 맞히기</span>
      </div>

      <p style={{ fontSize: 14, color: colors.text, marginBottom: 14, fontWeight: 600 }}>
        오늘 {partnerName}님의 기분은 어떨까요?
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {MOODS.map(mood => (
          <button key={mood.value} onClick={() => setSelected(mood.value)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '10px 12px', borderRadius: 14,
            background: selected === mood.value ? colors.primaryLight : '#F9FAFB',
            border: `2px solid ${selected === mood.value ? colors.primary : colors.border}`,
            cursor: 'pointer', minWidth: 54,
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 24 }}>{mood.emoji}</span>
            <span style={{ fontSize: 10, color: selected === mood.value ? colors.primary : colors.textTertiary, fontWeight: 600 }}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <button onClick={handleSubmit} disabled={submitting} style={{
          width: '100%', padding: '12px', borderRadius: 14, border: 'none',
          background: `linear-gradient(135deg, ${colors.grape}, ${colors.primary})`,
          color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          {submitting ? '제출 중...' : '추측하기!'}
        </button>
      )}
    </div>
  );
}
