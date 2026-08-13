const nodemailer = require('nodemailer');

// ══════════════════════════════════════════════════════════════════════════════
//  Email Utility — FreelanceOS
//  Uses Nodemailer with Gmail SMTP (App Password)
//  Works with ANY recipient email address
// ══════════════════════════════════════════════════════════════════════════════

let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;

  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();

  if (!user || !pass) {
    console.warn('⚠️  [EMAIL] SMTP_USER or SMTP_PASS not set. Emails will use mock mode.');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    pool: true,           // reuse connections — faster
    maxConnections: 5,
    rateDelta: 1000,
    rateLimit: 5,         // max 5 emails per second
  });

  console.log(`✅ [EMAIL] Nodemailer transporter ready. Sender: ${user}`);
  return transporter;
};

// ── Main sendEmail ────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const t = createTransporter();

  // Dev / No-config fallback — mock log
  if (!t) {
    console.log('📧 [EMAIL MOCK] ─────────────────────────────');
    console.log('To     :', to);
    console.log('Subject:', subject);
    const link = typeof html === 'string' ? html.match(/href="([^"]+)"/) : null;
    if (link) console.log('Link   :', link[1]);
    else console.log('Body   :', text || '(html only)');
    console.log('─────────────────────────────────────────────');
    await new Promise((r) => setTimeout(r, 200));
    return { messageId: `mock-${Date.now()}`, mock: true };
  }

  const user = (process.env.SMTP_USER || '').trim();
  const senderName = (process.env.SMTP_SENDER_NAME || 'FreelanceOS').trim();

  console.log(`ℹ️  [EMAIL] Sending → To: ${to} | Subject: ${subject}`);

  const info = await t.sendMail({
    from: `"${senderName}" <${user}>`,
    to,
    subject,
    text: text || '',
    html: html || '',
  });

  console.log(`✅ [EMAIL] Sent successfully! MessageId: ${info.messageId} → To: ${to}`);
  return { messageId: info.messageId, method: 'nodemailer-gmail' };
};

module.exports = { sendEmail };
