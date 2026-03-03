import nodemailer from 'nodemailer';

const smtpConfig = {
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT || '465'),
  user: process.env.SMTP_USER!,
  pass: process.env.SMTP_PASS!,
  from: process.env.FROM_EMAIL || process.env.SMTP_USER!,
};

if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
  console.error('[EMAIL] CRITICAL: SMTP_HOST, SMTP_USER, and SMTP_PASS must be set in .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: true,
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.pass,
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  socketTimeout: 30000,
  greetingTimeout: 15000,
});

// Verificar conexao SMTP no startup
transporter.verify()
  .then(() => console.log('[EMAIL] SMTP connection verified successfully'))
  .catch((err) => console.error('[EMAIL] SMTP connection FAILED:', err.message));

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions, retries = 2): Promise<{ success: boolean; messageId?: string; error?: string }> {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const info = await transporter.sendMail({
        from: `"Nucleo IA" <${smtpConfig.from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`[EMAIL] Sent successfully | To: ${options.to} | MessageId: ${info.messageId} | Response: ${info.response} | Accepted: ${JSON.stringify(info.accepted)} | Rejected: ${JSON.stringify(info.rejected)}`);

      if (info.rejected && info.rejected.length > 0) {
        console.error(`[EMAIL] WARNING: Recipient rejected by server | To: ${options.to} | Rejected: ${JSON.stringify(info.rejected)}`);
        return { success: false, error: `Recipient rejected: ${info.rejected.join(', ')}` };
      }

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      const errorDetail = `Code: ${err.code || 'N/A'} | Command: ${err.command || 'N/A'} | ResponseCode: ${err.responseCode || 'N/A'} | Message: ${err.message}`;
      console.error(`[EMAIL] Send FAILED (attempt ${attempt}/${retries + 1}) | To: ${options.to} | ${errorDetail}`);

      if (attempt <= retries) {
        const delay = attempt * 2000;
        console.log(`[EMAIL] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`[EMAIL] All ${retries + 1} attempts FAILED for: ${options.to}`);
        return { success: false, error: err.message };
      }
    }
  }

  return { success: false, error: 'All retry attempts exhausted' };
}
