export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다' });
  }

  try {
    const { messages, model = 'gpt-4o-mini', temperature = 0.9 } = req.body;
    const apiKey = req.headers.authorization?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({ error: 'Authorization 헤더가 필요합니다' });
    }

    // OpenAI API 호출
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4000,
        temperature,
        presence_penalty: 0.6,
        frequency_penalty: 0.8
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return res.status(openaiResponse.status).json({
        error: `OpenAI API 오류: ${openaiResponse.status}`,
        details: errorText
      });
    }

    const data = await openaiResponse.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('프록시 서버 오류:', error);
    res.status(500).json({
      error: '프록시 서버 오류',
      details: error.message
    });
  }
}
