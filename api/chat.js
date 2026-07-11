import { systemPrompt } from './_lib/systemPrompt.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { message } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

    if (!message) {
      return res.status(400).json({ message: 'El mensaje está vacío.' });
    }

    if (!apiKey) {
      return res.status(500).json({ message: 'Falta la API Key de Anthropic en el servidor.' });
    }

    // Llamada oficial a la API de Anthropic mediante fetch nativo
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error al comunicarse con Claude Anthropic.');
    }

    const reply = data.content[0]?.text || '';
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Error en endpoint de chat:', error);
    return res.status(500).json({ message: 'Error al procesar el chat con Ava.', error: error.message });
  }
}