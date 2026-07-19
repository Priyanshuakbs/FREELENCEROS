const validateLead = (req, res, next) => {
  const { name, email, phone, status, priority, source } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Lead name is required' });
  }

  if (email && email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }
  }

  if (phone && phone.trim() !== '' && phone.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ success: false, message: 'Phone number must be at least 10 digits' });
  }

  const validStatus = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'];
  if (status && !validStatus.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid lead status' });
  }

  const validPriority = ['Low', 'Medium', 'High'];
  if (priority && !validPriority.includes(priority)) {
    return res.status(400).json({ success: false, message: 'Invalid priority' });
  }

  const validSource = ['Website', 'WhatsApp', 'Instagram', 'Facebook', 'LinkedIn', 'Referral', 'Walk-in', 'Cold Outreach', 'Other'];
  if (source && !validSource.includes(source)) {
    return res.status(400).json({ success: false, message: 'Invalid lead source' });
  }

  next();
};

module.exports = validateLead;