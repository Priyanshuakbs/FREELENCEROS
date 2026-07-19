// Quick Resend API test script
// Run: node backend/test-resend.js
require('dotenv').config({ path: './backend/.env' });
const https = require('https');

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
const toEmail = process.env.SMTP_USER; // Send test to yourself

console.log('===========================================');
console.log('🧪 Resend API Test');
console.log('===========================================');
console.log('API Key   :', apiKey ? `${apiKey.substring(0, 12)}...` : '❌ NOT SET');
console.log('From Email:', fromEmail);
console.log('To Email  :', toEmail);
console.log('===========================================');

if (!apiKey) {
  console.error('❌ RESEND_API_KEY is not set in .env!');
  process.exit(1);
}

const payload = JSON.stringify({
  from: `FreelanceOS Test <${fromEmail}>`,
  to: [toEmail],
  subject: '✅ FreelanceOS Email Test - Resend Working!',
  html: `<div style="font-family:Arial;padding:20px;background:#f8fafc;border-radius:12px;">
    <h2 style="color:#4f46e5;">✅ Email System Working!</h2>
    <p>This is a test email from your FreelanceOS backend via Resend API.</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
  </div>`,
  text: 'FreelanceOS Email Test - Resend is working correctly!',
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
    const statusCode = res.statusCode;
    console.log('\n📡 Resend API Response:');
    console.log('Status Code:', statusCode);

    try {
      const data = JSON.parse(body);
      console.log('Response   :', JSON.stringify(data, null, 2));

      if (statusCode >= 200 && statusCode < 300) {
        console.log('\n✅ SUCCESS! Email sent via Resend. ID:', data.id);
        console.log(`📬 Check inbox: ${toEmail}`);
      } else {
        console.error('\n❌ FAILED! Error from Resend:');
        if (data.message?.includes('domain')) {
          console.error('⚠️  DOMAIN ISSUE: You need to verify a sending domain in Resend Dashboard');
          console.error('   OR: The "from" email must match your Resend verified domain.');
          console.error('   SOLUTION: Go to https://resend.com/domains and add your domain.');
        }
        if (data.message?.includes('to')) {
          console.error('⚠️  RECIPIENT ISSUE: On free plan without a verified domain,');
          console.error('   you can only send to the email you registered with Resend.');
        }
      }
    } catch (e) {
      console.error('Raw response:', body);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Network error:', err.message);
});

req.write(payload);
req.end();
