const { GoogleGenerativeAI } = require('@google/generative-ai');
const formidable = require('formidable');
const fs = require('fs');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Analyze API: GEMINI_API_KEY not configured');
    return res.status(500).json({ error: 'AI API 키가 설정되지 않았습니다' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const form = formidable({ multiples: false });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const audioFile = files.audio?.[0] || files.audio;

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // 오디오 파일을 base64로 변환
    const audioBuffer = fs.readFileSync(audioFile.filepath);
    const audioBase64 = audioBuffer.toString('base64');
    const mimeType = audioFile.mimetype || 'audio/webm';

    const analysisPrompt = `당신은 커플 대화 분석 전문가입니다. 이 오디오 파일에 담긴 대화 내용을 먼저 인식(음성→텍스트)한 뒤 분석해주세요.

다음 JSON 형식으로 분석 결과를 반환해주세요:

{
  "topic": "전체 대화 주제 (20자 이내)",
  "moodSummary": "대화 분위기 요약 (2-3문장)",
  "conflictContribution": {
    "A": 숫자(0-100),
    "B": 숫자(0-100),
    "interpretation": "갈등 기여도에 대한 해석 (1-2문장)"
  },
  "personality": {
    "A": { "type": "성향 타입 (3-4자)", "desc": "성향 설명 (1-2문장)" },
    "B": { "type": "성향 타입 (3-4자)", "desc": "성향 설명 (1-2문장)" }
  },
  "goodPoints": {
    "A": ["잘한 점 1", "잘한 점 2"],
    "B": ["잘한 점 1", "잘한 점 2"]
  },
  "improvements": {
    "A": ["개선 포인트 1", "개선 포인트 2"],
    "B": ["개선 포인트 1", "개선 포인트 2"]
  },
  "actionSentences": ["실천 문장 1", "실천 문장 2"],
  "tone": { "positive": 숫자(0-100), "neutral": 숫자(0-100), "negative": 숫자(0-100) }
}

대화에서 화자를 구분할 수 없는 경우, 문맥과 어조를 바탕으로 A와 B를 추론해주세요.
반드시 유효한 JSON만 반환하고, 다른 텍스트는 포함하지 마세요.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: '당신은 커플 대화 분석 전문 상담사입니다. 따뜻하고 건설적인 피드백을 제공합니다.',
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent([
      { text: analysisPrompt },
      {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      },
    ]);

    const responseText = result.response.text();
    let analysisResult;
    try {
      analysisResult = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[1].trim());
      } else {
        console.error('Analyze API: Failed to parse Gemini response:', responseText.substring(0, 500));
        throw new Error('AI 응답 파싱 실패');
      }
    }

    // Add duration (estimated from file)
    analysisResult.duration = "분석 완료";

    // Clean up temp file
    fs.unlinkSync(audioFile.filepath);

    return res.status(200).json(analysisResult);

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
}
