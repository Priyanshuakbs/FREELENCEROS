require('dotenv').config({ path: './backend/.env' });
const https = require('https');

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;
const toEmail = senderEmail; // test to self

const payload = JSON.stringify({
  sender: { name: 'FreelanceOS', email: senderEmail },
  to: [{ email: toEmail }],
  subject: '✅ Brevo Test — FreelanceOS Email Working!',
  htmlContent: `<div style="font-family:Arial;padding:20px;background:#ecfdf5;border-radius:12px;">
    <h2 style="color:#059669;">✅ Brevo API Working!</h2>
    <p>Email delivery confirmed via Brevo on ${new Date().toLocaleString()}</p>
  </div>`,
  textContent: 'Brevo email test successful!',
});

const data = Buffer.byteLength(payload);
const req = https.request({
  hostname: 'api.brevo.com',
  port: 443,
  path: '/v3/smtp/email',
  method: 'POST',
  headers: {
    'api-key': apiKey,
    'Content-Type': 'application/json',
    'Content-Length': data,
  },
}, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('\n✅ SUCCESS! Email sent via Brevo → Check inbox:', toEmail);
    } else {
      console.error('\n❌ FAILED:', body);
    }
  });
});
req.on('error', (e) => console.error('Network error:', e.message));
req.write(payload);
req.end();
