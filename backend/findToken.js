const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Invitation = require('./models/Invitation');

async function find() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const users = await User.find({ isVerified: false });
  console.log('--- Unverified Users ---');
  users.forEach(u => {
    console.log(`Email: ${u.email}, VerificationOTP: ${u.verificationOTP}`);
  });

  const resets = await User.find({ resetPasswordToken: { $ne: '' } });
  console.log('--- Reset Password Tokens ---');
  resets.forEach(u => {
    console.log(`Email: ${u.email}, ResetToken: ${u.resetPasswordToken}`);
  });

  const invites = await Invitation.find({ status: 'pending' });
  console.log('--- Pending Invitations ---');
  invites.forEach(i => {
    console.log(`Invitee: ${i.inviteeEmail}, Project: ${i.project}, Token: ${i.token}`);
  });

  await mongoose.disconnect();
}

find();
