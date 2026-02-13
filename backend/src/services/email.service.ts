import nodemailer from 'nodemailer';

const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  user: process.env.SMTP_USER || 'seuacesso@nucleoia.online',
  pass: process.env.SMTP_PASS || '@Nucleo1020',
  from: process.env.FROM_EMAIL || 'seuacesso@nucleoia.online',
};

const transporter = nodemailer.createTransport({
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: true,
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.pass,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions) {
  return transporter.sendMail({
    from: `"Nucleo IA" <${smtpConfig.from}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
