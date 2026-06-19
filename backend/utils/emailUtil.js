const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || 'demo_user',
      pass: process.env.SMTP_PASS || 'demo_pass',
    },
  });

  const isMock = !process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.ethereal.email';

  const mailOptions = {
    from: `"FreelanceOS" <${process.env.SMTP_USER || 'no-reply@freelanceos.com'}>`,
    to,
    subject,
    text: text || '',
    html,
  };

  if (isMock) {
    console.log('============= NODEMAILER MOCK EMAIL DISPATCH =============');
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
    console.log('HTML Body summary or Link:');
    // Extract link if any is in HTML
    const linkMatch = html.match(/href="([^"]+)"/);
    if (linkMatch) {
      console.log('👉 LINK:', linkMatch[1]);
    } else {
      console.log(text || html);
    }
    console.log('===========================================================');
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { messageId: 'mock-id-' + Date.now() };
  }

  return await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
