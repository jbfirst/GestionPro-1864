interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envoi d'email transactionnel via l'API HTTP de Resend.
 * Sans RESEND_API_KEY configurée, l'email est journalisé au lieu d'être envoyé
 * (utile en développement) — l'appel ne casse jamais le flux utilisateur.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "GestionPro <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY absente — email non envoyé à ${to} : ${subject}`);
    console.warn(`[email] contenu : ${text ?? html}`);
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`[email] échec de l'envoi à ${to} : ${detail}`);
    return { skipped: false, error: detail };
  }

  return { skipped: false };
}

/** Gabarit HTML du mail de réinitialisation de mot de passe. */
export function resetPasswordEmail(url: string) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f8fb;padding:32px">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;padding:32px">
      <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#0b2a4a">GestionPro</p>
      <p style="margin:0 0 20px;font-size:13px;color:#64748b">Gestion simple pour petits commerces</p>
      <h1 style="margin:0 0 12px;font-size:20px;color:#0f1b2d">Réinitialisation du mot de passe</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155">
        Vous avez demandé un nouveau mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un.
        Ce lien expire dans 1 heure.
      </p>
      <a href="${url}" style="display:inline-block;background:#0e9f6e;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600">
        Choisir un nouveau mot de passe
      </a>
      <p style="margin:24px 0 0;font-size:12.5px;line-height:1.6;color:#64748b">
        Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.
      </p>
    </div>
  </div>`;
}
