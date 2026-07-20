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

const isNonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

const hasBrevoConfig = () => isNonEmpty(process.env.BREVO_API_KEY);
const hasResendConfig = () => isNonEmpty(process.env.RESEND_API_KEY);
const hasSmtpConfig = () => isNonEmpty(process.env.SMTP_USER) && isNonEmpty(process.env.SMTP_PASS);
const hasGmailApiConfig = () =>
  isNonEmpty(process.env.GMAIL_CLIENT_ID) &&
  isNonEmpty(process.env.GMAIL_CLIENT_SECRET) &&
  isNonEmpty(process.env.GMAIL_REFRESH_TOKEN) &&
  isNonEmpty(process.env.GMAIL_SENDER_EMAIL);
const getExplicitProvider = () => (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
const isProduction = () => process.env.NODE_ENV === 'production';
const isLikelyGmailAddress = (email) => typeof email === 'string' && /@gmail\.com$/i.test(email.trim());

const isEmailProviderConfigured = () =>
  hasBrevoConfig() || hasResendConfig() || hasSmtpConfig() || hasGmailApiConfig();

const getSmtpConfig = () => {
  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE.toLowerCase() === 'true'
    : port === 465;

  return {
    host: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
    port: Number.isFinite(port) ? port : 587,
    secure,
  };
};

const sendViaSmtp = async ({ to, subject, html, text }) => {
  const smtpConfig = getSmtpConfig();
  console.log(`ℹ️ [EMAIL] Attempting SMTP delivery → To: ${to}`);
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    requireTLS: !smtpConfig.secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
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

  console.log('✅ [EMAIL] Sent via Gmail SMTP. ID:', info.messageId, '→ To:', to);
  return { messageId: info.messageId, method: 'gmail-smtp' };
};

const getProviderOrder = () => {
  const explicit = getExplicitProvider();
  // Brevo first in both dev and prod — uses HTTPS/443, never blocked, free tier sends to any email
  // Gmail API second (needs OAuth setup), Resend third, SMTP last (port 587 often blocked on hosts)
  const defaultOrder = ['brevo', 'gmail-api', 'resend', 'smtp'];

  if (explicit && defaultOrder.includes(explicit)) {
    return [explicit, ...defaultOrder.filter((provider) => provider !== explicit)];
  }

  return defaultOrder;
};

const encodeBase64Url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const encodeMimeHeader = (value) => `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;

const buildMimeMessage = ({ from, to, subject, html, text }) => {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const plainText = text || '';
  const htmlBody = html || '';

  return [
    `From: ${from}`,
    `To: ${Array.isArray(to) ? to.join(', ') : to}`,
    `Subject: ${encodeMimeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    plainText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');
};

const getGoogleAccessToken = async () => {
  const body = new URLSearchParams({
    client_id: process.env.GMAIL_CLIENT_ID.trim(),
    client_secret: process.env.GMAIL_CLIENT_SECRET.trim(),
    refresh_token: process.env.GMAIL_REFRESH_TOKEN.trim(),
    grant_type: 'refresh_token',
  }).toString();

  const response = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'oauth2.googleapis.com',
        port: 443,
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
            else reject(new Error(`HTTP ${res.statusCode}: ${parsed.error_description || parsed.error || data}`));
          } catch {
            reject(new Error(`Parse error: ${data}`));
          }
        });
      }
    );

    req.on('error', (err) => reject(new Error(`Network: ${err.message}`)));
    req.write(body);
    req.end();
  });

  if (!response.access_token) {
    throw new Error('Google OAuth token response missing access_token');
  }

  return response.access_token;
};

const sendViaGmailApi = async ({ to, subject, html, text }) => {
  console.log(`ℹ️ [EMAIL] Attempting Gmail API delivery → To: ${to}`);
  const accessToken = await getGoogleAccessToken();
  const fromEmail = process.env.GMAIL_SENDER_EMAIL.trim();
  const rawMessage = buildMimeMessage({
    from: fromEmail,
    to,
    subject,
    html,
    text,
  });

  const result = await httpsPost(
    'gmail.googleapis.com',
    '/gmail/v1/users/me/messages/send',
    { Authorization: `Bearer ${accessToken}` },
    { raw: encodeBase64Url(rawMessage) }
  );

  console.log('✅ [EMAIL] Sent via Gmail API. ID:', result.id, '→ To:', to);
  return { messageId: result.id, method: 'gmail-api' };
};

// ── Main sendEmail ────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const errors = [];
  const providerConfigured = isEmailProviderConfigured();
  const providerOrder = getProviderOrder();

  for (const provider of providerOrder) {
    if (provider === 'gmail-api' && hasGmailApiConfig()) {
      try {
        return await sendViaGmailApi({ to, subject, html, text });
      } catch (err) {
        errors.push(`Gmail API: ${err.message}`);
        console.error('❌ [EMAIL] Gmail API failed:', err.message);
      }
    }

    if (provider === 'brevo' && hasBrevoConfig()) {
      try {
        console.log(`ℹ️ [EMAIL] Attempting Brevo delivery → To: ${to}`);
        const brevoKey = process.env.BREVO_API_KEY.trim();
        const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim();
        const senderName = (process.env.BREVO_SENDER_NAME || 'FreelanceOS').trim();

        if (!senderEmail) {
          throw new Error('BREVO_SENDER_EMAIL is required.');
        }

        if (isLikelyGmailAddress(senderEmail)) {
          console.warn(
            `⚠️ [EMAIL] BREVO_SENDER_EMAIL is set to ${senderEmail}. For better deliverability, use a verified Brevo sender or custom domain.`
          );
        }

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
    if (provider === 'resend' && hasResendConfig()) {
      try {
        console.log(`ℹ️ [EMAIL] Attempting Resend delivery → To: ${to}`);
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

    if (provider === 'smtp' && hasSmtpConfig()) {
      try {
        return await sendViaSmtp({ to, subject, html, text });
      } catch (err) {
        errors.push(`Gmail SMTP: ${err.message}`);
        console.error('❌ [EMAIL] Gmail SMTP failed:', err.message);
      }
    }
  }

  // ── No method configured or all failed ───────────────────────────────────
  if (errors.length > 0) {
    const summary = errors.join(' | ');
    console.error('🚨 [EMAIL] All methods failed:', summary, '| To:', to);
    throw new Error(`Email delivery failed: ${summary}`);
  }

  if (!providerConfigured) {
    const message = 'No email provider configured. Set BREVO_API_KEY, RESEND_API_KEY, or SMTP_USER/SMTP_PASS.';
    console.warn(`⚠️  [EMAIL] ${message} Using mock send in non-production mode.`);
  }

  // ── Dev mock ──────────────────────────────────────────────────────────────
  console.log('📧 [EMAIL MOCK] ─────────────────────────────');
  console.log('To     :', to);
  console.log('Subject:', subject);
  const link = typeof html === 'string' ? html.match(/href="([^"]+)"/) : null;
  if (link) console.log('Link   :', link[1]);
  else console.log('Body   :', text || '(html)');
  console.log('─────────────────────────────────────────────');
  await new Promise((r) => setTimeout(r, 200));
  return { messageId: `mock-${Date.now()}`, mock: true };
};

module.exports = { sendEmail };
