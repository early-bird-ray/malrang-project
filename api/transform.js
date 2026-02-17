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

    const hasPersonality = !!partnerPersonality;

    const systemPrompt = `너는 사용자의 메시지를 변환해주는 '대화 도우미'야. 아래 로직을 엄격히 지켜서 대답해줘.

1) 데이터 확인: 상대방 성향 분석 결과가 ${hasPersonality ? '있음' : '없음'}.

2) 실행 로직:
${hasPersonality ? `[상태 A - 성향 맞춤 모드]
상대방의 성향 분석 결과: ${partnerPersonality}
- 분석된 성향(MBTI, 성격, 선호 말투)을 최우선으로 반영해.
- 상대방이 가장 거부감 느끼지 않고 좋아할 만한 말투로 문장을 다듬어줘.
- 감정을 먼저 인정하고 공감하는 표현 사용
- "나는 ~해서 ~했어" 같은 I-message 형태로
- 상대방을 비난하지 않고 해결책 제안
${likedWords ? `사용자의 짝꿍이 좋아하는 표현: ${likedWords}` : ''}
${dislikedWords ? `사용자의 짝꿍이 싫어하는 표현: ${dislikedWords}` : ''}

반드시 다음 JSON 형식으로만 응답:
{"mode":"성향 맞춤 모드","transformed":"변환된 문장 1개","tip":"짧은 대화 팁 (20자 이내)","style":"스타일 이름"}` : `[상태 B - 일반 제안 모드]
상대방 성향 정보가 없으므로 보편적이고 친절한 '일반 모드'로 작동해.
- 감정을 먼저 인정하고 공감하는 표현 사용
- "나는 ~해서 ~했어" 같은 I-message 형태로
- 상대방을 비난하지 않고 해결책 제안
- 각각 다른 스타일(예: 공감형, 유머형, 솔직담백형)의 3가지 선택지를 줘.
${likedWords ? `사용자의 짝꿍이 좋아하는 표현: ${likedWords}` : ''}
${dislikedWords ? `사용자의 짝꿍이 싫어하는 표현: ${dislikedWords}` : ''}

반드시 다음 JSON 형식으로만 응답:
{"mode":"일반 제안 모드","options":[{"transformed":"변환된 문장1","style":"스타일1"},{"transformed":"변환된 문장2","style":"스타일2"},{"transformed":"변환된 문장3","style":"스타일3"}],"tip":"짧은 대화 팁 (20자 이내)"}`}`;

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
