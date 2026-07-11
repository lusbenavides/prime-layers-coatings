import { systemPrompt, LEAD_DATA_START, LEAD_DATA_END } from './_lib/systemPrompt.js';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';

const VALID_PROJECT_TYPES = ['interior', 'exterior', 'cabinets', 'epoxy_floors', 'commercial', 'otro'];

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
    const { message, history } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

    if (!message) {
      return res.status(400).json({ message: 'El mensaje está vacío.' });
    }

    if (!apiKey) {
      return res.status(500).json({ message: 'Falta la API Key de Anthropic en el servidor.' });
    }

    // El frontend manda el historial completo (incluido el mensaje actual)
    // en el formato { role, content } que espera Anthropic directamente.
    // Si por alguna razón no llega historial, usamos solo el mensaje actual.
    const messages = Array.isArray(history) && history.length > 0
      ? history.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content || '').slice(0, 4000),
        }))
      : [{ role: 'user', content: message }];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error al comunicarse con Claude Anthropic.');
    }

    const rawReply = data.content[0]?.text || '';

    // ------------------------------------------------------------
    // Detecta y extrae el bloque oculto de datos del lead, si existe
    // ------------------------------------------------------------
    const { visibleReply, leadData } = extractLeadData(rawReply);

    let leadCaptured = false;

    if (leadData) {
      const { error: insertError } = await supabaseAdmin.from('leads').insert([
        {
          full_name: leadData.full_name || 'No proporcionado',
          phone: leadData.phone || 'No proporcionado',
          email: leadData.email && leadData.email !== 'no proporcionado' ? leadData.email : null,
          lead_type: 'b2c',
          project_type: normalizeProjectType(leadData.project_type),
          location: leadData.location && leadData.location !== 'no proporcionado' ? leadData.location : 'No proporcionada',
          estimated_size: null,
          budget_range: null,
          urgency: null,
          source: 'chatbot',
          qualification_score: 50,
          conversation_log: messages,
        },
      ]);

      if (insertError) {
        console.error('Error guardando lead del chatbot en Supabase:', insertError.message);
        // No interrumpimos la conversación por un error de guardado.
      } else {
        leadCaptured = true;
      }
    }

    return res.status(200).json({ reply: visibleReply, leadCaptured });
  } catch (error) {
    console.error('Error en endpoint de chat:', error);
    return res.status(500).json({ message: 'Error al procesar el chat con Ava.', error: error.message });
  }
}

// ------------------------------------------------------------
// Busca LEAD_DATA_START ... LEAD_DATA_END en la respuesta de la IA,
// parsea el JSON, y devuelve el texto visible (sin el bloque) junto
// con los datos extraídos.
// ------------------------------------------------------------
function extractLeadData(rawText) {
  const startIdx = rawText.indexOf(LEAD_DATA_START);
  const endIdx = rawText.indexOf(LEAD_DATA_END);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return { visibleReply: rawText.trim(), leadData: null };
  }

  const jsonBlock = rawText.slice(startIdx + LEAD_DATA_START.length, endIdx).trim();
  const visibleReply = (
    rawText.slice(0, startIdx) + rawText.slice(endIdx + LEAD_DATA_END.length)
  ).trim();

  try {
    const leadData = JSON.parse(jsonBlock);
    return { visibleReply, leadData };
  } catch (err) {
    console.error('No se pudo parsear el bloque LEAD_DATA:', err.message);
    return { visibleReply, leadData: null };
  }
}

function normalizeProjectType(value) {
  return VALID_PROJECT_TYPES.includes(value) ? value : 'otro';
}