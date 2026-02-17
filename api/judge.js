const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다' });
  }

  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: '분석할 텍스트가 필요합니다' });
    }

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Judge API error:', error);
    return res.status(500).json({
      error: 'AI 분석에 실패했습니다',
      message: error.message,
    });
  }
}
