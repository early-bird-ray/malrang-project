import { useState } from 'react';
import { colors } from '../constants/colors';

export default function SecretMessageCard({
  unreadMessage,
  todaySent,
  onSend,
  onMarkRead,
  myName,
  partnerName,
}) {
  const [mode, setMode] = useState('idle'); // 'idle' | 'reading' | 'writing'
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;
    setSending(true);
    await onSend(messageText.trim());
    setMessageText('');
    setSending(false);
    setMode('idle');
  };

  const handleRead = async () => {
    setMode('reading');
    if (unreadMessage && onMarkRead) {
      await onMarkRead(unreadMessage.id);
    }
  };

  // 받은 메시지가 있을 때 (아직 안 읽음)
  if (unreadMessage && mode !== 'reading') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #FFF7ED, #FFFBEB)',
        borderRadius: 20, padding: '20px',
        boxShadow: colors.shadow, marginBottom: 16,
        border: '1px solid #FED7AA',
        cursor: 'pointer',
      }}
        onClick={handleRead}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>💌</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>
              {partnerName}님이 몰래 한마디를 남겼어요!
            </div>
            <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
              탭해서 열어보기
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 메시지 읽는 중
  if (mode === 'reading' && unreadMessage) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #FFF7ED, #FFFBEB)',
        borderRadius: 20, padding: '20px',
        boxShadow: colors.shadow, marginBottom: 16,
        border: '1px solid #FED7AA',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>💌</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
            {partnerName}님의 몰래 한마디
          </span>
        </div>
        <div style={{
          background: '#fff', borderRadius: 14, padding: '16px',
          border: '1px solid #FDE68A',
          fontSize: 15, lineHeight: 1.6, color: colors.text,
          textAlign: 'center',
        }}>
          {unreadMessage.message}
        </div>
        <button
          onClick={() => setMode('idle')}
          style={{
            width: '100%', marginTop: 12,
            padding: '10px', borderRadius: 14,
            border: 'none',
            background: '#F59E0B', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          고마워요! 💕
        </button>
      </div>
    );
  }

  // 보내기 모드
  if (mode === 'writing') {
    return (
      <div style={{
        background: '#fff', borderRadius: 20, padding: '20px',
        boxShadow: colors.shadow, marginBottom: 16,
        border: `1px solid ${colors.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🤫</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>몰래 한마디 보내기</span>
        </div>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={`${partnerName}님에게 몰래 한마디...`}
          maxLength={100}
          style={{
            width: '100%', minHeight: 80, padding: '12px',
            borderRadius: 14, border: `1.5px solid ${colors.border}`,
            fontSize: 14, color: colors.text, resize: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: colors.textTertiary }}>{messageText.length}/100</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setMode('idle'); setMessageText(''); }}
              style={{
                padding: '8px 16px', borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: '#fff', color: colors.textSecondary,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              onClick={handleSend}
              disabled={!messageText.trim() || sending}
              style={{
                padding: '8px 20px', borderRadius: 10,
                border: 'none',
                background: messageText.trim() ? colors.primary : colors.border,
                color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? '보내는 중...' : '🤫 몰래 보내기'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 기본 상태 (idle)
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '16px 20px',
      boxShadow: colors.shadow, marginBottom: 16,
      border: `1px solid ${colors.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤫</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>몰래 한마디</span>
      </div>
      {todaySent ? (
        <span style={{ fontSize: 12, color: colors.textTertiary }}>
          오늘은 이미 보냈어요 ✅
        </span>
      ) : (
        <button
          onClick={() => setMode('writing')}
          style={{
            padding: '8px 16px', borderRadius: 10,
            border: 'none',
            background: colors.primaryLight, color: colors.primary,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          💌 보내기
        </button>
      )}
    </div>
  );
}
