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