import { colors } from '../constants/colors';

export default function StreakBadge({ current, longest, onClick }) {
  if (!current || current <= 0) return null;

  let flame = '🔥';
  let badgeColor = colors.warm;
  let bgColor = colors.warmLight;

  if (current >= 100) {
    flame = '💎';
    badgeColor = colors.primary;
    bgColor = colors.primaryLight;
  } else if (current >= 30) {
    flame = '🌟';
    badgeColor = colors.gold;
    bgColor = colors.goldLight;
  } else if (current >= 7) {
    flame = '🔥';
    badgeColor = colors.warm;
    bgColor = colors.warmLight;
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: bgColor, borderRadius: 12, padding: '6px 12px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontSize: 16 }}>{flame}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: badgeColor, lineHeight: 1.2 }}>
          {current}일
        </span>
        {longest > current && (
          <span style={{ fontSize: 9, color: colors.textTertiary, lineHeight: 1 }}>
            최고 {longest}일
          </span>
        )}
      </div>
    </div>
  );
}
