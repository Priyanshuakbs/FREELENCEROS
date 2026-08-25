require('dotenv').config();
const { sendEmail } = require('./utils/emailUtil');

const testTo = 'rpriyanshu1902@gmail.com';
const testOTP = '847392'; // Sample OTP

sendEmail({
  to: testTo,
  subject: '📧 Verify Your Email - FreelanceOS',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf5ff;">
      <h2 style="color: #6366f1; border-bottom: 2px solid #e9d5ff; padding-bottom: 10px; margin-top: 0;">Welcome to FreelanceOS! 💼</h2>
      <p>Hi <strong>Priyanshu</strong>,</p>
      <p>Thank you for creating an account on FreelanceOS. Please verify your email using the OTP below:</p>
      <div style="margin: 25px 0; text-align: center;">
        <span style="background-color: #6366f1; color: white; padding: 12px 30px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; display: inline-block;">${testOTP}</span>
      </div>
      <p style="font-size: 13px; color: #64748b;">Enter this 6-digit code on the verification screen to activate your account.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">This code is valid for 15 minutes. If you did not sign up for FreelanceOS, please ignore this email.</p>
    </div>
  `,
  text: `Welcome to FreelanceOS! Your email verification code is: ${testOTP}`,
}).then(result => {
  console.log('✅ OTP Email Sent! MessageId:', result.messageId, '| Method:', result.method);
}).catch(err => {
  console.error('❌ OTP Email FAILED:', err.message);
  process.exit(1);
});
