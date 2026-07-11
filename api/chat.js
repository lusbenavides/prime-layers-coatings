import { systemPrompt } from './_lib/systemPrompt.js';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';
import { sendLeadEmail } from './_lib/mailer.js';

// Herramienta que Ava puede usar cuando ya reunió suficiente info del cliente
const tools = [
  {
    name: 'save_lead',
    description:
      'Guarda la información de contacto de un cliente potencial para que el equipo de Prime Layer Coatings lo contacte. ' +
      'Úsala una sola vez, en cuanto tengas al menos el nombre completo y el teléfono del cliente dentro de la conversación.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre completo del cliente' },
        phone: { type: 'string', description: 'Número de teléfono del cliente' },
        email: { type: 'string', description: 'Correo electrónico del cliente, si lo proporcionó' },
        projectType: { type: 'string', description: 'Tipo de proyecto (interior, exterior, gabinetes, comercial, otro)' },
        description: { type: 'string', description: 'Breve resumen de lo que el cliente necesita' }
      },
      required: ['name', 'phone']
    }
  }
];

async function callClaude(messages, apiKey, model, withTools) {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      ...(withTools ? { tools } : {})
    })
  });
}

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

    const messages = [
      ...(Array.isArray(history) ? history : []),
      { role: 'user', content: message }
    ];

    let response = await callClaude(messages, apiKey, model, true);
    let data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error al comunicarse con Claude Anthropic.');
    }

    // ¿Ava decidió que ya tiene suficiente info para guardar el lead?
    const toolUse = data.content?.find((block) => block.type === 'tool_use' && block.name === 'save_lead');

    if (toolUse) {
      const lead = toolUse.input || {};
      let toolResultText = 'Lead guardado correctamente en el sistema.';

      try {
        const { error } = await supabaseAdmin.from('leads').insert([
          {
            name: lead.name,
            email: lead.email || null,
            phone: lead.phone,
            project_type: lead.projectType || null,
            description: lead.description || null,
            source: 'chatbot',
            created_at: new Date().toISOString()
          }
        ]);
        if (error) throw error;

        await sendLeadEmail({
          source: 'chatbot',
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          projectType: lead.projectType,
          description: lead.description
        });
      } catch (leadError) {
        console.error('Error guardando/enviando lead del chatbot:', leadError);
        toolResultText = 'Hubo un problema técnico guardando el lead, pero puedes seguir atendiendo al cliente con normalidad.';
      }

      // Le devolvemos el resultado de la herramienta a Claude para que redacte la confirmación final
      messages.push({ role: 'assistant', content: data.content });
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: toolResultText
          }
        ]
      });

      response = await callClaude(messages, apiKey, model, false);
      data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al comunicarse con Claude Anthropic.');
      }
    }

    const reply = data.content?.find((b) => b.type === 'text')?.text || '';
    const updatedHistory = [...messages, { role: 'assistant', content: data.content }];

    return res.status(200).json({ reply, history: updatedHistory });
  } catch (error) {
    console.error('Error en endpoint de chat:', error);
    return res.status(500).json({ message: 'Error al procesar el chat con Ava.', error: error.message });
  }
}