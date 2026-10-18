// Supabase Edge Function « notify-sortie » : e-mail à tous les membres validés quand une sortie est créée.
// Secrets à définir : GMAIL_USER (ex. tonyblackwolf188@gmail.com) et GMAIL_APP_PASSWORD (mot de passe d'application Google).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: { user } } = await db.auth.getUser((req.headers.get('Authorization') || '').replace('Bearer ', ''));
  if (!user) return out({ error: 'non connecté' }, 401);
  const { data: me } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') return out({ error: 'réservé aux admins' }, 403);
  const { sortie_id } = await req.json();
  const { data: s } = await db.from('sorties').select('*').eq('id', sortie_id).single();
  if (!s) return out({ error: 'sortie introuvable' }, 404);
  const { data: ms } = await db.from('profiles').select('email').in('role', ['membre', 'admin']);
  const to = (ms || []).map((m) => m.email).filter(Boolean);
  const when = new Date(s.date_sortie).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'full', timeStyle: 'short' });
  const esc = (t: string) => String(t ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
  const user_ = Deno.env.get('GMAIL_USER')!;
  const smtp = new SMTPClient({ connection: { hostname: 'smtp.gmail.com', port: 465, tls: true, auth: { username: user_, password: Deno.env.get('GMAIL_APP_PASSWORD')! } } });
  await smtp.send({
    from: `Tony Blackwolf <${user_}>`, to: user_, bcc: to,
    subject: `🏍️ Nouvelle sortie : ${s.titre} — ${when}`,
    content: `Nouvelle sortie : ${s.titre}\nQuand : ${when}\nLieu : ${s.lieu || 'à préciser'}\n\n${s.description || ''}\n\nhttps://braskoffi.github.io/Tony-blackwolf/#espace`,
    html: `<h2>🏍️ ${esc(s.titre)}</h2><p><b>Quand :</b> ${esc(when)}<br><b>Lieu :</b> ${esc(s.lieu || 'à préciser')}</p><p>${esc(s.description || '')}</p><p><a href="https://braskoffi.github.io/Tony-blackwolf/#espace">Voir dans l'espace membre</a></p>`,
  });
  await smtp.close();
  return out({ sent: to.length });
});
