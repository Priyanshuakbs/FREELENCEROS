const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid' });
  }
};

exports.adminOnly = (req, res, next) => {
  const role = req.user?.role || 'admin';
  if (req.user && role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied: Admin role required' });
  }
};

exports.clientProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized as client' });

  const Client = require('../models/Client');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'client') {
      return res.status(401).json({ message: 'Not authorized as client' });
    }
    const client = await Client.findById(decoded.id).select('-password');
    if (!client || client.isArchived) {
      return res.status(401).json({ message: 'Client account not found or archived' });
    }
    req.client = client;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid' });
  }
};

exports.eitherProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  const User = require('../models/User');
  const Client = require('../models/Client');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'client') {
      const client = await Client.findById(decoded.id).select('-password');
      if (client && !client.isArchived) {
        req.client = client;
        return next();
      }
    } else {
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }
    return res.status(401).json({ message: 'Not authorized' });
  } catch {
    return res.status(401).json({ message: 'Token invalid' });
  }
};