const { GoogleGenerativeAI } = require('@google/generative-ai');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Invoice = require('../models/Invoice');
const TimeLog = require('../models/TimeLog');
const Expense = require('../models/Expense');

exports.processChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const freelancerId = req.user._id;

    // 1. Fetch current freelancer data for context
    const [clients, projects, invoices, logs, expenses] = await Promise.all([
      Client.find({ freelancer: freelancerId }),
      Project.find({ freelancer: freelancerId }),
      Invoice.find({ freelancer: freelancerId }),
      TimeLog.find({ freelancer: freelancerId }),
      Expense.find({ freelancer: freelancerId }),
    ]);

    // Calculate metrics
    const clientCount = clients.length;
    const projectCount = projects.length;
    const invoiceCount = invoices.length;
    const totalEarned = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.total, 0);
    const pendingAmount = invoices.filter(i => i.status !== 'paid').reduce((acc, i) => acc + i.total, 0);
    const totalHours = (logs.reduce((acc, l) => acc + l.duration, 0) / 60).toFixed(1);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalEarned - totalExpenses;

    const systemContext = `
You are the FreelanceOS Assistant, a premium AI coach and accountant built into FreelanceOS.
You help freelancers manage clients, invoices, time tracking, and expenses.

Here is the current freelancer's business data:
- Freelancer Name: ${req.user.name}
- Total Clients: ${clientCount}
- Total Projects: ${projectCount}
- Total Invoices: ${invoiceCount} (Pending/Unpaid: ${invoices.filter(i => i.status !== 'paid').length})
- Total Earned (Revenue from Paid Invoices): ₹${Number(totalEarned).toLocaleString('en-IN')}
- Total Expenses: ₹${Number(totalExpenses).toLocaleString('en-IN')}
- Net Profit: ₹${Number(netProfit).toLocaleString('en-IN')}
- Hours Tracked: ${totalHours} hours

Details:
Clients: ${clients.map(c => `${c.name} (${c.company || 'No Company'}, ${c.email})`).join(', ') || 'None'}
Projects: ${projects.map(p => `${p.title} (${p.status || 'active'})`).join(', ') || 'None'}
Expenses: ${expenses.map(e => `${e.title}: ₹${e.amount} (${e.category})`).join(', ') || 'None'}
Recent Invoices: ${invoices.map(i => `${i.invoiceNumber}: ₹${i.total} (${i.status})`).join(', ') || 'None'}

Formatting:
- Write responses in clean, brief Markdown.
- Use lists, bold styling, or code blocks where appropriate.
- Be highly professional, concise, and helpful.
`;

    // 2. Check if Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using stable gemini model
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const prompt = `${systemContext}\n\nUser Question: ${message}\nAssistant Response:`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return res.json({ reply: text });
      } catch (geminiError) {
        console.error('Gemini error, falling back to other providers or rule-based parser:', geminiError.message);
      }
    }

    // Check if Anthropic API key exists
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
            system: systemContext,
            messages: [{ role: 'user', content: message }],
          }),
        });

        const data = await response.json();
        if (response.ok && data.content && data.content[0] && data.content[0].text) {
          const text = data.content[0].text.trim();
          return res.json({ reply: text });
        } else {
          console.error('Anthropic API returned unexpected response format:', data);
          const errMsg = data.error?.message || 'Unknown Anthropic API error';
          return res.json({ 
            reply: `⚠️ **AI Chatbot Error**: I tried to use your Anthropic API key, but the API returned an error:\n\n*"${errMsg}"*\n\nPlease make sure your API key is correct and has sufficient credits. Falling back to predefined dashboard commands.` 
          });
        }
      } catch (anthropicError) {
        console.error('Anthropic error, falling back to rule-based parser:', anthropicError.message);
      }
    }

    // 3. Rule-based Parser (Fallback)
    const lowerMessage = message.toLowerCase();
    let reply = '';

    if (lowerMessage.includes('stat') || lowerMessage.includes('summary') || lowerMessage.includes('dashboard') || lowerMessage.includes('how am i doing')) {
      reply = `### 📊 Business Summary for **${req.user.name}**
Here is a snapshot of your freelancer statistics:
- **Clients:** ${clientCount} active client(s)
- **Projects:** ${projectCount} project(s)
- **Time Tracked:** ${totalHours} hrs logged
- **Total Revenue:** ₹${Number(totalEarned).toLocaleString('en-IN')} (Paid)
- **Pending Invoices:** ₹${Number(pendingAmount).toLocaleString('en-IN')} (Outstanding)
- **Total Expenses:** ₹${Number(totalExpenses).toLocaleString('en-IN')}
- **Net Profit:** **₹${Number(netProfit).toLocaleString('en-IN')}** ${netProfit >= 0 ? '📈' : '📉'}`;
    } 
    else if (lowerMessage.includes('revenue') || lowerMessage.includes('earned') || lowerMessage.includes('income') || lowerMessage.includes('money')) {
      reply = `### 💰 Revenue Breakdown
- **Paid Receipts:** ₹${Number(totalEarned).toLocaleString('en-IN')}
- **Unpaid Invoices:** ₹${Number(pendingAmount).toLocaleString('en-IN')}
- **Net Balance:** ₹${Number(netProfit).toLocaleString('en-IN')} (after subtracting expenses)
- **Recent Invoices:**
${invoices.slice(0, 5).map(i => `  - **${i.invoiceNumber}**: ₹${i.total.toLocaleString('en-IN')} (${i.status.toUpperCase()})`).join('\n') || '  - No invoices created yet.'}`;
    } 
    else if (lowerMessage.includes('expense')) {
      reply = `### 💳 Expense Overview
- **Total Expenses:** ₹${Number(totalExpenses).toLocaleString('en-IN')}
- **Expense Log:**
${expenses.slice(0, 5).map(e => `  - **${e.title}**: ₹${e.amount.toLocaleString('en-IN')} *(${e.category})* on ${new Date(e.date).toLocaleDateString('en-IN')}`).join('\n') || '  - No expenses recorded yet.'}
- **Category breakdown:** Software, Hardware, Marketing, Travel, Office, and Others.`;
    } 
    else if (lowerMessage.includes('client')) {
      reply = `### 👥 Client Directory
You have **${clientCount}** client(s):
${clients.map(c => `- **${c.name}** ${c.company ? `(${c.company})` : ''} — \`${c.email}\``).join('\n') || '- No clients logged yet.'}`;
    } 
    else if (lowerMessage.includes('project') || lowerMessage.includes('task') || lowerMessage.includes('kanban')) {
      reply = `### 📁 Active Projects
