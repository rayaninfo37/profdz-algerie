/**
 * Email service abstraction for KRYTY.
 * Uses SendGrid if SENDGRID_API_KEY is set, otherwise logs to console (dev mode).
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'noreply@profdz.dz';

  if (apiKey) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: 'PROF DZ' },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EMAIL] SendGrid delivery failed:', response.status, error);
      throw new Error('Email delivery failed: ' + response.status);
    }

    console.log('[EMAIL] Sent to ' + to + ' via SendGrid');
    return;
  }

  // Development fallback: log to console
  console.log('=========================================');
  console.log('[EMAIL DEV] To: ' + to);
  console.log('[EMAIL DEV] Subject: ' + subject);
  console.log('[EMAIL DEV] Body (HTML):');
  console.log(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
  console.log('=========================================');
}

