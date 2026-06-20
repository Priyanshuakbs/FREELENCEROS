const Client = require('../models/Client');
const User = require('../models/User');

exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find({ freelancer: req.user._id })
      .populate('user')
      .populate('payments.recordedBy', 'name avatar');

    const normalizedClients = clients.map((client) => {
      const amountPaid = Number(client.payments?.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) || client.amountPaid || 0);
      const totalProjectAmount = Number(client.totalProjectAmount || 0);
      const remainingAmount = Math.max(0, totalProjectAmount - amountPaid);
      const paymentStatus = remainingAmount === 0 && totalProjectAmount > 0
        ? 'paid'
        : amountPaid > 0
          ? 'partial'
          : 'pending';

      return {
        ...client.toObject(),
        amountPaid,
        remainingAmount,
        paymentStatus,
      };
    });

    res.json({ clients: normalizedClients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createClient = async (req, res) => {
  try {
    const { name, email, phone, company, address, allowLogin, password, notes, tags, totalProjectAmount } = req.body;
    if (!name || !email)
      return res.status(400).json({ message: 'Name and email required' });

    let userId = null;
    if (allowLogin) {
      if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      const emailLower = email.toLowerCase();
      let existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }

      const user = await User.create({
        name,
        email: emailLower,
        password,
        role: 'user',
        isVerified: true
      });
      userId = user._id;
    }

    const client = await Client.create({
      name, email, phone, company, address,
      notes: notes || '',
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' && tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      totalProjectAmount: Number(totalProjectAmount) || 0,
      amountPaid: 0,
      remainingAmount: Number(totalProjectAmount) || 0,
      paymentStatus: Number(totalProjectAmount) > 0 ? 'pending' : 'pending',
      freelancer: req.user._id,
      user: userId
    });

    const populatedClient = await Client.findById(client._id).populate('user');
    res.status(201).json({ client: populatedClient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { name, email, phone, company, address, allowLogin, password, notes, tags, totalProjectAmount } = req.body;

    let client = await Client.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    let userId = client.user;

    if (allowLogin) {
      const emailLower = email.toLowerCase();
      if (userId) {
        // User already exists, update their profile
        const user = await User.findById(userId);
        if (user) {
          user.name = name;
          user.email = emailLower;
          if (password) {
            user.password = password;
          }
          await user.save();
        }
      } else {
        // Create new user account for this client
        if (!password || password.length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        let existingUser = await User.findOne({ email: emailLower });
        if (existingUser) {
          return res.status(400).json({ message: 'A user with this email already exists' });
        }

        const user = await User.create({
          name,
          email: emailLower,
          password,
          role: 'user',
          isVerified: true
        });
        userId = user._id;
      }
    } else {
      // Delete the associated User to free up email
      if (userId) {
        await User.findByIdAndDelete(userId);
        userId = null;
      }
    }

    client.name = name;
    client.email = email;
    client.phone = phone;
    client.company = company;
    client.address = address;
    client.notes = notes || '';
    client.tags = Array.isArray(tags) ? tags : (typeof tags === 'string' && tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : client.tags || []);
    if (totalProjectAmount !== undefined && totalProjectAmount !== '') {
      client.totalProjectAmount = Number(totalProjectAmount) || 0;
    }
    client.remainingAmount = Math.max(0, Number(client.totalProjectAmount || 0) - Number(client.amountPaid || 0));
    client.paymentStatus = client.remainingAmount === 0 && client.totalProjectAmount > 0
      ? 'paid'
      : client.amountPaid > 0
        ? 'partial'
        : 'pending';
    client.user = userId;

    await client.save();

    const populatedClient = await Client.findById(client._id).populate('user');
    res.json({ client: populatedClient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    if (client.user) {
      await User.findByIdAndDelete(client.user);
    }

    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addPaymentRecord = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount required' });
    }

    client.payments.unshift({
      amount,
      date: req.body.date || new Date(),
      note: req.body.note || '',
      invoiceNumber: req.body.invoiceNumber || '',
      screenshot: req.file ? `/uploads/${req.file.filename}` : '',
      recordedBy: req.user._id,
    });

    client.amountPaid = Number(client.amountPaid || 0) + amount;
    client.remainingAmount = Math.max(0, Number(client.totalProjectAmount || 0) - client.amountPaid);
    client.paymentStatus = client.remainingAmount === 0 && client.totalProjectAmount > 0
      ? 'paid'
      : client.amountPaid > 0
        ? 'partial'
        : 'pending';

    await client.save();

    const populatedClient = await Client.findById(client._id)
      .populate('user')
      .populate('payments.recordedBy', 'name avatar');

    res.status(201).json({ client: populatedClient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
