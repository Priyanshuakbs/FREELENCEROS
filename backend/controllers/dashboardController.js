const Client = require('../models/Client');
const Project = require('../models/Project');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const TimeLog = require('../models/TimeLog');
const ProjectPRD = require('../models/ProjectPRD');
const Message = require('../models/Message');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────
// Admin Dashboard Aggregation Summary
// ─────────────────────────────────────────────────────────────
exports.getAdminSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch raw documents
    const [clients, projects, invoices, expenses, logs] = await Promise.all([
      Client.find({ freelancer: userId, isArchived: { $ne: true } }),
      Project.find({ 
        $and: [
          { isArchived: { $ne: true } },
          { $or: [{ freelancer: userId }, { collaborators: userId }] }
        ]
      }).populate('client', 'name email'),
      Invoice.find({ freelancer: userId, isArchived: { $ne: true } })
        .populate('client', 'name email')
        .populate('project', 'title'),
      Expense.find({ freelancer: userId }),
      TimeLog.find({ freelancer: userId })
    ]);

    // Financial Metrics
    const paidInvoices = invoices.filter((item) => item.status === 'paid');
    const pendingInvoices = invoices.filter((item) => item.status !== 'paid');
    const totalEarned = paidInvoices.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalHours = logs.reduce((sum, item) => sum + Number(item.duration || 0), 0) / 60;
    const netProfit = totalEarned - totalExpenses;
    const outstandingRevenue = pendingInvoices.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const overdueCount = invoices.filter((item) => item.status === 'overdue').length;

    // Expense categorization and filtering
    const expensesByCategory = {};
    expenses.forEach((exp) => {
      // apply project & date filters if supplied in query params
      if (req.query.projectId && exp.project?.toString() !== req.query.projectId) return;
      if (req.query.startDate && new Date(exp.date) < new Date(req.query.startDate)) return;
      if (req.query.endDate && new Date(exp.date) > new Date(req.query.endDate)) return;

      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
    });

    // Cashflow charts (last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const cashflowData = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const month = date.getMonth();
      const year = date.getFullYear();

      const revenue = paidInvoices
        .filter((item) => {
          const created = new Date(item.createdAt);
          return created.getMonth() === month && created.getFullYear() === year;
        })
        .reduce((sum, item) => sum + Number(item.total || 0), 0);

      const spend = expenses
        .filter((item) => {
          const created = new Date(item.date);
          return created.getMonth() === month && created.getFullYear() === year;
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      return {
        month: months[month],
        revenue,
        expenses: spend,
        profit: revenue - spend,
      };
    });

    // Project progress data
    const projectProgressData = projects
      .map((project) => {
        const totalTasks = project.tasks?.length || 0;
        const completedTasks = project.tasks?.filter((task) => task.completed).length || 0;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return {
          id: project._id,
          name: project.title,
          progress,
          status: project.status || 'active',
        };
      });

    // Recent activity list
    const activities = [
      ...paidInvoices.slice(-4).map((item) => ({
        id: `invoice-${item._id}`,
        title: `Invoice ${item.invoiceNumber} marked paid`,
        meta: item.client?.name || 'Client invoice',
        time: item.updatedAt || item.createdAt,
        kind: 'payment',
      })),
      ...projects.slice(-4).map((item) => ({
        id: `project-${item._id}`,
        title: `Project updated: ${item.title}`,
        meta: item.status || 'active',
        time: item.updatedAt || item.createdAt,
        kind: 'project',
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 6);

    // Upcoming project deadlines
    const upcomingDeadlines = projects
      .filter((item) => item.deadline)
      .map((item) => ({
        id: item._id,
        title: item.title,
        client: item.client?.name || 'No client',
        deadline: item.deadline,
        status: item.status || 'active',
      }))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);

    // topClients
    const revenueByClient = {};
    paidInvoices.forEach((invoice) => {
      if (!invoice.client?._id) return;
      const clientId = invoice.client._id.toString();
      if (!revenueByClient[clientId]) {
        revenueByClient[clientId] = {
          id: clientId,
          name: invoice.client.name,
          invoices: 0,
          revenue: 0,
        };
      }
      revenueByClient[clientId].invoices += 1;
      revenueByClient[clientId].revenue += Number(invoice.total || 0);
    });
    const topClients = Object.values(revenueByClient)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // recentPayments
    const recentPayments = clients
      .flatMap((c) =>
        (c.payments || []).map((payment) => ({
          id: `${c._id}-${payment._id || payment.date}`,
          clientName: c.name,
          amount: Number(payment.amount || 0),
          date: payment.date,
          note: payment.note || '',
          screenshot: payment.screenshot || '',
        }))
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    // Response packet
    res.json({
      overview: {
        clientsCount: clients.length,
        projectsCount: projects.length,
        activeProjectsCount: projects.filter(p => p.status === 'active').length,
        completedProjectsCount: projects.filter(p => p.status === 'completed').length,
        onHoldProjectsCount: projects.filter(p => p.status === 'on-hold').length,
        paidInvoicesCount: paidInvoices.length,
        pendingInvoicesCount: pendingInvoices.length,
        totalHours,
        totalEarned,
        totalExpenses,
        netProfit,
        outstandingRevenue,
        overdueCount,
        monthlyGoal: req.user.monthlyGoal || 100000,
      },
      projects: projects.map(p => ({
        id: p._id,
        title: p.title,
        client: p.client ? p.client.name : 'No client',
        deadline: p.deadline,
        budget: p.budget,
        status: p.status
      })),
      invoices: invoices.map(inv => ({
        id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        client: inv.client ? inv.client.name : 'No client',
        project: inv.project ? inv.project.title : 'No project',
        total: inv.total,
        status: inv.status,
        dueDate: inv.dueDate,
        razorpayOrderId: inv.razorpayOrderId,
        razorpayPaymentId: inv.razorpayPaymentId
      })),
      expensesByCategory,
      cashflowData,
      projectProgressData,
      recentActivity: activities,
      upcomingDeadlines,
      topClients,
      recentPayments
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// Client Dashboard Summary
// ─────────────────────────────────────────────────────────────
exports.getClientSummary = async (req, res) => {
  try {
    const clientId = req.client._id;

    // Fetch projects and invoices for this client
    const [projects, invoices] = await Promise.all([
      Project.find({ client: clientId, isArchived: { $ne: true } })
        .populate('collaborators', 'name email')
        .populate('files.uploadedBy', 'name role'),
      Invoice.find({ client: clientId, isArchived: { $ne: true } })
        .populate('project', 'title')
        .sort({ createdAt: -1 })
    ]);

    // Fetch latest ProjectPRDs for the projects
    const prds = await ProjectPRD.find({ project: { $in: projects.map(p => p._id) } })
      .sort({ version: -1 })
      .populate('createdBy', 'name email')
      .populate('acceptedBy', 'name email');

    // Attach latest PRD to each project
    const projectsWithPRD = projects.map(project => {
      const projectPrds = prds
        .filter(p => p.project.toString() === project._id.toString())
        .sort((a, b) => b.version - a.version); // ensure descending version order
      const latestPrd = projectPrds.length > 0 ? projectPrds[0] : null;

      return {
        ...project.toObject(),
        prd: latestPrd
      };
    });

    res.json({
      client: {
        id: req.client._id,
        name: req.client.name,
        email: req.client.email,
        phone: req.client.phone,
        company: req.client.company,
        address: req.client.address,
        gstNumber: req.client.gstNumber,
        panNumber: req.client.panNumber,
        documents: req.client.documents
      },
      projects: projectsWithPRD,
      invoices: invoices.map(inv => ({
        id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        project: inv.project ? inv.project.title : 'No project',
        subtotal: inv.subtotal,
        tax: inv.tax,
        total: inv.total,
        status: inv.status,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
        items: inv.items,
        razorpayOrderId: inv.razorpayOrderId,
        razorpayPaymentId: inv.razorpayPaymentId
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// Client Update Profile Details
// ─────────────────────────────────────────────────────────────
exports.updateClientProfile = async (req, res) => {
  try {
    const { name, email, phone, company, address } = req.body;
    const client = await Client.findById(req.client._id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    client.name = name || client.name;
    if (email) client.email = email.toLowerCase();
    client.phone = phone !== undefined ? phone : client.phone;
    client.company = company !== undefined ? company : client.company;
    client.address = address !== undefined ? address : client.address;

    await client.save();
    res.json({
      message: 'Profile updated successfully!',
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        address: client.address
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// Client Razorpay order generation
// ─────────────────────────────────────────────────────────────
exports.createClientInvoiceRazorpayOrder = async (req, res) => {
  try {
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(400).json({ message: 'Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env' });
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, client: req.client._id });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ message: 'Invoice already paid' });

    const Razorpay = require('razorpay');
    const instance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    const order = await instance.orders.create({
      amount: Math.round(invoice.total * 100), // paise
      currency: 'INR',
      receipt: invoice.invoiceNumber,
      notes: { invoiceId: invoice._id.toString() },
    });

    await Invoice.findByIdAndUpdate(invoice._id, { razorpayOrderId: order.id });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, key: RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// Client Razorpay verification
// ─────────────────────────────────────────────────────────────
exports.verifyClientInvoiceRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) return res.status(400).json({ message: 'Razorpay not configured' });

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = hmac.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — signature mismatch' });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, client: req.client._id },
      { status: 'paid', paidAt: new Date(), razorpayPaymentId: razorpay_payment_id },
      { new: true }
    ).populate('client', 'name email');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    res.json({ message: 'Payment verified! Invoice marked as paid.', invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get client project messages
exports.getClientProjectMessages = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, client: req.client._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const messages = await Message.find({ project: project._id })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send client project message
exports.sendClientProjectMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message text required' });

    const project = await Project.findOne({ _id: req.params.id, client: req.client._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const message = await Message.create({
      project: project._id,
      sender: req.client._id,
      senderModel: 'Client',
      text
    });

    const populated = await Message.findById(message._id).populate('sender', 'name avatar');
    res.status(201).json({ message: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Client upload project file
exports.clientUploadProjectFile = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, client: req.client._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const newFile = {
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      createdAt: new Date()
    };

    project.files.push(newFile);
    await project.save();

    const populated = await Project.findById(project._id)
      .populate('collaborators', 'name email')
      .populate('files.uploadedBy', 'name role');

    res.status(201).json({ project: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Client delete project file
exports.clientDeleteProjectFile = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, client: req.client._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const file = project.files.id(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Enforce that clients can only delete their own uploaded files
    if (file.uploadedBy) {
      return res.status(403).json({ message: 'Access denied: You can only delete files you uploaded.' });
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
      .populate('collaborators', 'name email')
      .populate('files.uploadedBy', 'name role');

    res.json({ project: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
