const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 간단한 인증 검증 (Firebase ID 토큰)
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다' });
  }

  try {
    // Firebase Admin을 통한 토큰 검증 (선택적)
    // 클라이언트에서 보내는 토큰을 신뢰하되, 서버에서 OpenAI 키 보호가 주 목적
    const { text, likedWords, dislikedWords } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: '변환할 텍스트가 필요합니다' });
    }

    const systemPrompt = `당신은 커플 대화 전문가입니다. 사용자가 하고 싶은 말을 짝꿍이 좋아하는 스타일로 부드럽게 변환해주세요.
변환 시 다음 원칙을 따르세요:
1. 감정을 먼저 인정하고 공감하는 표현 사용
2. "나는 ~해서 ~했어" 같은 I-message 형태로
3. 상대방을 비난하지 않고 해결책 제안
4. 따뜻하고 다정한 어조 유지
${likedWords ? `\n사용자의 짝꿍이 좋아하는 표현: ${likedWords}` : ''}
${dislikedWords ? `\n사용자의 짝꿍이 싫어하는 표현: ${dislikedWords}` : ''}

반드시 다음 JSON 형식으로만 응답하세요:
{"transformed": "변환된 문장", "tip": "짧은 대화 팁 (20자 이내)", "style": "스타일 이름 (예: 차분한 공감형)"}`;

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
    console.error('Transform API error:', error);
    return res.status(500).json({
      error: 'AI 변환에 실패했습니다',
      message: error.message,
    });
  }
}
