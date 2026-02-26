import { colors } from '../constants/colors';

const MOODS = {
  good: { emoji: '😊', label: '좋아요' },
  happy: { emoji: '🥰', label: '행복해요' },
  neutral: { emoji: '😐', label: '그냥그래요' },
  sad: { emoji: '😔', label: '우울해요' },
  angry: { emoji: '😤', label: '화나요' },
};

export default function CoupleMoodCard({ myMood, partnerMood, myName, partnerName, onRecordMood }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '20px',
      boxShadow: colors.shadow, marginBottom: 16,
      border: `1px solid ${colors.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>💜</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>오늘의 기분</span>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {/* 내 기분 */}
        <div style={{
          flex: 1, textAlign: 'center', padding: '16px 8px', borderRadius: 16,
          background: myMood ? colors.primaryLight : '#F9FAFB',
          border: `1px solid ${myMood ? `${colors.primary}33` : colors.border}`,
        }}>
          <div style={{ fontSize: 11, color: colors.textTertiary, marginBottom: 8, fontWeight: 600 }}>{myName}</div>
          {myMood ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 4 }}>{MOODS[myMood.mood]?.emoji || '❓'}</div>
              <div style={{ fontSize: 12, color: colors.primary, fontWeight: 600 }}>{MOODS[myMood.mood]?.label}</div>
              <button onClick={onRecordMood} style={{
                marginTop: 8, background: 'none', border: 'none',
                fontSize: 11, color: colors.textTertiary, cursor: 'pointer', textDecoration: 'underline',
              }}>수정</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 4, opacity: 0.3 }}>😶</div>
              <button onClick={onRecordMood} style={{
                marginTop: 4, padding: '6px 14px', borderRadius: 10, border: 'none',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>기분 기록하기</button>
            </>
          )}
        </div>

        {/* 파트너 기분 */}
        <div style={{
          flex: 1, textAlign: 'center', padding: '16px 8px', borderRadius: 16,
          background: partnerMood ? '#FFF5F5' : '#F9FAFB',
          border: `1px solid ${partnerMood ? '#FCA5A522' : colors.border}`,
        }}>
          <div style={{ fontSize: 11, color: colors.textTertiary, marginBottom: 8, fontWeight: 600 }}>{partnerName}</div>
          {partnerMood ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 4 }}>{MOODS[partnerMood.mood]?.emoji || '❓'}</div>
              <div style={{ fontSize: 12, color: colors.rose, fontWeight: 600 }}>{MOODS[partnerMood.mood]?.label}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 4, opacity: 0.3 }}>😶</div>
              <div style={{ fontSize: 12, color: colors.textTertiary, lineHeight: 1.5, marginTop: 4 }}>
                아직 기분을<br/>선택하지 않았어요
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
