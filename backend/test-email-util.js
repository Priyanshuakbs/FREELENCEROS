const { sendEmail } = require('./utils/emailUtil');
require('dotenv').config();

const send = async () => {
  try {
    console.log('Sending test email using original emailUtil...');
    const result = await sendEmail({
      to: process.env.SMTP_USER,
      subject: 'Test Email Util',
      html: '<p>Testing emailUtil.js functionality</p>',
      text: 'Testing emailUtil.js functionality'
    });
    console.log('Success:', result);
  } catch (error) {
    console.error('Failed to send:', error);
  }
};

send();
