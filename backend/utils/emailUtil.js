const nodemailer = require('nodemailer');
const https = require('https');

// ── Resend API via native https ───────────────────────────────────────────────
const sendResendEmail = (apiKey, from, to, subject, html, text) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || '',
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Resend ${res.statusCode}: ${parsed.message || JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Resend parse error: ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Resend network: ${err.message}`)));
    req.write(payload);
    req.end();
  });
};

// ── Main sendEmail ────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const errors = [];

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  METHOD 1 — Gmail SSL port 465 (PRIMARY)                               ║
  // ║  WHY FIRST: Render does NOT block port 465. Sends to ANY email.        ║
  // ║  Resend free plan silently drops external emails (returns 200 but      ║
  // ║  never delivers to unregistered addresses) so we use Gmail first.      ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,       // SSL — port 587 is blocked on Render, 465 is NOT
        secure: true,    // must be true for port 465
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,  // Gmail App Password
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      const info = await transporter.sendMail({
        from: `"FreelanceOS" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: text || '',
        html,
      });

      console.log('✅ [EMAIL] Sent via Gmail SSL port 465. ID:', info.messageId, '→ To:', to);
      return { messageId: info.messageId, method: 'gmail-ssl-465' };
    } catch (err) {
      errors.push(`Gmail SSL: ${err.message}`);
      console.error('❌ [EMAIL] Gmail SSL port 465 failed:', err.message);
    }
  }

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  METHOD 2 — Resend API (FALLBACK)                                      ║
  // ║  NOTE: Works for any email ONLY if RESEND_FROM domain is verified      ║
  // ║  in Resend dashboard. Free plan with onboarding@resend.dev only        ║
  // ║  delivers to the Resend account's own registered email.                ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const data = await sendResendEmail(
        process.env.RESEND_API_KEY,
        `FreelanceOS <${fromEmail}>`,
        to, subject, html, text
      );
      console.log('✅ [EMAIL] Sent via Resend. ID:', data.id, '→ To:', to);
      return { messageId: data.id, method: 'resend' };
    } catch (err) {
      errors.push(`Resend: ${err.message}`);
      console.error('❌ [EMAIL] Resend failed:', err.message);
    }
  }

  // ── All methods failed ────────────────────────────────────────────────────
  if (errors.length > 0) {
    const summary = errors.join(' | ');
    console.error('🚨 [EMAIL] All delivery methods failed:', summary, '| To:', to);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Email could not be sent: ${summary}`);
    }
  }

  // ── Dev mock fallback ─────────────────────────────────────────────────────
  console.log('📧 [EMAIL MOCK] ─────────────────────────────');
  console.log('To     :', to);
  console.log('Subject:', subject);
  const link = html.match(/href="([^"]+)"/);
  if (link) console.log('Link   :', link[1]);
  else console.log('Body   :', text || '(html)');
  console.log('─────────────────────────────────────────────');
  await new Promise((r) => setTimeout(r, 300));
  return { messageId: `mock-${Date.now()}`, mock: true };
};

module.exports = { sendEmail };
