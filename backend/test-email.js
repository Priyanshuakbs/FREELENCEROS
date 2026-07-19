const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('SMTP Config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS ? '********' : 'undefined'
});

const send = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"FreelanceOS" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'Test Email',
      text: 'If you receive this, SMTP is working!',
    });
    console.log('Email sent successfully!', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

send();
