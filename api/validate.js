import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { token, fingerprint } = req.method === 'GET'
    ? req.query
    : req.body;

  if (!token) {
    return res.status(400).json({ valido: false, motivo: 'sin_token' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) {
    return res.status(200).json({ valido: false, usado: false, motivo: 'no_existe' });
  }

  if (data.usado) {
    const mismoDispositivo = fingerprint && data.dispositivo_fp === fingerprint;
    return res.status(200).json({ valido: true, usado: true, mismoDispositivo, motivo: 'ya_usado' });
  }

  return res.status(200).json({ valido: true, usado: false });
}
