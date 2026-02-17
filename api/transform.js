const { GoogleGenerativeAI } = require('@google/generative-ai');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Transform API: GEMINI_API_KEY not configured');
    return res.status(500).json({ error: 'AI API 키가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { text, likedWords, dislikedWords, partnerPersonality } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: '변환할 텍스트가 필요합니다' });
    }

    const hasPersonality = !!partnerPersonality;

    const systemPrompt = `너는 커플 대화 변환 전문가야. 사용자가 짝꿍에게 하려는 말을 부드럽게 변환해줘.

[절대 규칙 - 반드시 지켜야 함]
1. 원본 메시지의 "구체적 상황"을 반드시 변환 결과에 포함해야 한다.
   - 원본이 "물 내려"에 대한 이야기면 → 변환에도 "물 내리는 것/화장실" 언급 필수
   - 원본이 "설거지"에 대한 이야기면 → 변환에도 "설거지" 언급 필수
   - 원본이 "늦었다"에 대한 이야기면 → 변환에도 "기다린 것/시간" 언급 필수
2. 원본의 감정(짜증, 서운함, 화남)을 부드럽게 표현하되, 감정 자체는 전달해야 한다.
3. 구체적 행동 요청을 포함해야 한다 (뭘 해달라는 건지 명확하게).
4. "우리 같이 방법을 찾아볼까?" 같은 뜬구름 잡는 일반론 금지. 원본에 없는 이야기 금지.

[변환 3단계]
Step 1: 원본에서 "상황"(뭐에 대한 이야기인지) + "감정"(어떤 기분인지) + "요청"(뭘 해달라는지) 추출
Step 2: 상황을 자연스럽게 언급하면서 감정을 I-message("나는 ~할 때 ~한 기분이었어")로 표현
Step 3: 요청을 부드럽지만 명확하게 전달 ("~해주면 좋겠어", "~해줄 수 있을까?")

예시:
- 원본: "야 물내리라고 했잖아 왜 항상 나를 힘들게해?"
  → "화장실 물 안 내려져 있으면 나는 좀 신경 쓰여서 그래. 쓰고 나서 물 내려주면 고마울 것 같아!"
- 원본: "맨날 나만 설거지하잖아 짜증나"
  → "요즘 내가 설거지 계속 하다 보니까 좀 지치더라. 이번 주는 번갈아가면서 해보면 어떨까?"
- 원본: "또 약속 늦었네 나 1시간 기다렸어"
  → "1시간 기다리니까 솔직히 좀 서운했어. 다음엔 늦을 것 같으면 미리 연락 한 번만 해줄 수 있어?"

${hasPersonality ? `[성향 맞춤 모드]
상대방 성향: ${partnerPersonality}
위 성향을 고려해서, 상대가 가장 잘 받아들일 표현 스타일로 변환해줘.
${likedWords ? `짝꿍이 좋아하는 표현: ${likedWords}` : ''}
${dislikedWords ? `짝꿍이 싫어하는 표현: ${dislikedWords}` : ''}

JSON 형식:
{"mode":"성향 맞춤 모드","transformed":"변환된 문장","tip":"원본 상황에 맞는 구체적 팁 (20자 이내)","style":"스타일 이름"}` : `[일반 제안 모드]
성향 정보 없이 3가지 다른 톤의 선택지를 제공해.
${likedWords ? `짝꿍이 좋아하는 표현: ${likedWords}` : ''}
${dislikedWords ? `짝꿍이 싫어하는 표현: ${dislikedWords}` : ''}

3가지 스타일:
1. 다정한 공감형 - 감정 인정 + 부드러운 요청
2. 솔직담백형 - 팩트 기반 + 직접적이지만 존중하는 요청
3. 유머 섞인형 - 가볍게 상황 언급 + 웃으면서 요청

JSON 형식:
{"mode":"일반 제안 모드","options":[{"transformed":"문장1","style":"다정한 공감형"},{"transformed":"문장2","style":"솔직담백형"},{"transformed":"문장3","style":"유머 섞인형"}],"tip":"원본 상황에 맞는 구체적 팁 (20자 이내)"}`}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    // 429 재시도 (최대 2회, 3초 간격)
    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await model.generateContent(text);
        break;
      } catch (e) {
        if (e.status === 429 || (e.message && e.message.includes('429'))) {
          if (attempt < 2) { await new Promise(r => setTimeout(r, (attempt + 1) * 3000)); continue; }
        }
        throw e;
      }
    }
    const responseText = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        console.error('Transform API: Failed to parse Gemini response:', responseText.substring(0, 500));
        throw new Error('AI 응답 파싱 실패');
      }
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Transform API error:', error.message);
    const status = (error.status === 429 || (error.message && error.message.includes('429'))) ? 429 : 500;
    return res.status(status).json({
      error: status === 429 ? 'API 호출 한도 초과 — 1분 후 다시 시도해주세요' : 'AI 변환에 실패했습니다',
      message: error.message,
    });
  }
}
