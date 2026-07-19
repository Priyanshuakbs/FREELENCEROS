const nodemailer = require('nodemailer');
const https = require('https');

// ── Resend API via native https (no fetch, works on all Node versions) ────────
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
            reject(new Error(`Resend error ${res.statusCode}: ${parsed.message || JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Resend parse error: ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Resend network error: ${err.message}`)));
    req.write(payload);
    req.end();
  });
};

// ── Main sendEmail function ───────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const errors = [];

  // ── METHOD 1: Resend API (Best for production — HTTP 443, never blocked) ──
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const data = await sendResendEmail(
        process.env.RESEND_API_KEY,
        `FreelanceOS <${fromEmail}>`,
        to, subject, html, text
      );
      console.log('✅ [EMAIL] Sent via Resend. ID:', data.id);
      return { messageId: data.id, method: 'resend' };
    } catch (err) {
      errors.push(`Resend: ${err.message}`);
      console.error('❌ [EMAIL] Resend failed:', err.message);
    }
  }

  // ── METHOD 2: Gmail SSL on port 465 (Works on Render — 465 is NOT blocked) ─
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,          // SSL — Render does NOT block this port
        secure: true,       // true for 465
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      const info = await transporter.sendMail({
        from: `"FreelanceOS" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: text || '',
        html,
      });

      console.log('✅ [EMAIL] Sent via Gmail SSL (port 465). ID:', info.messageId);
      return { messageId: info.messageId, method: 'gmail-ssl' };
    } catch (err) {
      errors.push(`Gmail SSL: ${err.message}`);
      console.error('❌ [EMAIL] Gmail SSL (port 465) failed:', err.message);
    }
  }

  // ── METHOD 3: Custom SMTP (if SMTP_HOST is set and not gmail) ────────────
  if (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.gmail.com') {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
      });

      const info = await transporter.sendMail({
        from: `"FreelanceOS" <${process.env.SMTP_USER || 'no-reply@freelanceos.com'}>`,
        to,
        subject,
        text: text || '',
        html,
      });

      console.log('✅ [EMAIL] Sent via custom SMTP. ID:', info.messageId);
      return { messageId: info.messageId, method: 'smtp' };
    } catch (err) {
      errors.push(`Custom SMTP: ${err.message}`);
      console.error('❌ [EMAIL] Custom SMTP failed:', err.message);
    }
  }

  // ── All methods failed ────────────────────────────────────────────────────
  if (errors.length > 0) {
    const summary = errors.join(' | ');
    console.error('🚨 [EMAIL] All delivery methods failed:', summary);
    // In production, throw so the API returns an error toast to the user
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Email failed to send: ${summary}`);
    }
  }

  // ── Dev fallback: mock log ─────────────────────────────────────────────────
  console.log('📧 [EMAIL MOCK] ==========================================');
  console.log('To     :', to);
  console.log('Subject:', subject);
  const link = html.match(/href="([^"]+)"/);
  if (link) console.log('Link   :', link[1]);
  else console.log('Body   :', text || '(html only)');
  console.log('=========================================================');
  await new Promise((r) => setTimeout(r, 300));
  return { messageId: `mock-${Date.now()}`, mock: true };
};

module.exports = { sendEmail };
