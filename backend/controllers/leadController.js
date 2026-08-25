const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Conversation = require('../models/Conversation');
const { sendEmail } = require('../utils/emailUtil');

const sendProposalEmailHelper = async (lead, req) => {
  if (!lead.email) {
    throw new Error('Lead email is required to send proposal');
  }

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

const sendWelcomeEmailHelper = async (lead, req) => {
  if (!lead.email) return;

  const freelancerName = req.user.name || 'Freelancer';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
      <h2 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">Thank You for Connecting! 👋</h2>
      <p>Hi ${lead.name},</p>
      <p>Thank you for reaching out. We have successfully registered your interest and details in our system.</p>
      ${lead.requirements ? `<p style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 14px; color: #475569;"><strong>Your requirements:</strong><br/>${lead.requirements}</p>` : ''}
      <p>We are currently reviewing your details and will get in touch with you shortly to discuss next steps.</p>
      <p>Best regards,<br/><strong>${freelancerName}</strong></p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">Sent via FreelanceOS</p>
    </div>
  `;

  await sendEmail({
    to: lead.email,
    subject: `👋 Thank you for connecting - ${freelancerName}`,
    html: htmlContent,
    text: `Hi ${lead.name}, Thank you for connecting. We have received your requirements and will get in touch with you shortly.`,
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
    const lead = new Lead({
      ...req.body,
      budget: Number(req.body.budget || 0),
      createdBy: req.user._id,
    });

    await lead.save();

    let emailSent = false;
    if (lead.email) {
      try {
        if (lead.status === 'Proposal Sent') {
          await sendProposalEmailHelper(lead, req);
        } else {
          await sendWelcomeEmailHelper(lead, req);
        }
        emailSent = true;
      } catch (mailErr) {
        console.error('Failed to send lead email:', mailErr.message);
      } finally {
        await lead.save();
      }
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? 'Lead created successfully and email sent'
        : 'Lead created successfully, but email delivery failed or is not configured',
      lead,
      emailSent,
    });
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

    await lead.save();

    if (status === 'Proposal Sent' && oldStatus !== 'Proposal Sent') {
      try {
        await sendProposalEmailHelper(lead, req);
      } catch (mailErr) {
        console.error('Failed to send proposal email while updating lead:', mailErr.message);
      } finally {
        await lead.save();
      }
    }

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

    await lead.save();

    if (status === 'Proposal Sent' && oldStatus !== 'Proposal Sent') {
      try {
        await sendProposalEmailHelper(lead, req);
      } catch (mailErr) {
        console.error('Failed to send proposal email while updating status:', mailErr.message);
      } finally {
        await lead.save();
      }
    }

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

    if (lead.isConverted && lead.convertedClient) {
      return res.status(400).json({ success: false, message: 'Lead already converted' });
    }

    let client = await Client.findOne({ email: lead.email?.toLowerCase(), freelancer: req.user._id });
    if (!client) {
      client = await Client.create({
        freelancer: req.user._id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        notes: lead.requirements || '',
        totalProjectAmount: lead.budget || 0,
        allowLogin: true,
        isVerified: true,
      });
    }

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
    const host = req.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const frontendUrl = process.env.FRONTEND_URL || (isLocal ? 'http://localhost:5174' : 'http://localhost:5174');
    const isApiRequest = req.xhr || req.headers.accept?.includes('json') || req.method === 'POST';

    // Find lead by proposal token
    const lead = await Lead.findOne({
      proposalToken: token,
      proposalTokenExpires: { $gt: Date.now() },
    }).populate('createdBy', 'name email avatar');

    if (!lead) {
      if (isApiRequest) {
        return res.status(404).json({ success: false, message: 'Proposal link invalid or expired' });
      }
      return res.redirect(`${frontendUrl}/proposal-accepted?error=true`);
    }

    // Find or create Client record
    let client = null;
    if (lead.email) {
      client = await Client.findOne({
        email: lead.email.toLowerCase(),
        freelancer: lead.createdBy._id,
      });
    }

    if (!client) {
      client = await Client.create({
        freelancer: lead.createdBy._id,
        name: lead.name,
        email: lead.email ? lead.email.toLowerCase() : `client-${lead._id}@freelanceos.local`,
        phone: lead.phone || '',
        company: lead.company || '',
        notes: lead.requirements || '',
        totalProjectAmount: lead.budget || 0,
        allowLogin: true,
        isVerified: true,
      });
    }

    // Update lead status
    lead.proposalAccepted = true;
    lead.proposalAcceptedAt = lead.proposalAcceptedAt || new Date();
    lead.status = 'Negotiation';
    lead.convertedClient = client._id;
    await lead.save();

    // Find or create Conversation
    let conversation = await Conversation.findOne({
      freelancer: lead.createdBy._id,
      $or: [{ lead: lead._id }, { client: client._id }],
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { id: lead.createdBy._id, model: 'User' },
          { id: client._id, model: 'Client' },
        ],
        freelancer: lead.createdBy._id,
        client: client._id,
        lead: lead._id,
        context: {
          type: 'proposal',
          title: lead.requirements || lead.company || `${lead.name}'s Project`,
          budget: lead.budget || 0,
          status: 'Negotiation',
        },
        unreadCounts: { freelancer: 0, client: 0 },
      });
      await conversation.save();
    }

    // Generate JWT token for client so client can authenticate
    const clientToken = jwt.sign(
      { id: client._id, role: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Send email notification to freelancer (if not previously sent)
    try {
      const freelancerEmail = lead.createdBy.email;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ecfdf5;">
          <h2 style="color: #047857; border-bottom: 2px solid #a7f3d0; padding-bottom: 10px; margin-top: 0;">Proposal Accepted! 🎉</h2>
          <p>Hi ${lead.createdBy.name},</p>
          <p>Great news! <strong>${lead.name}</strong> from <strong>${lead.company || 'N/A'}</strong> has accepted your proposal.</p>
          <p>A direct conversation has been opened in your Messages workspace. You can now chat directly with your client.</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="${frontendUrl}/messages/${conversation._id}" style="background-color: #047857; color: white; padding: 12px 30px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Open Conversation</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">FreelanceOS Notifications</p>
        </div>
      `;

      await sendEmail({
        to: freelancerEmail,
        subject: `🎉 Proposal Accepted - ${lead.name}`,
        html: htmlContent,
        text: `Proposal accepted by ${lead.name}. Open conversation: ${frontendUrl}/messages/${conversation._id}`,
      });
    } catch (mailErr) {
      console.error('Failed to notify freelancer about accepted proposal:', mailErr.message);
    }

    // Notify via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(lead.createdBy._id.toString()).emit('notification', {
        title: 'Proposal Accepted 🎉',
        message: `${lead.name} accepted your proposal!`,
        leadId: lead._id,
        conversationId: conversation._id,
      });
    }

    if (isApiRequest) {
      return res.status(200).json({
        success: true,
        proposalStatus: 'Accepted',
        leadStatus: 'Negotiation',
        conversationId: conversation._id,
        clientToken,
        client: {
          id: client._id,
          name: client.name,
          email: client.email,
          company: client.company,
          role: 'client',
        },
      });
    }

    // Redirect to frontend Proposal Accepted / Chat page with tokens
    return res.redirect(
      `${frontendUrl}/proposal-accepted?name=${encodeURIComponent(lead.name)}&company=${encodeURIComponent(lead.company || '')}&freelancer=${encodeURIComponent(lead.createdBy.name || 'Freelancer')}&conversationId=${conversation._id}&clientToken=${encodeURIComponent(clientToken)}&clientId=${client._id}&leadId=${lead._id}`
    );

  } catch (err) {
    console.error('Accept proposal error:', err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (req.xhr || req.headers.accept?.includes('json') || req.method === 'POST') {
      return res.status(500).json({ success: false, message: 'Unable to accept proposal. Please try again.' });
    }
    return res.redirect(`${frontendUrl}/proposal-accepted?error=true`);
  }
};
