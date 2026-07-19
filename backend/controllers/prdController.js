const ProjectPRD = require('../models/ProjectPRD');
const Project = require('../models/Project');
const Client = require('../models/Client');

exports.getPRD = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Validate access
    if (req.user) {
      const isFreelancer = project.freelancer.toString() === req.user._id.toString();
      const isCollaborator = project.collaborators.some(c => c.toString() === req.user._id.toString());
      if (!isFreelancer && !isCollaborator) {
        return res.status(403).json({ message: 'Access denied to this project PRD' });
      }
    } else if (req.client) {
      if (!project.client || project.client.toString() !== req.client._id.toString()) {
        return res.status(403).json({ message: 'Access denied to this project PRD' });
      }
    } else {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const prd = await ProjectPRD.findOne({ project: project._id }).sort({ version: -1 })
      .populate('createdBy', 'name email')
      .populate('acceptedBy', 'name email');

    res.json({ prd });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createOrUpdatePRD = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'PRD content is required' });

    const project = await Project.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const latest = await ProjectPRD.findOne({ project: project._id }).sort({ version: -1 });

    let prd;
    if (!latest) {
      // First version
      prd = await ProjectPRD.create({
        project: project._id,
        version: 1,
        content,
        createdBy: req.user._id,
        status: 'pending_acceptance'
      });
    } else if (latest.status === 'accepted') {
      // Create new version requiring re-acceptance
      prd = await ProjectPRD.create({
        project: project._id,
        version: latest.version + 1,
        content,
        createdBy: req.user._id,
        status: 'pending_acceptance',
        acceptedBy: null,
        acceptedAt: null,
        acceptedIp: null
      });
    } else {
      // Update the unaccepted version in place
      latest.content = content;
      latest.createdBy = req.user._id;
      latest.status = 'pending_acceptance';
      latest.acceptedBy = null;
      latest.acceptedAt = null;
      latest.acceptedIp = null;
      prd = await latest.save();
    }

    const populated = await ProjectPRD.findById(prd._id)
      .populate('createdBy', 'name email')
      .populate('acceptedBy', 'name email');

    res.status(201).json({ prd: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptPRD = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, client: req.client._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const prd = await ProjectPRD.findOne({ project: project._id }).sort({ version: -1 });
    if (!prd) return res.status(404).json({ message: 'No PRD found for this project' });

    if (prd.status === 'accepted') {
      return res.status(400).json({ message: 'This PRD has already been accepted.' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    prd.status = 'accepted';
    prd.acceptedBy = req.client._id;
    prd.acceptedAt = new Date();
    prd.acceptedIp = ip;
    await prd.save();

    const populated = await ProjectPRD.findById(prd._id)
      .populate('createdBy', 'name email')
      .populate('acceptedBy', 'name email');

    res.json({ prd: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
