import { useState } from 'react';
import { Send } from 'lucide-react';
import { colors } from '../constants/colors';

export default function DailyQuestionCard({ question, myAnswer, partnerAnswer, onSubmit, myName, partnerName }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!question) return null;

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit(text.trim());
    setText('');
    setSubmitting(false);
  };

  const bothAnswered = myAnswer && partnerAnswer;

  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '20px',
      boxShadow: colors.shadow, marginBottom: 16,
      border: `1px solid ${colors.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>💬</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>오늘의 커플 질문</span>
        {bothAnswered && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: colors.mint,
            background: colors.mintLight, borderRadius: 8, padding: '2px 8px', marginLeft: 'auto',
          }}>🍇 +2</span>
        )}
      </div>

      <p style={{ fontSize: 16, fontWeight: 700, color: colors.text, lineHeight: 1.5, marginBottom: 16 }}>
        {question.questionText}
      </p>

      {!myAnswer ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="나의 답변을 적어보세요..."
            maxLength={200}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 14,
              border: `1.5px solid ${colors.border}`, outline: 'none',
              background: '#FAFAF8',
            }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button onClick={handleSubmit} disabled={!text.trim() || submitting} style={{
            width: 42, height: 42, borderRadius: 12, border: 'none',
            background: text.trim() ? colors.primary : colors.border,
            color: '#fff', cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Send size={18} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                {partnerName}님의 답변을 기다리고 있어요... 🤫
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
