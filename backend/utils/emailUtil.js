const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  // 1. Check if Resend is configured (Recommended for production on Render Free tier)
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `FreelanceOS <${fromEmail}>`,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || '',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }

      console.log('✅ Email sent successfully via Resend API. ID:', data.id);
      return { messageId: data.id };
    } catch (error) {
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
      console.error('❌ SMTP connection failed. Falling back to mock console logs...', error.message);
    }
  }

  // 3. Mock Console log (Fallback if no keys configured or both failed)
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
