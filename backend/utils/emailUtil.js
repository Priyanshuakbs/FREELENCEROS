const nodemailer = require('nodemailer');
const https = require('https');

// ══════════════════════════════════════════════════════════════════════════════
//  Email Utility — FreelanceOS
//
//  Strategy:
//   1. Brevo API  (HTTPS/443) → Production (Render/Vercel — SMTP ports blocked)
//   2. Gmail SMTP (port 587)  → Local development fallback
//   3. Mock log               → No config found
//
//  Why dual-provider:
//   - Render.com blocks outbound SMTP ports (587/465) → Gmail SMTP fails
//   - Brevo API uses HTTPS/443 → never blocked, works everywhere
//   - Brevo free plan sends to ANY recipient email ✅
// ══════════════════════════════════════════════════════════════════════════════

// ── Brevo API via HTTPS ───────────────────────────────────────────────────────
const sendViaBrevo = ({ to, subject, html, text }) => {
  return new Promise((resolve, reject) => {
    const apiKey   = (process.env.BREVO_API_KEY || '').trim();
    const fromEmail = (process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || '').trim();
    const fromName  = (process.env.BREVO_SENDER_NAME || 'FreelanceOS').trim();

    const payload = JSON.stringify({
      sender:      { name: fromName, email: fromEmail },
      to:          [{ email: to }],
      subject,
      htmlContent: html || '',
      textContent: text || '',
    });

    const options = {
      hostname: 'api.brevo.com',
      port:     443,
      path:     '/v3/smtp/email',
      method:   'POST',
      headers:  {
        'api-key':        apiKey,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ [EMAIL] Sent via Brevo API. MessageId: ${parsed.messageId} → To: ${to}`);
            resolve({ messageId: parsed.messageId, method: 'brevo' });
          } else {
            reject(new Error(`Brevo HTTP ${res.statusCode}: ${parsed.message || body}`));
          }
        } catch {
          reject(new Error(`Brevo parse error: ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Brevo network error: ${e.message}`)));
    req.write(payload);
    req.end();
  });
};

// ── Gmail SMTP via Nodemailer ─────────────────────────────────────────────────
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: (process.env.SMTP_USER || '').trim(),
      pass: (process.env.SMTP_PASS || '').trim(),
    },
    pool:           true,
    maxConnections: 5,
    socketTimeout:  10000,
    connectionTimeout: 10000,
  });
  return _transporter;
};

const sendViaGmailSmtp = async ({ to, subject, html, text }) => {
  const user = (process.env.SMTP_USER || '').trim();
  const name = (process.env.SMTP_SENDER_NAME || 'FreelanceOS').trim();
  console.log(`ℹ️  [EMAIL] Attempting Gmail SMTP → To: ${to}`);

  const info = await getTransporter().sendMail({
    from:    `"${name}" <${user}>`,
    to,
    subject,
    text:    text || '',
    html:    html || '',
  });

  console.log(`✅ [EMAIL] Sent via Gmail SMTP. MessageId: ${info.messageId} → To: ${to}`);
  return { messageId: info.messageId, method: 'gmail-smtp' };
};

// ── Mock (dev fallback) ───────────────────────────────────────────────────────
const sendViaMock = async ({ to, subject, html, text }) => {
  console.log('📧 [EMAIL MOCK] ─────────────────────────────');
  console.log('To     :', to);
  console.log('Subject:', subject);
  const link = typeof html === 'string' ? html.match(/href="([^"]+)"/) : null;
  if (link) console.log('Link   :', link[1]);
  else      console.log('Body   :', text || '(html only)');
  console.log('─────────────────────────────────────────────');
  await new Promise((r) => setTimeout(r, 150));
  return { messageId: `mock-${Date.now()}`, mock: true };
};

// ── Main sendEmail ────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const hasBrevo = !!(process.env.BREVO_API_KEY || '').trim();
  const hasSmtp  = !!(process.env.SMTP_USER || '').trim() && !!(process.env.SMTP_PASS || '').trim();

  // 1. Brevo API — best for production (Render/any host, HTTPS/443, never blocked)
  if (hasBrevo) {
    try {
      console.log(`ℹ️  [EMAIL] Attempting Brevo API → To: ${to}`);
      return await sendViaBrevo({ to, subject, html, text });
    } catch (err) {
      console.error('❌ [EMAIL] Brevo failed:', err.message);
      // fall through to Gmail SMTP
    }
  }

  // 2. Gmail SMTP — works locally (Render blocks port 587)
  if (hasSmtp) {
    try {
      return await sendViaGmailSmtp({ to, subject, html, text });
    } catch (err) {
      console.error('❌ [EMAIL] Gmail SMTP failed:', err.message);
      // fall through to mock
    }
  }

  // 3. Mock fallback
  if (!hasBrevo && !hasSmtp) {
    console.warn('⚠️  [EMAIL] No provider configured (BREVO_API_KEY or SMTP_USER/PASS). Using mock mode.');
  } else {
    console.error('🚨 [EMAIL] All providers failed → To:', to);
    throw new Error(`Email delivery failed for ${to}. Check server logs.`);
  }

  return sendViaMock({ to, subject, html, text });
};

module.exports = { sendEmail };
