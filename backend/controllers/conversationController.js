const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Client = require('../models/Client');

// Helper to determine current authenticated entity
const getAuthEntity = (req) => {
  if (req.user) {
    return { id: req.user._id, model: 'User', role: 'freelancer', user: req.user };
  }
  if (req.client) {
    return { id: req.client._id, model: 'Client', role: 'client', client: req.client };
  }
  return null;
};

// ── GET all conversations ────────────────────────────────────────────────────
exports.getConversations = async (req, res) => {
  try {
    const auth = getAuthEntity(req);
    if (!auth) return res.status(401).json({ message: 'Unauthorized' });

    let filter = {};
    if (auth.model === 'User') {
      filter = { freelancer: auth.id };
    } else {
      filter = { client: auth.id };
    }

    const conversations = await Conversation.find(filter)
      .populate('freelancer', 'name email avatar title username company')
      .populate('client', 'name email company phone')
      .populate('lead', 'name email company budget status requirements')
      .populate('project', 'title status budget')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, count: conversations.length, conversations });
  } catch (err) {
    console.error('getConversations error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET single conversation ──────────────────────────────────────────────────
exports.getConversation = async (req, res) => {
  try {
    const auth = getAuthEntity(req);
    if (!auth) return res.status(401).json({ message: 'Unauthorized' });

    const conversation = await Conversation.findById(req.params.id)
      .populate('freelancer', 'name email avatar title username company location website linkedin github bio skills services')
      .populate('client', 'name email company phone')
      .populate('lead', 'name email company budget status requirements')
      .populate('project', 'title status budget');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Check authorization
    const isFreelancer = conversation.freelancer?._id?.toString() === auth.id.toString();
    const isClient = conversation.client?._id?.toString() === auth.id.toString();

    if (!isFreelancer && !isClient) {
      return res.status(403).json({ success: false, message: 'Access denied to this conversation' });
    }

    res.json({ success: true, conversation });
  } catch (err) {
    console.error('getConversation error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CREATE / GET conversation ────────────────────────────────────────────────
exports.createOrGetConversation = async (req, res) => {
  try {
    const auth = getAuthEntity(req);
    if (!auth) return res.status(401).json({ message: 'Unauthorized' });

    let { freelancerId, clientId, leadId, projectId, context, initialMessage } = req.body;

    if (auth.model === 'User') {
      freelancerId = auth.id;
    } else if (auth.model === 'Client') {
      clientId = auth.id;
    }

    if (!freelancerId) {
      return res.status(400).json({ success: false, message: 'Freelancer ID is required' });
    }

    // If no clientId provided but leadId is present, check if lead has client
    if (!clientId && leadId) {
      const Lead = require('../models/Lead');
      const lead = await Lead.findById(leadId);
      if (lead && lead.convertedClient) {
        clientId = lead.convertedClient;
      }
    }

    // Build query to prevent duplicate conversations
    let query = { freelancer: freelancerId };
    if (leadId) {
      query.lead = leadId;
    } else if (projectId) {
      query.project = projectId;
    } else if (clientId) {
      query.client = clientId;
    }

    let conversation = await Conversation.findOne(query)
      .populate('freelancer', 'name email avatar title username company')
      .populate('client', 'name email company phone')
      .populate('lead', 'name email company budget status requirements')
      .populate('project', 'title status budget');

    if (!conversation) {
      const participants = [
        { id: freelancerId, model: 'User' },
      ];
      if (clientId) {
        participants.push({ id: clientId, model: 'Client' });
      }

      conversation = new Conversation({
        participants,
        freelancer: freelancerId,
        client: clientId || undefined,
        lead: leadId || undefined,
        project: projectId || undefined,
        context: context || { type: leadId ? 'proposal' : projectId ? 'project' : 'direct' },
        unreadCounts: { freelancer: 0, client: 0 },
      });

      await conversation.save();

      conversation = await Conversation.findById(conversation._id)
        .populate('freelancer', 'name email avatar title username company')
        .populate('client', 'name email company phone')
        .populate('lead', 'name email company budget status requirements')
        .populate('project', 'title status budget');
    }

    // If initial message provided
    if (initialMessage && initialMessage.trim()) {
      const senderModel = auth.model;
      const receiver = senderModel === 'User' ? conversation.client?._id : conversation.freelancer?._id;
      const receiverModel = senderModel === 'User' ? 'Client' : 'User';

      const message = await Message.create({
        conversation: conversation._id,
        sender: auth.id,
        senderModel,
        receiver,
        receiverModel,
        text: initialMessage.trim(),
      });

      conversation.lastMessage = initialMessage.trim();
      conversation.lastMessageSender = auth.id;
      conversation.lastMessageSenderModel = senderModel;
      conversation.lastMessageAt = new Date();
      if (senderModel === 'User') {
        conversation.unreadCounts.client = (conversation.unreadCounts.client || 0) + 1;
      } else {
        conversation.unreadCounts.freelancer = (conversation.unreadCounts.freelancer || 0) + 1;
      }
      await conversation.save();

      // Emit socket event if io is available
      const io = req.app.get('io');
      if (io && receiver) {
        io.to(receiver.toString()).emit('new-message', { message, conversationId: conversation._id });
        io.to(receiver.toString()).emit('conversation-updated', conversation);
      }
    }

    res.status(200).json({ success: true, conversation });
  } catch (err) {
    console.error('createOrGetConversation error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET messages for a conversation ──────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const auth = getAuthEntity(req);
    if (!auth) return res.status(401).json({ message: 'Unauthorized' });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isFreelancer = conversation.freelancer?.toString() === auth.id.toString();
    const isClient = conversation.client?.toString() === auth.id.toString();
    if (!isFreelancer && !isClient) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name avatar role company')
      .sort({ createdAt: 1 });

    res.json({ success: true, count: messages.length, messages });
  } catch (err) {
    console.error('getMessages error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── SEND message ─────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const auth = getAuthEntity(req);
    if (!auth) return res.status(401).json({ message: 'Unauthorized' });

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isFreelancer = conversation.freelancer?.toString() === auth.id.toString();
    const isClient = conversation.client?.toString() === auth.id.toString();
    if (!isFreelancer && !isClient) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const senderModel = auth.model;
    let receiver = null;
    let receiverModel = null;

    if (isFreelancer) {
      receiver = conversation.client;
      receiverModel = 'Client';
    } else {
      receiver = conversation.freelancer;
      receiverModel = 'User';
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: auth.id,
      senderModel,
      receiver,
      receiverModel,
      text: text.trim(),
      read: false,
    });

    // Update conversation summary
    conversation.lastMessage = text.trim();
    conversation.lastMessageSender = auth.id;
    conversation.lastMessageSenderModel = senderModel;
    conversation.lastMessageAt = new Date();

    if (isFreelancer) {
      conversation.unreadCounts.client = (conversation.unreadCounts.client || 0) + 1;
    } else {
      conversation.unreadCounts.freelancer = (conversation.unreadCounts.freelancer || 0) + 1;
    }
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar role company');

    // Emit Socket.IO events
    const io = req.app.get('io');
    if (io) {
      // Send to conversation room
      io.to(`conversation-${conversation._id}`).emit('chat-message', populatedMessage);

      // Notify receiver directly in their personal room
      if (receiver) {
        io.to(receiver.toString()).emit('new-message', {
          message: populatedMessage,
          conversationId: conversation._id,
        });
        io.to(receiver.toString()).emit('conversation-updated', {
          conversationId: conversation._id,
          lastMessage: text.trim(),
          lastMessageAt: conversation.lastMessageAt,
          unreadCounts: conversation.unreadCounts,
        });
      }
    }

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (err) {
    console.error('sendMessage error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── MARK messages as read ────────────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    const auth = getAuthEntity(req);
    if (!auth) return res.status(401).json({ message: 'Unauthorized' });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isFreelancer = conversation.freelancer?.toString() === auth.id.toString();
    const isClient = conversation.client?.toString() === auth.id.toString();

    if (!isFreelancer && !isClient) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (isFreelancer) {
      conversation.unreadCounts.freelancer = 0;
    } else {
      conversation.unreadCounts.client = 0;
    }
    await conversation.save();

    // Mark messages sent to this user as read
    await Message.updateMany(
      { conversation: conversation._id, receiver: auth.id, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    console.error('markAsRead error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET total unread message count ───────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const auth = getAuthEntity(req);
    if (!auth) return res.status(401).json({ message: 'Unauthorized' });

    let filter = {};
    if (auth.model === 'User') {
      filter = { freelancer: auth.id };
    } else {
      filter = { client: auth.id };
    }

    const conversations = await Conversation.find(filter);
    let totalUnread = 0;

    for (const c of conversations) {
      if (auth.model === 'User') {
        totalUnread += Number(c.unreadCounts?.freelancer || 0);
      } else {
        totalUnread += Number(c.unreadCounts?.client || 0);
      }
    }

    res.json({ success: true, unreadCount: totalUnread });
  } catch (err) {
    console.error('getUnreadCount error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
