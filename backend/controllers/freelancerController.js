const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// ── GET all public freelancers for Directory / Discovery ──────────────────
exports.getFreelancersDirectory = async (req, res) => {
  try {
    const { search, skill } = req.query;
    let query = { isVerified: true };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { title: regex },
        { company: regex },
        { bio: regex },
        { skills: regex },
        { services: regex },
      ];
    }

    if (skill && skill.trim()) {
      query.skills = { $regex: new RegExp(`^${skill.trim()}$`, 'i') };
    }

    const freelancers = await User.find(query)
      .select('_id name username title company avatar bio location website linkedin github skills services experience portfolioProjects createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: freelancers.length,
      freelancers,
    });
  } catch (err) {
    console.error('getFreelancersDirectory error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET public freelancer portfolio profile (No Auth Required) ──────────────
exports.getPublicFreelancerProfile = async (req, res) => {
  try {
    const { identifier } = req.params;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query = { _id: identifier };
    } else {
      query = { username: identifier.toLowerCase() };
    }

    const user = await User.findOne(query).select(
      '_id name username title company avatar bio location website linkedin github portfolio skills services experience portfolioProjects createdAt'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'Freelancer not found' });
    }

    // Get public-safe project showcases created by this freelancer
    // Strip client, budget, invoices, tasks, internal files
    const projects = await Project.find({
      freelancer: user._id,
      isArchived: { $ne: true },
    }).select('title description tags createdAt files');

    const sanitizedProjects = projects.map((p) => {
      const imageFiles = (p.files || [])
        .filter((f) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f.url || ''))
        .map((f) => f.url);

      return {
        _id: p._id,
        title: p.title,
        description: p.description,
        tags: p.tags || [],
        imageUrl: imageFiles[0] || '',
        createdAt: p.createdAt,
      };
    });

    res.json({
      success: true,
      profile: {
        _id: user._id,
        name: user.name,
        username: user.username || user._id,
        title: user.title,
        company: user.company,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        linkedin: user.linkedin,
        github: user.github,
        portfolio: user.portfolio,
        skills: user.skills || [],
        services: user.services || [],
        experience: user.experience || '',
        portfolioProjects: user.portfolioProjects || [],
        showcaseProjects: sanitizedProjects,
      },
    });
  } catch (err) {
    console.error('getPublicFreelancerProfile error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CONTACT freelancer from portfolio (Auth Required) ────────────────────────
exports.contactFreelancer = async (req, res) => {
  try {
    const { id: freelancerId } = req.params;
    const { message, projectTitle } = req.body;

    const freelancer = await User.findById(freelancerId);
    if (!freelancer) {
      return res.status(404).json({ success: false, message: 'Freelancer not found' });
    }

    // Determine caller entity (Client or User)
    let clientId = null;
    let senderId = null;
    let senderModel = 'User';

    if (req.client) {
      clientId = req.client._id;
      senderId = req.client._id;
      senderModel = 'Client';
    } else if (req.user) {
      senderId = req.user._id;
      senderModel = 'User';
      // If the freelancer is contacting themselves
      if (req.user._id.toString() === freelancerId) {
        return res.status(400).json({ success: false, message: 'You cannot contact yourself' });
      }
    } else {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Find or create conversation
    let query = { freelancer: freelancerId };
    if (clientId) {
      query.client = clientId;
    } else {
      query.participants = { $all: [{ $elemMatch: { id: senderId } }, { $elemMatch: { id: freelancerId } }] };
    }

    let conversation = await Conversation.findOne(query);

    if (!conversation) {
      const participants = [
        { id: freelancerId, model: 'User' },
      ];
      if (clientId) {
        participants.push({ id: clientId, model: 'Client' });
      } else {
        participants.push({ id: senderId, model: 'User' });
      }

      conversation = new Conversation({
        participants,
        freelancer: freelancerId,
        client: clientId || undefined,
        context: {
          type: 'portfolio',
          title: projectTitle || 'Portfolio Inquiry',
          status: 'Active',
        },
        unreadCounts: { freelancer: 0, client: 0 },
      });

      await conversation.save();
    }

    // If initial message supplied
    if (message && message.trim()) {
      const text = message.trim();
      const newMsg = await Message.create({
        conversation: conversation._id,
        sender: senderId,
        senderModel,
        receiver: freelancerId,
        receiverModel: 'User',
        text,
      });

      conversation.lastMessage = text;
      conversation.lastMessageSender = senderId;
      conversation.lastMessageSenderModel = senderModel;
      conversation.lastMessageAt = new Date();
      conversation.unreadCounts.freelancer = (conversation.unreadCounts.freelancer || 0) + 1;
      await conversation.save();

      // Emit socket notification
      const io = req.app.get('io');
      if (io) {
        io.to(freelancerId.toString()).emit('new-message', {
          message: newMsg,
          conversationId: conversation._id,
        });
      }
    }

    res.status(200).json({
      success: true,
      conversationId: conversation._id,
      conversation,
    });
  } catch (err) {
    console.error('contactFreelancer error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
