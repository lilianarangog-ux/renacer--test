import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { adminKey, email, nombre } = req.body;

  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ ok: false, motivo: 'no_autorizado' });
  }

  if (!email) {
    return res.status(400).json({ ok: false, motivo: 'email_requerido' });
  }

  const token = randomBytes(18).toString('base64url');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { error } = await supabase
    .from('tokens')
    .insert({ token, email, nombre: nombre || '' });

  if (error) {
    return res.status(500).json({ ok: false, motivo: 'error_db' });
  }

  const baseURL = process.env.BASE_URL || 'https://renacer-test.vercel.app';
  const link = `${baseURL}?token=${token}`;

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'RENACER <onboarding@resend.dev>',
    to: email,
    subject: 'Tu acceso al Test de Eneagrama RENACER está listo ✦',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#fff;color:#0f0f0f">
        <div style="font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#b5862a;margin-bottom:24px">
          RENACER — 7 días para volver a ti
        </div>
        <h1 style="font-size:28px;font-weight:400;margin-bottom:16px">
          Hola${nombre ? `, ${nombre}` : ''} 👋
        </h1>
        <p style="font-size:15px;color:#4a4a4a;line-height:1.8;margin-bottom:24px">
          Tu acceso al Test de Eneagrama RENACER está listo. Este link funciona una sola vez.
        </p>
        <div style="text-align:center;margin-bottom:32px">
          <a href="${link}" style="display:inline-block;background:#0f0f0f;color:#fff;text-decoration:none;padding:16px 32px;border-radius:10px;font-size:15px;font-weight:600">
            Comenzar mi test →
          </a>
        </div>
        <p style="font-size:13px;color:#888;line-height:1.7">
          ⚠️ Este link es de uso único. Si tienes algún problema, responde este email.
        </p>
      </div>
    `
  });

  return res.status(200).json({ ok: true, token, link });
}
