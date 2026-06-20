const { GoogleGenerativeAI } = require('@google/generative-ai');
const Client = require('../models/Client');
const Project = require('../models/Project');

exports.generateInvoiceItems = async (req, res) => {
  try {
    const { description, projectId, hourlyRate } = req.body;
    if (!description) return res.status(400).json({ message: 'Description required' });

    // Fetch project info for context
    let projectInfo = '';
    if (projectId) {
      const project = await Project.findOne({ _id: projectId, freelancer: req.user._id });
      if (project) projectInfo = `Project: ${project.title}. Budget: ₹${project.budget}.`;
    }

    const prompt = `You are a professional freelancer invoice assistant. Generate invoice line items based on this work description.

Work Description: "${description}"
${projectInfo}
Hourly Rate: ₹${hourlyRate || 1500}/hour

Generate 2-5 professional invoice line items. Return ONLY a JSON array, no markdown, no explanation:
[
  {
    "description": "specific task description",
    "quantity": number,
    "rate": number,
    "amount": number,
    "unit": "hours/pages/screens/components"
  }
]

Rules:
- Be specific and professional
- quantity * rate = amount (must be exact)
- Use realistic quantities based on work description
- descriptions should be professional and detailed
- Return ONLY the JSON array, nothing else`;

    // 1. Try Gemini first if key exists
    const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const items = JSON.parse(jsonMatch[0]);
          return res.json({ items });
        }
      } catch (geminiError) {
        console.error('Gemini invoice generation error, falling back to Anthropic:', geminiError.message);
      }
    }

    // 2. Fallback to Anthropic if key exists
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.content || !data.content[0]) {
          const errMsg = data.error?.message || 'Anthropic API error';
          console.error('Anthropic API failed:', data.error);
          return res.status(response.status || 500).json({ 
            message: `AI Generation failed: ${errMsg}` 
          });
        }

        const text = data.content[0].text.trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return res.status(500).json({ message: 'AI response parse failed' });

        const items = JSON.parse(jsonMatch[0]);
        return res.json({ items });
      } catch (anthropicError) {
        return res.status(500).json({ message: `Anthropic AI Generation failed: ${anthropicError.message}` });
      }
    }

    return res.status(400).json({ 
      message: 'No API keys configured. Please configure GEMINI_API_KEY or ANTHROPIC_API_KEY in your backend .env file.' 
    });

  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.generateContractTerms = async (req, res) => {
  try {
    const { title, description, amount } = req.body;
    if (!title) return res.status(400).json({ message: 'Contract title required' });

    const prompt = `You are a professional legal assistant for freelancers. Generate professional contract clauses/terms based on the following details.

Contract Title: "${title}"
Project Description: "${description || 'Web development services'}"
Budget/Amount: ₹${amount || 'Not Specified'}

Generate a structured set of professional contract clauses (e.g. 1. Scope of Work, 2. Payment Terms, 3. Revision Policy, 4. Intellectual Property, 5. Termination).
Keep the terms realistic, specific to the description, and legally professional.
Return ONLY the numbered clauses, do NOT include extra markdown formatting, intro or outro text. Just the clauses text.`;

    // 1. Try Gemini first if key exists
    const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return res.json({ terms: text });
      } catch (geminiError) {
        console.error('Gemini contract generation error, falling back to Anthropic:', geminiError.message);
      }
    }

    // 2. Fallback to Anthropic if key exists
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.content || !data.content[0]) {
          const errMsg = data.error?.message || 'Anthropic API error';
          console.error('Anthropic API failed:', data.error);
          return res.status(response.status || 500).json({ 
            message: `AI Generation failed: ${errMsg}` 
          });
        }

        const text = data.content[0].text.trim();
        return res.json({ terms: text });
      } catch (anthropicError) {
        return res.status(500).json({ message: `Anthropic AI Generation failed: ${anthropicError.message}` });
      }
    }

    return res.status(400).json({ 
      message: 'No API keys configured. Please configure GEMINI_API_KEY or ANTHROPIC_API_KEY in your .env file.' 
    });

  } catch (err) {
    console.error('AI contract error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// AI Proposal Writer
exports.generateProposal = async (req, res) => {
  try {
    const { clientName, projectType, description, budget, timeline, tone, myName } = req.body;
    if (!clientName || !description) {
      return res.status(400).json({ message: 'Client name and description required' });
    }

    const prompt = `You are an expert freelance proposal writer. Write a professional, compelling project proposal.

Freelancer/Agency: ${myName || 'FreelanceOS User'}
Client Name: ${clientName}
Project Type: ${projectType || 'Web Development'}
Project Description: ${description}
Budget: ${budget ? '₹' + budget : 'To be discussed'}
Timeline: ${timeline || 'To be discussed'}
Tone: ${tone || 'Professional'}

Write a complete project proposal with these sections:
1. Executive Summary
2. Understanding of Requirements
3. Proposed Solution & Approach
4. Deliverables
5. Timeline & Milestones
6. Investment (Budget Breakdown)
7. Why Choose Us
8. Next Steps

Make it persuasive, specific to the project description, and ${tone || 'professional'} in tone.
Do NOT use markdown formatting like ** or ##. Use plain text with numbered sections.
Return ONLY the proposal text, nothing else.`;

    const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (geminiKey) {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      return res.json({ proposal: result.response.text().trim() });
    }

    return res.status(400).json({ message: 'No GEMINI_API_KEY configured in backend .env' });
  } catch (err) {
    console.error('AI proposal error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Razorpay: Create payment order
exports.createPaymentOrder = async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const Invoice = require('../models/Invoice');

    const invoice = await Invoice.findOne({ _id: req.params.id })
      .populate('client', 'name email');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await rzp.orders.create({
      amount: Math.round(invoice.total * 100), // paise
      currency: 'INR',
      receipt: invoice.invoiceNumber,
      notes: { invoiceId: invoice._id.toString(), clientName: invoice.client?.name },
    });

    invoice.razorpayOrderId = order.id;
    await invoice.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client?.name,
    });
  } catch (err) {
    console.error('Razorpay order error:', err.message);
    res.status(500).json({ message: 'Payment gateway error: ' + err.message });
  }
};

// Razorpay: Verify payment and mark invoice paid
exports.verifyPayment = async (req, res) => {
  try {
    const crypto = require('crypto');
    const Invoice = require('../models/Invoice');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body).digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const invoice = await Invoice.findByIdAndUpdate(invoiceId, {
      status: 'paid',
      paidAt: new Date(),
      razorpayPaymentId: razorpay_payment_id,
    }, { new: true });

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Razorpay verify error:', err.message);
    res.status(500).json({ message: err.message });
  }
};