import { NextResponse } from 'next/server';
import { systemPrompt } from '@/lib/systemPrompt';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendLeadEmail } from '@/lib/mailer';

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
        description: { type: 'string', description: 'Breve resumen de lo que el cliente necesita' },
      },
      required: ['name', 'phone'],
    },
  },
];

async function callClaude(
  messages: unknown[],
  apiKey: string,
  model: string,
  withTools: boolean
) {
  return fetch('https://api.anthropic.com/v1/messages', {
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
      ...(withTools ? { tools } : {}),
    }),
  });
}

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

    if (!message) {
      return NextResponse.json({ message: 'El mensaje está vacío.' }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ message: 'Falta la API Key de Anthropic en el servidor.' }, { status: 500 });
    }

    const messages = [...(Array.isArray(history) ? history : []), { role: 'user', content: message }];

    let response = await callClaude(messages, apiKey, model, true);
    let data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error al comunicarse con Claude Anthropic.');
    }

    const toolUse = data.content?.find(
      (block: { type: string; name: string }) => block.type === 'tool_use' && block.name === 'save_lead'
    );

    if (toolUse) {
      const lead = toolUse.input || {};
      let toolResultText = 'Lead guardado correctamente en el sistema.';

      try {
        const { error } = await getSupabaseAdmin().from('leads').insert([
          {
            name: lead.name,
            email: lead.email || null,
            phone: lead.phone,
            project_type: lead.projectType || null,
            description: lead.description || null,
            source: 'chatbot',
            status: 'new',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        if (error) throw error;

        await sendLeadEmail({
          source: 'chatbot',
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          projectType: lead.projectType,
          description: lead.description,
        });
      } catch (leadError) {
        console.error('Error saving chatbot lead:', leadError);
        toolResultText =
          'Hubo un problema técnico guardando el lead, pero puedes seguir atendiendo al cliente con normalidad.';
      }

      messages.push({ role: 'assistant', content: data.content });
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: toolResultText }],
      });

      response = await callClaude(messages, apiKey, model, false);
      data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al comunicarse con Claude Anthropic.');
      }
    }

    const reply = data.content?.find((b: { type: string }) => b.type === 'text')?.text || '';
    const updatedHistory = [...messages, { role: 'assistant', content: data.content }];

    return NextResponse.json({ reply, history: updatedHistory });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { message: 'Error al procesar el chat con Ava.', error: (error as Error).message },
      { status: 500 }
    );
  }
}
