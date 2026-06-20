const Invoice = require('../models/Invoice');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

const generateInvoiceNumber = () => {
  const date = new Date();
  return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
};
exports.downloadPDF = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, freelancer: req.user._id })
      .populate('client', 'name email phone company address')
      .populate('project', 'title');

    if (!invoice) return res.status(404).json({ message: 'Not found' });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
        .invoice-num { font-size: 14px; color: #666; }
        .badge { background: #EEF2FF; color: #4F46E5; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        .section { margin-bottom: 30px; }
        .label { font-size: 12px; color: #666; margin-bottom: 4px; }
        .value { font-size: 14px; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #F3F4F6; padding: 12px; text-align: left; font-size: 13px; }
        td { padding: 12px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
        .totals { margin-left: auto; width: 250px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
        .grand-total { font-size: 18px; font-weight: bold; color: #4F46E5; border-top: 2px solid #4F46E5; padding-top: 8px; margin-top: 8px; }
        .footer { margin-top: 60px; text-align: center; color: #999; font-size: 12px; }
        .status-paid { color: #059669; font-weight: bold; }
        .status-pending { color: #D97706; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">💼 FreelanceOS</div>
          <div class="invoice-num">${invoice.invoiceNumber}</div>
          <div style="margin-top:8px">
            <span class="badge">${invoice.status.toUpperCase()}</span>
          </div>
        </div>
        <div style="text-align:right">
          <div class="label">Issue Date</div>
          <div class="value">${new Date(invoice.createdAt).toLocaleDateString('en-IN')}</div>
          ${invoice.dueDate ? `
          <div class="label" style="margin-top:8px">Due Date</div>
          <div class="value">${new Date(invoice.dueDate).toLocaleDateString('en-IN')}</div>
          ` : ''}
        </div>
      </div>

      <div style="display:flex; gap:60px; margin-bottom:30px">
        <div class="section">
          <div class="label">BILL TO</div>
          <div class="value">${invoice.client?.name || ''}</div>
          <div style="color:#666; font-size:13px">${invoice.client?.email || ''}</div>
          <div style="color:#666; font-size:13px">${invoice.client?.company || ''}</div>
          <div style="color:#666; font-size:13px">${invoice.client?.address || ''}</div>
        </div>
        ${invoice.project ? `
        <div class="section">
          <div class="label">PROJECT</div>
          <div class="value">${invoice.project?.title || ''}</div>
        </div>
        ` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>₹${item.rate.toLocaleString('en-IN')}</td>
            <td style="text-align:right">₹${item.amount.toLocaleString('en-IN')}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>₹${invoice.subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div class="total-row">
          <span>GST (${invoice.tax}%)</span>
          <span>₹${((invoice.subtotal * invoice.tax) / 100).toLocaleString('en-IN')}</span>
        </div>
        <div class="total-row grand-total">
          <span>Total</span>
          <span>₹${invoice.total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      ${invoice.notes ? `
      <div style="margin-top:40px; padding:16px; background:#F9FAFB; border-radius:8px;">
        <div class="label">NOTES</div>
        <div style="font-size:13px; color:#374151; margin-top:4px">${invoice.notes}</div>
      </div>
      ` : ''}

      <div class="footer">
        <p>Thank you for your business! — Generated by FreelanceOS</p>
      </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);
    res.send(pdf);
  } catch (err) {
    console.error('PDF error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ freelancer: req.user._id })
      .populate('client', 'name email')
      .populate('project', 'title')
      .sort({ createdAt: -1 });
    res.json({ invoices });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const { client, project, items, tax, dueDate, notes } = req.body;
    const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
    const total = subtotal + (subtotal * (tax || 18)) / 100;

    const invoice = await Invoice.create({
      invoiceNumber: generateInvoiceNumber(),
      client, project, items, subtotal,
      tax: tax || 18,
      total, dueDate, notes,
      freelancer: req.user._id,
    });
    res.status(201).json({ invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const update = { status: req.body.status };
    if (req.body.status === 'paid') update.paidAt = new Date();
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, freelancer: req.user._id },
      update,
      { new: true }
    ).populate('client', 'name email');
    res.json({ invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    await Invoice.findOneAndDelete({ _id: req.params.id, freelancer: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, freelancer: req.user._id })
      .populate('client', 'name email phone company address')
      .populate('project', 'title');
    if (!invoice) return res.status(404).json({ message: 'Not found' });
    res.json({ invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendReminderEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, freelancer: req.user._id })
      .populate('client', 'name email');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (!invoice.client || !invoice.client.email) {
      return res.status(400).json({ message: 'Client email is missing' });
    }

    // Configure SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || 'demo_user',
        pass: process.env.SMTP_PASS || 'demo_pass',
      },
    });

    const isMock = !process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.ethereal.email';

    const mailOptions = {
      from: `"${req.user.name}" <${req.user.email}>`,
      to: invoice.client.email,
      subject: `📢 Payment Reminder: Invoice ${invoice.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4f46e5; border-bottom: 1px solid #eee; padding-bottom: 10px;">Payment Reminder</h2>
          <p>Dear <strong>${invoice.client.name}</strong>,</p>
          <p>This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> is currently outstanding.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f9fafb;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eee;">Invoice No.</th>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eee;">Amount Due</th>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #4f46e5;">₹${invoice.total.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eee;">Due Date</th>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'Upon receipt'}</td>
            </tr>
          </table>

          <p>Please settle this invoice at your earliest convenience. If you have already made the payment, please disregard this email.</p>
          <p style="margin-top: 30px; font-size: 13px; color: #777;">Thank you for your business!</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
          <p style="font-size: 11px; color: #999; text-align: center;">Sent via FreelanceOS</p>
        </div>
      `,
    };

    if (isMock) {
      console.log('--- SMTP not configured. Simulating email dispatch ---');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('----------------------------------------------------');
      await new Promise(resolve => setTimeout(resolve, 800));
      return res.json({ message: 'Reminder email sent! (Simulated Mode - Connect real SMTP in .env)' });
    }

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Reminder email sent successfully!' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// Generate Invoice from unbilled time logs
// ─────────────────────────────────────────────
const TimeLog = require('../models/TimeLog');
const Client = require('../models/Client');

exports.createFromTimeLogs = async (req, res) => {
  try {
    const { projectId, clientId, tax, dueDate, notes } = req.body;
    if (!projectId || !clientId) {
      return res.status(400).json({ message: 'projectId and clientId are required' });
    }

    const logs = await TimeLog.find({
      project: projectId,
      freelancer: req.user._id,
      billed: false,
      hourlyRate: { $gt: 0 },
    }).populate('project', 'title');

    if (logs.length === 0) {
      return res.status(400).json({ message: 'No unbilled time logs found for this project' });
    }

    const items = logs.map(log => {
      const hours = log.duration / 60;
      const amount = parseFloat((hours * log.hourlyRate).toFixed(2));
      return {
        description: log.description || `${log.project?.title || 'Work'} — ${log.duration} mins`,
        quantity: parseFloat(hours.toFixed(2)),
        rate: log.hourlyRate,
        amount,
      };
    });

    const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
    const taxRate = tax || 18;
    const total = subtotal + (subtotal * taxRate) / 100;

    const invoice = await Invoice.create({
      invoiceNumber: generateInvoiceNumber(),
      client: clientId,
      project: projectId,
      items,
      subtotal,
      tax: taxRate,
      total,
      dueDate,
      notes: notes || 'Auto-generated from time logs',
      freelancer: req.user._id,
    });

    // Mark logs as billed
    await TimeLog.updateMany(
      { _id: { $in: logs.map(l => l._id) } },
      { $set: { billed: true } }
    );

    const populated = await Invoice.findById(invoice._id)
      .populate('client', 'name email')
      .populate('project', 'title');

    res.status(201).json({ invoice: populated, logsConverted: logs.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// Razorpay Payment Integration
// ─────────────────────────────────────────────
const crypto = require('crypto');

exports.createRazorpayOrder = async (req, res) => {
  try {
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(400).json({ message: 'Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env' });
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, freelancer: req.user._id });
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

exports.verifyRazorpayPayment = async (req, res) => {
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
      { _id: req.params.id, freelancer: req.user._id },
      { status: 'paid', paidAt: new Date(), razorpayPaymentId: razorpay_payment_id },
      { new: true }
    ).populate('client', 'name email');

    res.json({ message: 'Payment verified! Invoice marked as paid.', invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// Toggle Recurring Invoice
// ─────────────────────────────────────────────
exports.updateRecurring = async (req, res) => {
  try {
    const { isRecurring, recurringCycle } = req.body;
    let nextInvoiceDate = null;
    if (isRecurring) {
      const now = new Date();
      if (recurringCycle === 'weekly') nextInvoiceDate = new Date(now.setDate(now.getDate() + 7));
      else if (recurringCycle === 'quarterly') nextInvoiceDate = new Date(now.setMonth(now.getMonth() + 3));
      else nextInvoiceDate = new Date(now.setMonth(now.getMonth() + 1)); // monthly default
    }
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, freelancer: req.user._id },
      { isRecurring, recurringCycle: recurringCycle || 'monthly', nextInvoiceDate },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// Public Invoice Access (via Portal Share Token)
// ─────────────────────────────────────────────
exports.getPublicInvoicePDF = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findOne({ shareToken: req.params.token });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const invoice = await Invoice.findOne({ _id: req.params.invoiceId, project: project._id })
      .populate('client', 'name email phone company address')
      .populate('project', 'title');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Generate HTML content (similar to downloadPDF)
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
        .invoice-num { font-size: 14px; color: #666; }
        .badge { background: #EEF2FF; color: #4F46E5; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        .section { margin-bottom: 30px; }
        .label { font-size: 12px; color: #666; margin-bottom: 4px; }
        .value { font-size: 14px; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #F3F4F6; padding: 12px; text-align: left; font-size: 13px; }
        td { padding: 12px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
        .totals { margin-left: auto; width: 250px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
        .grand-total { font-size: 18px; font-weight: bold; color: #4F46E5; border-top: 2px solid #4F46E5; padding-top: 8px; margin-top: 8px; }
        .footer { margin-top: 60px; text-align: center; color: #999; font-size: 12px; }
        .status-paid { color: #059669; font-weight: bold; }
        .status-pending { color: #D97706; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">💼 FreelanceOS</div>
          <div class="invoice-num">${invoice.invoiceNumber}</div>
          <div style="margin-top:8px">
            <span class="badge">${invoice.status.toUpperCase()}</span>
          </div>
        </div>
        <div style="text-align:right">
          <div class="label">Issue Date</div>
          <div class="value">${new Date(invoice.createdAt).toLocaleDateString('en-IN')}</div>
          ${invoice.dueDate ? `
          <div class="label" style="margin-top:8px">Due Date</div>
          <div class="value">${new Date(invoice.dueDate).toLocaleDateString('en-IN')}</div>
          ` : ''}
        </div>
      </div>

      <div style="display:flex; gap:60px; margin-bottom:30px">
        <div class="section">
          <div class="label">BILL TO</div>
          <div class="value">${invoice.client?.name || ''}</div>
          <div style="color:#666; font-size:13px">${invoice.client?.email || ''}</div>
          <div style="color:#666; font-size:13px">${invoice.client?.company || ''}</div>
          <div style="color:#666; font-size:13px">${invoice.client?.address || ''}</div>
        </div>
        ${invoice.project ? `
        <div class="section">
          <div class="label">PROJECT</div>
          <div class="value">${invoice.project?.title || ''}</div>
        </div>
        ` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>₹${item.rate.toLocaleString('en-IN')}</td>
            <td style="text-align:right">₹${item.amount.toLocaleString('en-IN')}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>₹${invoice.subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div class="total-row">
          <span>GST (${invoice.tax}%)</span>
          <span>₹${((invoice.subtotal * invoice.tax) / 100).toLocaleString('en-IN')}</span>
        </div>
        <div class="total-row grand-total">
          <span>Total</span>
          <span>₹${invoice.total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      ${invoice.notes ? `
      <div style="margin-top:40px; padding:16px; background:#F9FAFB; border-radius:8px;">
        <div class="label">NOTES</div>
        <div style="font-size:13px; color:#374151; margin-top:4px">${invoice.notes}</div>
      </div>
      ` : ''}

      <div class="footer">
        <p>Thank you for your business! — Generated by FreelanceOS</p>
      </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);
    res.send(pdf);
  } catch (err) {
    console.error('PDF error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.createPublicInvoiceRazorpayOrder = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findOne({ shareToken: req.params.token });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const invoice = await Invoice.findOne({ _id: req.params.invoiceId, project: project._id });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ message: 'Invoice already paid' });

    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(400).json({ message: 'Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env' });
    }

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

exports.verifyPublicInvoiceRazorpayPayment = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findOne({ shareToken: req.params.token });
    if (!project) return res.status(404).json({ message: 'Project not found' });

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
      { _id: req.params.invoiceId, project: project._id },
      { status: 'paid', paidAt: new Date(), razorpayPaymentId: razorpay_payment_id },
      { new: true }
    ).populate('client', 'name email');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    res.json({ message: 'Payment verified! Invoice marked as paid.', invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};