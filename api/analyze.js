const OpenAI = require('openai');
const formidable = require('formidable');
const fs = require('fs');

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Step 1: Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.filepath),
      model: 'whisper-1',
      language: 'ko',
      response_format: 'text',
    });

    // Step 2: Analyze the conversation using GPT
    const analysisPrompt = `당신은 커플 대화 분석 전문가입니다. 아래 대화 내용을 분석해주세요.

대화 내용:
${transcription}

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '당신은 커플 대화 분석 전문 상담사입니다. 따뜻하고 건설적인 피드백을 제공합니다.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const analysisResult = JSON.parse(completion.choices[0].message.content);

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
