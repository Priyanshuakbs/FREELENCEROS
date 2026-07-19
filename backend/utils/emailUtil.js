const nodemailer = require('nodemailer');
const https = require('https');

// ══════════════════════════════════════════════════════════════════════════════
//  Email Utility — FreelanceOS
//  Priority order:
//   1. Brevo API (HTTPS/443 — never blocked, sends to ANY email, free tier OK)
//   2. Resend API (HTTPS/443 — free plan only delivers to Resend account email)
//   3. Gmail SSL 465 (might work on some hosts)
//   4. Mock log (dev fallback)
// ══════════════════════════════════════════════════════════════════════════════

// ── Generic HTTPS POST helper ─────────────────────────────────────────────────
const httpsPost = (hostname, path, headers, payload) => {
  return new Promise((resolve, reject) => {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const options = {
      hostname,
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
          else reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || body}`));
        } catch {
          reject(new Error(`Parse error: ${body}`));
        }
      });
    });
    req.on('error', (e) => reject(new Error(`Network: ${e.message}`)));
    req.write(data);
    req.end();
  });
};

// ── Main sendEmail ────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const errors = [];

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  METHOD 1 — Brevo (Sendinblue) API  ✅ BEST FOR PRODUCTION             ║
  // ║  • Uses HTTPS port 443 — NEVER blocked on Render / Vercel / Railway    ║
  // ║  • Free tier: 300 emails/day — no domain verification needed           ║
  // ║  • Sends to ANY email address                                           ║
  // ║  Setup: brevo.com → API Keys → set BREVO_API_KEY env var               ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  if (process.env.BREVO_API_KEY) {
    try {
      // .trim() removes invisible whitespace/newlines that sneak in during copy-paste
      const brevoKey = process.env.BREVO_API_KEY.trim();
      const senderEmail = (process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'noreply@freelanceos.app').trim();
      const senderName = (process.env.BREVO_SENDER_NAME || 'FreelanceOS').trim();

      const result = await httpsPost(
        'api.brevo.com',
        '/v3/smtp/email',
        { 'api-key': brevoKey },
        {
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text || '',
        }
      );

      console.log('✅ [EMAIL] Sent via Brevo API. MessageId:', result.messageId, '→ To:', to);
      return { messageId: result.messageId, method: 'brevo' };
    } catch (err) {
      errors.push(`Brevo: ${err.message}`);
      console.error('❌ [EMAIL] Brevo failed:', err.message);
    }
  }

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  METHOD 2 — Resend API                                                 ║
  // ║  NOTE: Free plan with onboarding@resend.dev ONLY delivers to the       ║
  // ║  Resend account owner's email. Verify a domain for external delivery.  ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const result = await httpsPost(
        'api.resend.com',
        '/emails',
        { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        {
          from: `FreelanceOS <${fromEmail}>`,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || '',
        }
      );
      console.log('✅ [EMAIL] Sent via Resend. ID:', result.id, '→ To:', to);
      return { messageId: result.id, method: 'resend' };
    } catch (err) {
      errors.push(`Resend: ${err.message}`);
      console.error('❌ [EMAIL] Resend failed:', err.message);
    }
  }

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  METHOD 3 — Gmail SSL port 465                                         ║
  // ║  Works locally and on some hosts. Render free MAY block port 465.      ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      const info = await transporter.sendMail({
        from: `"FreelanceOS" <${process.env.SMTP_USER}>`,
        to, subject,
        text: text || '',
        html,
      });
      console.log('✅ [EMAIL] Sent via Gmail SSL 465. ID:', info.messageId, '→ To:', to);
      return { messageId: info.messageId, method: 'gmail-ssl' };
    } catch (err) {
      errors.push(`Gmail SSL: ${err.message}`);
      console.error('❌ [EMAIL] Gmail SSL failed:', err.message);
    }
  }

  // ── No method configured or all failed ───────────────────────────────────
  if (errors.length > 0) {
    const summary = errors.join(' | ');
    console.error('🚨 [EMAIL] All methods failed:', summary, '| To:', to);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Email delivery failed: ${summary}`);
    }
  } else {
    console.warn('⚠️  [EMAIL] No email provider configured. Set BREVO_API_KEY for production.');
  }

  // ── Dev mock ──────────────────────────────────────────────────────────────
  console.log('📧 [EMAIL MOCK] ─────────────────────────────');
  console.log('To     :', to);
  console.log('Subject:', subject);
  const link = html.match(/href="([^"]+)"/);
  if (link) console.log('Link   :', link[1]);
  else console.log('Body   :', text || '(html)');
  console.log('─────────────────────────────────────────────');
  await new Promise((r) => setTimeout(r, 200));
  return { messageId: `mock-${Date.now()}`, mock: true };
};

module.exports = { sendEmail };
