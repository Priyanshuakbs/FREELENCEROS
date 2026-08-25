require('dotenv').config();
const nodemailer = require('nodemailer');

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

console.log('SMTP User:', user);
console.log('SMTP Pass exists:', !!pass);
console.log('Testing Nodemailer with Gmail...\n');

const t = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass },
});

t.verify((err, success) => {
  if (err) {
    console.error('❌ Connection FAILED:', err.message);
    console.error('\nFix: Make sure Gmail App Password is correct and 2FA is enabled on Gmail.');
    process.exit(1);
  }
  console.log('✅ SMTP connection verified! Sending test email...');

  t.sendMail({
    from: `"FreelanceOS" <${user}>`,
    to: user,
    subject: 'OTP Test - Nodemailer Working!',
    text: 'Test OTP: 826541',
    html: '<h2>Nodemailer Working!</h2><p>OTP: <b>826541</b></p>',
  }, (sendErr, info) => {
    if (sendErr) {
      console.error('❌ Send FAILED:', sendErr.message);
    } else {
      console.log('\n✅ SUCCESS! Email sent to:', user);
      console.log('MessageId:', info.messageId);
      console.log('Response:', info.response);
    }
    process.exit(0);
  });
});
