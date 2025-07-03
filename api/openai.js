export default async function handler(req, res) {
  // 강화된 CORS 설정
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control,X-File-Name');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET 요청 (테스트용)
  if (req.method === 'GET') {
    res.status(200).json({ 
      status: 'OK', 
      message: 'OpenAI Proxy Server Running!',
      timestamp: new Date().toISOString(),
      methods: ['GET', 'POST'],
      cors: 'enabled'
    });
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed', allowed: ['GET', 'POST', 'OPTIONS'] });
    return;
  }

  try {
    // Authorization 헤더 확인
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'Authorization header missing' });
      return;
    }

    const apiKey = authHeader.replace('Bearer ', '');
    if (!apiKey.startsWith('sk-')) {
      res.status(401).json({ error: 'Invalid API key format' });
      return;
    }

    // 요청 본문 확인
    if (!req.body || !req.body.messages) {
      res.status(400).json({ error: 'Request body or messages missing' });
      return;
    }

    const { messages, model = 'gpt-4o-mini', temperature = 0.9, max_tokens = 4000 } = req.body;

    console.log('Proxying request to OpenAI...');

    // OpenAI API 호출
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'OpenAI-Proxy/1.0'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
        presence_penalty: 0.6,
        frequency_penalty: 0.8
      })
    });

    const responseData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error('OpenAI API Error:', responseData);
      res.status(openaiResponse.status).json({
        error: 'OpenAI API Error',
        details: responseData.error?.message || 'Unknown error',
        status: openaiResponse.status
      });
      return;
    }

    console.log('OpenAI API Success');
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Proxy Server Error:', error);
    res.status(500).json({
      error: 'Proxy server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
