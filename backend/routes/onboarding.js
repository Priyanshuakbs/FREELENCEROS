const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Client = require('../models/Client');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { protect, adminOnly } = require('../middleware/auth');

// In-memory token store (for development — use Redis in production)
const onboardingTokens = {};

// ─── Admin: Generate a unique onboarding link ─────────────────────────────
router.post('/generate-link', protect, adminOnly, async (req, res) => {
  try {
    const token = crypto.randomBytes(20).toString('hex');
    const link = `${process.env.FRONTEND_URL}/onboarding/${token}`;

    onboardingTokens[token] = {
      freelancer: req.user._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.json({ link, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Public: Validate onboarding token ───────────────────────────────────
router.get('/validate/:token', async (req, res) => {
  try {
    const data = onboardingTokens[req.params.token];
    if (!data || Date.now() > data.expiresAt) {
      return res.status(400).json({ message: 'Link is invalid or has expired' });
    }
    const freelancer = await User.findById(data.freelancer).select('name');
    res.json({ valid: true, freelancerName: freelancer ? freelancer.name : 'our team' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Public: Submit onboarding form ──────────────────────────────────────
router.post('/submit/:token', async (req, res) => {
  try {
    const data = onboardingTokens[req.params.token];
    if (!data || Date.now() > data.expiresAt) {
      return res.status(400).json({ message: 'Link is invalid or has expired' });
    }

    const { name, email, phone, company, requirements, budgetRange } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if client already exists (avoid duplicates)
    const existing = await Client.findOne({ email, freelancer: data.freelancer });
    if (existing) {
      return res.status(409).json({ message: 'A client with this email already exists' });
    }

    const client = await Client.create({
      name,
      email,
      phone: phone || '',
      company: company || '',
      notes: `Requirements: ${requirements || 'N/A'}\nBudget: ${budgetRange || 'Not specified'}`,
      freelancer: data.freelancer,
    });

    // Invalidate token after use
    delete onboardingTokens[req.params.token];

    // Notify admin via email
    try {
      const admin = await User.findById(data.freelancer);
      if (admin && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 587,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: `"FreelanceOS" <${process.env.SMTP_USER}>`,
          to: admin.email,
          subject: `🎉 New Client Onboarded: ${name}`,
          html: `
            <div style="font-family:Arial,sans-serif;padding:20px;max-width:500px;">
              <h2 style="color:#4f46e5;">New Client via Onboarding Form</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Company:</strong> ${company || 'N/A'}</p>
              <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
              <p><strong>Requirements:</strong> ${requirements || 'N/A'}</p>
              <p><strong>Budget Range:</strong> ${budgetRange || 'Not specified'}</p>
              <hr/>
              <p style="color:#888;font-size:12px;">Auto-created by FreelanceOS Onboarding</p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.log('Email notification failed (non-critical):', emailErr.message);
    }

    res.status(201).json({ message: 'Thank you! Your details have been submitted. We will be in touch soon.', clientId: client._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
