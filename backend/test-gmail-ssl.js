// Test Gmail SSL port 465 — the Render-compatible SMTP method
// Run: node backend/test-gmail-ssl.js
require('dotenv').config({ path: './backend/.env' });
const nodemailer = require('nodemailer');

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

console.log('===========================================');
console.log('🧪 Gmail SSL Port 465 Test');
console.log('===========================================');
console.log('SMTP_USER:', user || '❌ NOT SET');
console.log('SMTP_PASS:', pass ? '✅ set' : '❌ NOT SET');
console.log('===========================================\n');

if (!user || !pass) {
  console.error('❌ SMTP_USER or SMTP_PASS not set in .env!');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user, pass },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

transporter.sendMail({
  from: `"FreelanceOS Test" <${user}>`,
  to: user, // send to yourself
  subject: '✅ Gmail SSL Port 465 — FreelanceOS Working!',
  html: `<div style="font-family:Arial;padding:20px;background:#ecfdf5;border-radius:12px;">
    <h2 style="color:#059669;">✅ Gmail SSL Port 465 Works!</h2>
    <p>This email was sent via <strong>port 465 (SSL)</strong> which works on Render.</p>
    <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
  </div>`,
  text: 'FreelanceOS: Gmail SSL Port 465 is working correctly!',
}, (err, info) => {
  if (err) {
    console.error('❌ FAILED:', err.message);
    console.error('\n🔧 Fix checklist:');
    console.error('  1. Gmail "2-Step Verification" enabled?');
    console.error('  2. SMTP_PASS is a 16-char App Password (not Gmail login password)?');
    console.error('     → Go to: https://myaccount.google.com/apppasswords');
    console.error('  3. Less Secure Apps or App Password configured?');
  } else {
    console.log('✅ SUCCESS! Email sent via Gmail SSL 465.');
    console.log('   Message ID:', info.messageId);
    console.log('   Check inbox:', user);
  }
});
