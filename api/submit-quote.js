import { supabaseAdmin } from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  // Habilitar CORS básico
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
    const { name, email, phone, projectType, description } = req.body;

    if (!name || !phone || !projectType) {
      return res.status(400).json({ message: 'Nombre, teléfono y tipo de proyecto son requeridos.' });
    }

    // Insertar el lead directo en la tabla 'leads' de Supabase
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert([
        { 
          name, 
          email, 
          phone, 
          project_type: projectType, 
          description,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Cotización registrada exitosamente.' });
  } catch (error) {
    console.error('Error en submit-quote:', error);
    return res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
  }
}