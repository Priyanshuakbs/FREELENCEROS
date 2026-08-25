require('dotenv').config();
const { sendEmail } = require('./utils/emailUtil');

const testTo = 'rpriyanshu1902@gmail.com';

sendEmail({
  to: testTo,
  subject: '✅ FreelanceOS - Email System Working!',
  html: `
    <div style="font-family:Arial;padding:25px;background:#ecfdf5;border-radius:12px;border:1px solid #6ee7b7;max-width:600px">
      <h2 style="color:#059669;margin-top:0">✅ Email Working!</h2>
      <p>Bhai yeh email aa gaya matlab <strong>FreelanceOS email system sahi kaam kar raha hai!</strong></p>
      <p>OTP aur password reset dono ab sahi kaam karenge.</p>
      <hr style="border:0;border-top:1px solid #d1fae5;margin:20px 0"/>
      <p style="color:#6b7280;font-size:12px">FreelanceOS · Test sent at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
    </div>
  `,
  text: 'FreelanceOS email test successful! Email system is working correctly via Brevo.',
}).then(result => {
  console.log('✅ SUCCESS! Email sent. Result:', JSON.stringify(result));
  console.log('Check inbox:', testTo);
}).catch(err => {
  console.error('❌ FAILED:', err.message);
  process.exit(1);
});
