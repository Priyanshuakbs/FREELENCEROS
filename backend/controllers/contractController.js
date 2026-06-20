const Contract = require('../models/Contract');
const puppeteer = require('puppeteer');

exports.getContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({ freelancer: req.user._id }).sort({ createdAt: -1 });
    res.json({ contracts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createContract = async (req, res) => {
  try {
    const { title, clientName, clientEmail, description, terms, amount, status } = req.body;
    if (!title || !clientName || !clientEmail || !terms) {
      return res.status(400).json({ message: 'Title, client name, client email, and terms are required.' });
    }

    const contract = await Contract.create({
      title,
      clientName,
      clientEmail,
      description: description || '',
      terms,
      amount: Number(amount) || 0,
      status: status || 'draft',
      freelancer: req.user._id,
      signedAt: status === 'signed' ? new Date() : null,
    });

    res.status(201).json({ contract });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findOneAndDelete({
      _id: req.params.id,
      freelancer: req.user._id,
    });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json({ message: 'Contract deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.downloadContractPDF = async (req, res) => {
  try {
    const contract = await Contract.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Times New Roman', Times, serif; padding: 50px; color: #111; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; text-transform: uppercase; border-bottom: 2px solid #222; padding-bottom: 10px; }
        .title { font-size: 22px; font-weight: bold; margin-bottom: 5px; }
        .subtitle { font-size: 14px; font-style: italic; color: #555; }
        .meta-section { margin-bottom: 30px; font-size: 14px; }
        .meta-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .section-title { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        p { text-align: justify; font-size: 14px; margin-bottom: 15px; }
        .terms { font-size: 14px; white-space: pre-wrap; background: #fafafa; padding: 15px; border: 1px solid #eee; border-radius: 6px; }
        .signature-area { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
        .sig-block { width: 45%; text-align: center; }
        .sig-line { border-top: 1px solid #111; margin-top: 50px; padding-top: 5px; font-size: 13px; }
        .footer { margin-top: 80px; text-align: center; font-size: 11px; color: #777; border-top: 1px dashed #ddd; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Freelance Agreement</div>
        <div class="subtitle">${contract.title}</div>
      </div>

      <div class="meta-section">
        <div class="meta-row">
          <span><strong>Effective Date:</strong> ${new Date(contract.createdAt).toLocaleDateString('en-IN')}</span>
          <span><strong>Contract Ref:</strong> CON-${contract._id.toString().substring(0, 8).toUpperCase()}</span>
        </div>
        <div class="meta-row">
          <span><strong>Freelancer:</strong> ${req.user.name} (${req.user.email})</span>
          <span><strong>Client Name:</strong> ${contract.clientName} (${contract.clientEmail})</span>
        </div>
      </div>

      <div class="section-title">1. Engagement Description</div>
      <p>${contract.description || 'This agreement documents the business relationship and engagement specifics between the freelancer and client detailed above.'}</p>

      <div class="section-title">2. Scope & Technical Agreements</div>
      <div class="terms">${contract.terms}</div>

      <div class="section-title">3. Compensation & Billings</div>
      <p>The client agrees to pay the freelancer a fee of <strong>₹${Number(contract.amount).toLocaleString('en-IN')}</strong> in accordance with the billing terms and milestones established.</p>

      <div class="section-title">4. Execution & Status</div>
      <p>This contract status is marked as: <strong>${contract.status.toUpperCase()}</strong>. ${contract.signedAt ? `Signed on ${new Date(contract.signedAt).toLocaleDateString('en-IN')}.` : ''}</p>

      <div class="signature-area">
        <div class="sig-block">
          <div class="sig-line">Freelancer Signature (${req.user.name})</div>
        </div>
        <div class="sig-block">
          <div class="sig-line">Client Signature (${contract.clientName})</div>
        </div>
      </div>

      <div class="footer">
        Generated by FreelanceOS. The parties accept all terms outlined in this digital record.
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
    res.setHeader('Content-Disposition', `attachment; filename=contract-${contract._id.toString().substring(0,8)}.pdf`);
    res.send(pdf);

  } catch (err) {
    console.error('Contract PDF error:', err.message);
    res.status(500).json({ message: err.message });
  }
};
