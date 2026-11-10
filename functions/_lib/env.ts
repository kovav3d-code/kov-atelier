export interface Env {
  DB: D1Database;
  FICHIERS: R2Bucket;
  SITE_URL: string;
  MAIL_FROM: string;          // ex. "Kov Atelier <devis@votre-domaine.fr>" (domaine vérifié chez Resend)
  MAIL_ATELIER: string;       // adresse qui reçoit les demandes
  ENVIRONMENT?: string;       // "production" ou "development"
  RESEND_API_KEY?: string;    // secret
  TURNSTILE_SECRET_KEY?: string; // secret
  ACCESS_TEAM_DOMAIN?: string;   // ex. "kovatelier.cloudflareaccess.com"
  ACCESS_AUD?: string;           // « Application Audience (AUD) Tag » de Cloudflare Access
  TELEGRAM_BOT_TOKEN?: string;   // secret facultatif : alerte Telegram instantanée
  TELEGRAM_CHAT_ID?: string;     // secret facultatif : identifiant de la conversation Telegram
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export const echapper = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
