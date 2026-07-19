const nodemailer = require('nodemailer');
const https = require('https');

const sendResendEmail = (apiKey, from, to, subject, html, text) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
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
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.message || body));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  let resendError = null;
  let smtpError = null;

  // 1. Check if Resend is configured (Recommended for production on Render Free tier)
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const fromFormatted = `FreelanceOS <${fromEmail}>`;

      const data = await sendResendEmail(process.env.RESEND_API_KEY, fromFormatted, to, subject, html, text);
      console.log('✅ Email sent successfully via Resend API. ID:', data.id);
      return { messageId: data.id };
    } catch (error) {
      resendError = error;
      console.error('❌ Resend API failed. Falling back to SMTP/mock...', error.message);
    }
  }

  // 2. SMTP fallback (For local usage)
  if (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.ethereal.email') {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 5000, // 5 seconds
      greetingTimeout: 5000,   // 5 seconds
    });

    try {
      const mailOptions = {
        from: `"FreelanceOS" <${process.env.SMTP_USER || 'no-reply@freelanceos.com'}>`,
        to,
        subject,
        text: text || '',
        html,
      };
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via SMTP. ID:', info.messageId);
      return info;
    } catch (error) {
      smtpError = error;
      console.error('❌ SMTP connection failed. Falling back to mock console logs...', error.message);
    }
  }

  // 3. If in production and configured methods failed, throw the error
  if (process.env.NODE_ENV === 'production') {
    const errMsg = [];
    if (process.env.RESEND_API_KEY) errMsg.push(`Resend: ${resendError?.message}`);
    if (process.env.SMTP_HOST) errMsg.push(`SMTP: ${smtpError?.message}`);
    if (errMsg.length > 0) {
      throw new Error(`Email dispatch failed (${errMsg.join(' | ')})`);
    }
  }

  // 4. Mock Console log (Fallback if no keys configured or both failed in dev)
  console.log('============= NODEMAILER MOCK EMAIL DISPATCH =============');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('HTML Body summary or Link:');
  const linkMatch = html.match(/href="([^"]+)"/);
  if (linkMatch) {
    console.log('👉 LINK:', linkMatch[1]);
  } else {
    console.log(text || html);
  }
  console.log('===========================================================');
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { messageId: 'mock-id-' + Date.now(), mock: true };
};

module.exports = { sendEmail };
