const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const { text, likedWords, dislikedWords, partnerPersonality } = req.body;

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
${partnerPersonality ? `\n상대방(짝꿍)의 성향 분석 결과: ${partnerPersonality}\n이 성향을 고려하여 상대가 가장 잘 받아들일 수 있는 표현으로 변환해주세요.` : ''}

반드시 다음 JSON 형식으로만 응답하세요:
{"transformed": "변환된 문장", "tip": "짧은 대화 팁 (20자 이내)", "style": "스타일 이름 (예: 차분한 공감형)"}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(text);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Transform API error:', error);
    return res.status(500).json({
      error: 'AI 변환에 실패했습니다',
      message: error.message,
    });
  }
}
