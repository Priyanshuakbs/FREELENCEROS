const Lead = require('../models/Lead');
const Client = require('../models/Client');
const { sendEmail } = require('../utils/emailUtil');

const sendProposalEmailHelper = async (lead, req) => {
  if (!lead.email) {
    throw new Error('Lead email is required to send proposal');
  }

  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  lead.proposalToken = token;
  lead.proposalTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  lead.proposalSentAt = new Date();

  const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  const acceptLink = `${backendUrl}/api/leads/accept-proposal/${token}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
      <h2 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">Business Proposal 🤝</h2>
      <p>Hi ${lead.name},</p>
      <p>We are excited to share our business proposal with you. Please review and accept it by clicking the button below:</p>
      <div style="margin: 25px 0; text-align: center;">
        <a href="${acceptLink}" style="background-color: #4f46e5; color: white; padding: 12px 30px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Accept Proposal</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser:</p>
      <p style="font-size: 12px; background-color: #f1f5f9; padding: 10px; border-radius: 6px; word-break: break-all; font-family: monospace;">${acceptLink}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">This link is valid for 24 hours. If you have any questions, please reply to this email.</p>
    </div>
  `;

  await sendEmail({
    to: lead.email,
    subject: '📋 Business Proposal - FreelanceOS',
    html: htmlContent,
    text: `Please review and accept our proposal here: ${acceptLink}`,
  });
};

// ── GET all leads ────────────────────────────────────────────────────────────
exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ createdBy: req.user._id })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: leads.length, leads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET single lead ──────────────────────────────────────────────────────────
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    res.status(200).json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CREATE lead ──────────────────────────────────────────────────────────────
exports.createLead = async (req, res) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      budget: Number(req.body.budget || 0),
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Lead created successfully', lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE lead ──────────────────────────────────────────────────────────────
exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const oldStatus = lead.status;
    const { status } = req.body;

    Object.assign(lead, { ...req.body, budget: Number(req.body.budget || lead.budget) });

    if (status === 'Proposal Sent' && oldStatus !== 'Proposal Sent') {
      await sendProposalEmailHelper(lead, req);
    }

    await lead.save();

    res.status(200).json({ success: true, message: 'Lead updated successfully', lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE lead ──────────────────────────────────────────────────────────────
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE status only ───────────────────────────────────────────────────────
exports.updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const lead = await Lead.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const oldStatus = lead.status;
    lead.status = status;

    if (status === 'Proposal Sent' && oldStatus !== 'Proposal Sent') {
      await sendProposalEmailHelper(lead, req);
    }

    await lead.save();

    res.status(200).json({ success: true, message: 'Status updated', lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADD note ─────────────────────────────────────────────────────────────────
exports.addLeadNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Note text is required' });

    const lead = await Lead.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    lead.notes.push({ text, addedBy: req.user._id });
    await lead.save();

    res.status(200).json({ success: true, message: 'Note added', notes: lead.notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CONVERT lead → client ────────────────────────────────────────────────────
exports.convertLeadToClient = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (lead.isConverted) {
      return res.status(400).json({ success: false, message: 'Lead already converted' });
    }

    const client = await Client.create({
      freelancer: req.user._id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      notes: lead.requirements || '',
      totalProjectAmount: lead.budget || 0,
    });

    lead.isConverted = true;
    lead.status = 'Converted';
    lead.convertedClient = client._id;
    await lead.save();

    res.status(201).json({ success: true, message: 'Lead converted to client', client, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ACCEPT proposal ──────────────────────────────────────────────────────────
exports.acceptProposal = async (req, res) => {
  try {
    const { token } = req.params;
    const lead = await Lead.findOne({
      proposalToken: token,
      proposalTokenExpires: { $gt: Date.now() },
    }).populate('createdBy', 'name email');

    if (!lead) {
      return res.status(404).send(`
        <html>
          <head>
            <title>Proposal Link Invalid</title>
            <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f8fafc; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; max-width: 400px; }
              h1 { color: #ef4444; margin-top: 0; }
              p { color: #475569; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Link Invalid or Expired</h1>
              <p>The proposal link is invalid, has expired, or has already been used.</p>
            </div>
          </body>
        </html>
      `);
    }

    if (lead.proposalAccepted) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Proposal Already Accepted</title>
            <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f8fafc; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; max-width: 400px; }
              h1 { color: #3b82f6; margin-top: 0; }
              p { color: #475569; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Already Accepted</h1>
              <p>This proposal was already accepted on ${new Date(lead.proposalAcceptedAt).toLocaleString()}.</p>
            </div>
          </body>
        </html>
      `);
    }

    lead.proposalAccepted = true;
    lead.proposalAcceptedAt = new Date();
    lead.status = 'Negotiation';
    await lead.save();

    // Send email to freelancer
    const freelancerEmail = lead.createdBy.email;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ecfdf5;">
        <h2 style="color: #047857; border-bottom: 2px solid #a7f3d0; padding-bottom: 10px; margin-top: 0;">Proposal Accepted! 🎉</h2>
        <p>Hi ${lead.createdBy.name},</p>
        <p>Great news! The lead <strong>${lead.name}</strong> from <strong>${lead.company || 'N/A'}</strong> has accepted your proposal.</p>
        <p>You can now proceed with negotiation or converting them to a client.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">FreelanceOS Notifications</p>
      </div>
    `;

    await sendEmail({
      to: freelancerEmail,
      subject: `🎉 Proposal Accepted - ${lead.name}`,
      html: htmlContent,
      text: `Proposal accepted by ${lead.name} from ${lead.company || 'N/A'}.`,
    });

    // Notify via Socket.io if available
    const io = req.app.get('io');
    if (io) {
      io.to(lead.createdBy._id.toString()).emit('notification', {
        title: 'Proposal Accepted',
        message: `${lead.name} has accepted your proposal!`,
        leadId: lead._id,
      });
    }

    res.status(200).send(`
      <html>
        <head>
          <title>Proposal Accepted</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #ecfdf5; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; max-width: 400px; border: 1px solid #a7f3d0; }
            h1 { color: #059669; margin-top: 0; }
            p { color: #374151; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Thank You!</h1>
            <p>You have successfully accepted the proposal. The freelancer has been notified, and we will get back to you soon.</p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`
      <html>
        <head>
          <title>Server Error</title>
        </head>
        <body>
          <h1>Internal Server Error</h1>
          <p>${err.message}</p>
        </body>
      </html>
    `);
  }
};