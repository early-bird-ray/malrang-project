import { useState } from "react";
import { ChevronLeft, X, Check, Copy } from "lucide-react";
import { colors } from "../constants/colors";

export default function OnboardingScreen({ onComplete, onClose, savedAnswers = {}, myInviteCode = "" }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(savedAnswers);
  const [inviteCode, setInviteCode] = useState("");
  const [textInput, setTextInput] = useState(savedAnswers.forbiddenWords || "");
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
              <p style={{ fontSize: 13, color: colors.rose, lineHeight: 1.6, marginBottom: 6, fontWeight: 600 }}>
                분석이 완료되지 않았습니다.
              </p>
              <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
                모든 질문(11개)을 완료해야 분석 결과가 저장됩니다.<br/>
                지금 종료하면 작성한 내용은 저장되지 않아요.
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
                  onClose && onClose(null);
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
            <p style={{ fontSize: 13, color: colors.rose, lineHeight: 1.6, marginBottom: 6, fontWeight: 600 }}>
              분석이 완료되지 않았습니다.
            </p>
            <p style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
              모든 질문(11개)을 완료해야 분석 결과가 저장됩니다.<br/>
              지금 종료하면 작성한 내용은 저장되지 않아요.
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
                onClose && onClose(null);
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
            {myInviteCode || "생성 중..."}
          </div>
          <button onClick={() => {
            if (myInviteCode) {
              navigator.clipboard?.writeText?.(myInviteCode);
            }
          }} style={{
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
