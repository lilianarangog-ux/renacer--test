import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const {
    token, fingerprint,
    nombre, email, edad, ocupacion,
    eneatipo, ala, subtipo, triada, puntajes
  } = req.body;

  if (!token) return res.status(400).json({ ok: false });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: tokenData } = await supabase
    .from('tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (!tokenData || tokenData.usado) {
    return res.status(200).json({ ok: false, motivo: 'invalido' });
  }

  await supabase
    .from('tokens')
    .update({
      usado: true,
      dispositivo_fp: fingerprint || null,
      ip_acceso: req.headers['x-forwarded-for'] || null,
      fecha_uso: new Date().toISOString()
    })
    .eq('token', token);

  await supabase
    .from('resultados')
    .insert({
      token, nombre, email, edad, ocupacion,
      eneatipo, ala, subtipo, triada,
      puntajes: puntajes || {}
    });

  return res.status(200).json({ ok: true });
}