You are currently managing **${projectCount}** project(s):
${projects.map(p => `- **${p.title}** (Budget: ₹${Number(p.budget || 0).toLocaleString('en-IN')})`).join('\n') || '- No projects found.'}`;
    } 
    else if (lowerMessage.includes('email') || lowerMessage.includes('reminder') || lowerMessage.includes('unpaid') || lowerMessage.includes('remind')) {
      const unpaidInvoices = invoices.filter(i => i.status !== 'paid');
      if (unpaidInvoices.length === 0) {
        reply = `All invoices are currently marked as **paid**! No outstanding invoices require email reminders. 🎉`;
      } else {
        const sampleInv = unpaidInvoices[0];
        const sampleClient = clients.find(c => String(c._id) === String(sampleInv.client));
        const clientName = sampleClient ? sampleClient.name : '[Client Name]';
        const invoiceNum = sampleInv.invoiceNumber;
        const totalAmt = sampleInv.total;
        
        reply = `### ✉️ Payment Reminder Email Draft
Here is a template you can copy and send to your client:

\`\`\`text
Subject: Invoice Payment Reminder: ${invoiceNum}

Dear ${clientName},

I hope you are doing well.

This is a gentle reminder that invoice ${invoiceNum} for the amount of ₹${Number(totalAmt).toLocaleString('en-IN')} is currently outstanding.

Please let me know if you need any assistance with the payment details.

Best regards,
${req.user.name}
\`\`\``;
      }
    } 
    else {
      reply = `Hello **${req.user.name}**! 👋 

I am your **FreelanceOS Assistant**. I can help you query data from your dashboard. Try asking me:
- 📊 *"Show my dashboard summary"*
- 💰 *"How much revenue did I earn?"*
- 💳 *"List my expenses"*
- 👥 *"Who are my clients?"*
- 📁 *"Tell me about my projects"*
- ✉️ *"Draft a payment reminder email"*`;
    }

    res.json({ reply });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
