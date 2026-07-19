const Client = require('../models/Client');
const User = require('../models/User');

exports.getClients = async (req, res) => {
  try {
    const showArchived = req.query.archived === 'true';
    const filter = { freelancer: req.user._id };
    
    if (showArchived) {
      filter.isArchived = true;
    } else {
      filter.isArchived = { $ne: true };
    }

    const clients = await Client.find(filter)
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
    const { name, email, phone, company, address, allowLogin, password, notes, tags, totalProjectAmount, gstNumber, panNumber } = req.body;
    if (!name || !email)
      return res.status(400).json({ message: 'Name and email required' });

    const emailLower = email.toLowerCase();
    const exists = await Client.findOne({ email: emailLower, freelancer: req.user._id, isArchived: { $ne: true } });
    if (exists) return res.status(400).json({ message: 'Client with this email already exists' });

    const clientData = {
      name,
      email: emailLower,
      phone,
      company,
      address,
      notes: notes || '',
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' && tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      gstNumber: gstNumber || '',
      panNumber: panNumber || '',
      totalProjectAmount: Number(totalProjectAmount) || 0,
      amountPaid: 0,
      remainingAmount: Number(totalProjectAmount) || 0,
      paymentStatus: 'pending',
      freelancer: req.user._id,
      allowLogin: false, // Must verify email first
      isVerified: false
    };

    const client = await Client.create(clientData);
    res.status(201).json({ client });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { name, email, phone, company, address, allowLogin, password, notes, tags, totalProjectAmount, gstNumber, panNumber, documents } = req.body;

    let client = await Client.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const emailLower = email ? email.toLowerCase() : client.email;

    // Check allowLogin conditions
    if (allowLogin) {
      if (!client.isVerified) {
        return res.status(400).json({ message: 'Client email must be verified before login can be enabled.' });
      }

      // If allowLogin was previously false, or password is blank
      const wasLoginDisabled = !client.allowLogin;
      if (wasLoginDisabled || !client.password) {
        if (!password || password.length < 6) {
          return res.status(400).json({ message: 'An initial password (at least 6 characters) is required when enabling client login.' });
        }
        client.password = password;
      } else if (password) {
        if (password.length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }
        client.password = password;
      }
      client.allowLogin = true;
    } else {
      client.allowLogin = false;
    }

    client.name = name || client.name;
    client.email = emailLower;
    client.phone = phone !== undefined ? phone : client.phone;
    client.company = company !== undefined ? company : client.company;
    client.address = address !== undefined ? address : client.address;
    client.notes = notes !== undefined ? notes : client.notes;
    client.gstNumber = gstNumber !== undefined ? gstNumber : client.gstNumber;
    client.panNumber = panNumber !== undefined ? panNumber : client.panNumber;
    
    if (tags !== undefined) {
      client.tags = Array.isArray(tags) ? tags : (typeof tags === 'string' && tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    }
    
    if (documents !== undefined) {
      client.documents = documents;
    }

    if (totalProjectAmount !== undefined && totalProjectAmount !== '') {
      client.totalProjectAmount = Number(totalProjectAmount) || 0;
    }
    client.remainingAmount = Math.max(0, Number(client.totalProjectAmount || 0) - Number(client.amountPaid || 0));
    client.paymentStatus = client.remainingAmount === 0 && client.totalProjectAmount > 0
      ? 'paid'
      : client.amountPaid > 0
        ? 'partial'
        : 'pending';

    await client.save();
    res.json({ client });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Soft delete Client
    client.isArchived = true;
    await client.save();

    // If there is an associated legacy user model, clean it up
    if (client.user) {
      await User.findByIdAndDelete(client.user);
      client.user = undefined;
      await client.save();
    }

    res.json({ message: 'Client archived successfully (soft deleted)' });
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
      .populate('payments.recordedBy', 'name avatar');

    res.status(201).json({ client: populatedClient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendClientVerificationOTP = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    client.verificationOTP = verificationOTP;
    client.verificationOTPExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await client.save();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf5ff;">
        <h2 style="color: #6366f1; border-bottom: 2px solid #e9d5ff; padding-bottom: 10px; margin-top: 0;">Verify Your Email - FreelanceOS 💼</h2>
        <p>Hi <strong>${client.name}</strong>,</p>
        <p>Your email address is being verified on FreelanceOS. Enter the verification code (OTP) below to complete verification:</p>
        <div style="margin: 25px 0; text-align: center;">
          <span style="background-color: #6366f1; color: white; padding: 12px 30px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; display: inline-block;">${verificationOTP}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">This code is valid for 15 minutes. If you did not request this verification, please ignore this email.</p>
      </div>
    `;

    const { sendEmail } = require('../utils/emailUtil');
    await sendEmail({
      to: client.email,
      subject: '📧 Verify Your Email - FreelanceOS',
      html: htmlContent,
      text: `Your email verification code is: ${verificationOTP}`
    });

    res.json({ message: 'Verification OTP sent to client email successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadClientDocument = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    client.documents.push({
      name: req.body.name || req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    });

    await client.save();
    res.json({ client });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
