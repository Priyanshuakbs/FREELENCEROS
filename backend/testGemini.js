const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const title = "AI Web App Redesign";
  const description = "Build a professional web app with modern UI";
  const amount = "50000";
  
  const prompt = `You are a professional legal assistant for freelancers. Generate professional contract clauses/terms based on the following details.

Contract Title: "${title}"
Project Description: "${description || 'Web development services'}"
Budget/Amount: ₹${amount || 'Not Specified'}

Generate a structured set of professional contract clauses (e.g. 1. Scope of Work, 2. Payment Terms, 3. Revision Policy, 4. Intellectual Property, 5. Termination).
Keep the terms realistic, specific to the description, and legally professional.
Return ONLY the numbered clauses, do NOT include extra markdown formatting, intro or outro text. Just the clauses text.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    console.log('Gemini Response: SUCCESS!');
    console.log(result.response.text().trim());
  } catch (error) {
    console.error('Gemini Error Details:');
    console.error('Message:', error.message);
  }
}

test();
