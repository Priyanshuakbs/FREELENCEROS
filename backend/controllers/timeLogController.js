const TimeLog = require('../models/TimeLog');
const Project = require('../models/Project');
const Client = require('../models/Client');

exports.getLogs = async (req, res) => {
  try {
    let query = {};
    const role = req.user.role || 'admin';
    if (role === 'admin') {
      const projects = await Project.find({ freelancer: req.user._id });
      const projectIds = projects.map(p => p._id);
      query = {
        $or: [
          { freelancer: req.user._id },
          { project: { $in: projectIds } }
        ]
      };
    } else {
      query = { freelancer: req.user._id };
    }
    const logs = await TimeLog.find(query)
      .populate('project', 'title')
      .sort({ createdAt: -1 });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createLog = async (req, res) => {
  try {
    const { project, description, duration, hourlyRate, date } = req.body;

    let query = { _id: project };
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

    const projectDoc = await Project.findOne(query);
    if (!projectDoc) return res.status(404).json({ message: 'Project not found or access denied' });

    const log = await TimeLog.create({
      project, description, duration, hourlyRate: hourlyRate || 0, date,
      freelancer: req.user._id,
    });

    const populatedLog = await TimeLog.findById(log._id).populate('project', 'title');
    res.status(201).json({ log: populatedLog });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteLog = async (req, res) => {
  try {
    let log;
    const role = req.user.role || 'admin';
    if (role === 'admin') {
      const projects = await Project.find({ freelancer: req.user._id });
      const projectIds = projects.map(p => p._id);
      log = await TimeLog.findOneAndDelete({
        _id: req.params.id,
        $or: [
          { freelancer: req.user._id },
          { project: { $in: projectIds } }
        ]
      });
    } else {
      log = await TimeLog.findOneAndDelete({ _id: req.params.id, freelancer: req.user._id });
    }
    if (!log) return res.status(404).json({ message: 'Log not found or access denied' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};