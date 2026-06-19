const Project = require('../models/Project');
const User = require('../models/User');
const Client = require('../models/Client');
const Invitation = require('../models/Invitation');
const Message = require('../models/Message');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailUtil');

const findProjectForTaskAccess = async (projectId, user) => {
  let query = { _id: projectId };
  const role = user.role || 'admin';
  if (role === 'admin') {
    query.$or = [
      { freelancer: user._id },
      { collaborators: user._id }
    ];
  } else {
    const clientDocs = await Client.find({ user: user._id });
    const clientIds = clientDocs.map(c => c._id);
    query.$or = [
      { client: { $in: clientIds } },
      { collaborators: user._id }
    ];
  }
  return await Project.findOne(query);
};

exports.getProjects = async (req, res) => {
  try {
    let query = {};
    const role = req.user.role || 'admin';
    if (role === 'admin') {
      query = {
        $or: [
          { freelancer: req.user._id },
          { collaborators: req.user._id }
        ]
      };
    } else {
      const clientDocs = await Client.find({ user: req.user._id });
      const clientIds = clientDocs.map(c => c._id);
      query = {
        $or: [
          { client: { $in: clientIds } },
          { collaborators: req.user._id }
        ]
      };
    }

    const projects = await Project.find(query)
      .populate('client', 'name email')
      .populate('collaborators', 'name email');
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { title, description, client, budget, deadline, status } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });
    const project = await Project.create({
      title, description, client, budget, deadline, status,
      freelancer: req.user._id,
    });
    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, freelancer: req.user._id },
      req.body,
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      freelancer: req.user._id,
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addTask = async (req, res) => {
  try {
    const project = await findProjectForTaskAccess(req.params.id, req.user);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.tasks.push({ title: req.body.title });
    await project.save();
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.moveTask = async (req, res) => {
  try {
    const project = await findProjectForTaskAccess(req.params.id, req.user);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const task = project.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.status = req.body.status;
    task.completed = req.body.status === 'done';
    await project.save();
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const project = await findProjectForTaskAccess(req.params.id, req.user);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.tasks.pull(req.params.taskId);
    await project.save();
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    const role = req.user.role || 'admin';
    if (role === 'admin') {
      query.$or = [
        { freelancer: req.user._id },
        { collaborators: req.user._id }
      ];
    } else {
      const clientDocs = await Client.find({ user: req.user._id });
      const clientIds = clientDocs.map(c => c._id);
      query.$or = [
        { client: { $in: clientIds } },
        { collaborators: req.user._id }
      ];
    }

    const project = await Project.findOne(query)
      .populate('client', 'name email phone company address')
      .populate('collaborators', 'name email')
      .populate('files.uploadedBy', 'name role');
    if (!project) return res.status(404).json({ message: 'Not found' });

    // Aggregate financials securely from Invoices
    const Invoice = require('../models/Invoice');
    const invoices = await Invoice.find({ project: project._id });
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);

    res.json({
      project,
      billing: { totalBilled, totalPaid }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleTask = async (req, res) => {
  try {
    const project = await findProjectForTaskAccess(req.params.id, req.user);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const task = project.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.completed = !task.completed;
    await project.save();
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateShareToken = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.shareToken) {
      project.shareToken = crypto.randomBytes(32).toString('hex');
      await project.save();
    }

    res.json({ shareToken: project.shareToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicProject = async (req, res) => {
  try {
    const project = await Project.findOne({ shareToken: req.params.token })
      .populate('client', 'name company')
      .populate('freelancer', 'name');

    if (!project) return res.status(404).json({ message: 'Public project portal not found' });

    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.inviteCollaborator = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const project = await Project.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (invitee && project.collaborators.includes(invitee._id)) {
      return res.status(400).json({ message: 'User is already a collaborator on this project.' });
    }
    if (invitee && invitee._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot invite yourself as a collaborator.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await Invitation.create({
      project: project._id,
      inviter: req.user._id,
      inviteeEmail: email.toLowerCase(),
      token,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/accept-invite/${token}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f5f3ff;">
        <h2 style="color: #6d28d9; border-bottom: 2px solid #ddd6fe; padding-bottom: 10px; margin-top: 0;">Project Collaboration Invitation 🤝</h2>
        <p>Hi there,</p>
        <p><strong>${req.user.name}</strong> has invited you to collaborate on the project <strong>"${project.title}"</strong> on FreelanceOS.</p>
        <p>Click the button below to accept the invitation and start collaborating:</p>
        <div style="margin: 25px 0; text-align: center;">
          <a href="${inviteLink}" style="background-color: #7c3aed; color: white; padding: 12px 30px; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.4); display: inline-block;">Accept Collaboration Invite</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser:</p>
        <p style="font-size: 12px; background-color: #f1f5f9; padding: 10px; border-radius: 6px; word-break: break-all; font-family: monospace;">${inviteLink}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">This link is valid for 7 days. If you were not expecting this invite, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: `🤝 Collaborate on project "${project.title}" - FreelanceOS`,
      html: htmlContent,
      text: `${req.user.name} invited you to collaborate on "${project.title}". Accept here: ${inviteLink}`
    });

    res.json({ message: 'Collaboration invitation sent successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await Invitation.findOne({ token });
    if (!invite) return res.status(404).json({ message: 'Invitation token is invalid or has expired.' });

    if (invite.status !== 'pending') {
      return res.status(400).json({ message: `This invitation has already been ${invite.status}.` });
    }

    const collaboratorId = req.user._id;

    if (req.user.email.toLowerCase() !== invite.inviteeEmail.toLowerCase()) {
      return res.status(403).json({ message: 'This invitation was sent to a different email address.' });
    }

    const project = await Project.findById(invite.project);
    if (!project) {
      invite.status = 'rejected';
      await invite.save();
      return res.status(404).json({ message: 'Project no longer exists.' });
    }

    if (!project.collaborators.includes(collaboratorId)) {
      project.collaborators.push(collaboratorId);
      await project.save();
    }

    invite.status = 'accepted';
    await invite.save();

    res.json({ message: 'Invitation accepted! You are now a collaborator.', projectId: project._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeCollaborator = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const project = await Project.findOne({ _id: id, freelancer: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.collaborators = project.collaborators.filter(c => c.toString() !== userId.toString());
    await project.save();
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingInvitations = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { freelancer: req.user._id },
        { collaborators: req.user._id }
      ]
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const invitations = await Invitation.find({
      project: project._id,
      status: 'pending'
    }).select('inviteeEmail createdAt');

    res.json({ invitations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelInvitation = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const invite = await Invitation.findOneAndDelete({
      _id: req.params.inviteId,
      project: project._id,
      status: 'pending'
    });
    if (!invite) return res.status(404).json({ message: 'Invitation not found or already processed' });

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyPendingInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      inviteeEmail: req.user.email.toLowerCase(),
      status: 'pending'
    })
    .populate('project', 'title')
    .populate('inviter', 'name email');

    res.json({ invitations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await Invitation.findOne({ token });
    if (!invite) return res.status(404).json({ message: 'Invitation token is invalid or has expired.' });

    if (invite.status !== 'pending') {
      return res.status(400).json({ message: `This invitation has already been ${invite.status}.` });
    }

    if (req.user.email.toLowerCase() !== invite.inviteeEmail.toLowerCase()) {
      return res.status(403).json({ message: 'This invitation was sent to a different email address.' });
    }

    invite.status = 'rejected';
    await invite.save();

    res.json({ message: 'Invitation declined successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const project = await findProjectForTaskAccess(req.params.id, req.user);
    if (!project) return res.status(404).json({ message: 'Project not found or access denied' });

    const messages = await Message.find({ project: project._id })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message text required' });

    const project = await findProjectForTaskAccess(req.params.id, req.user);
    if (!project) return res.status(404).json({ message: 'Project not found or access denied' });

    const message = await Message.create({
      project: project._id,
      sender: req.user._id,
      text
    });

    const populated = await Message.findById(message._id).populate('sender', 'name role');
    res.status(201).json({ message: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    const project = await findProjectForTaskAccess(req.params.id, req.user);
    if (!project) return res.status(404).json({ message: 'Project not found or access denied' });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const newFile = {
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id,
      size: req.file.size
    };

    project.files.push(newFile);
    await project.save();

    const populated = await Project.findById(project._id)
      .populate('client', 'name email phone company address')
      .populate('collaborators', 'name email')
      .populate('files.uploadedBy', 'name role');

    res.status(201).json({ project: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const project = await findProjectForTaskAccess(req.params.id, req.user);
    if (!project) return res.status(404).json({ message: 'Project not found or access denied' });

    const file = project.files.id(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const isOwner = project.freelancer.toString() === req.user._id.toString();
    const isUploader = file.uploadedBy && file.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isUploader && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to delete this file.' });
    }

    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', file.url);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to delete physical file:', err.message);
      }
    }

    project.files.pull(req.params.fileId);
    await project.save();

    const populated = await Project.findById(project._id)
      .populate('client', 'name email phone company address')
      .populate('collaborators', 'name email')
      .populate('files.uploadedBy', 'name role');

    res.json({ project: populated, message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};