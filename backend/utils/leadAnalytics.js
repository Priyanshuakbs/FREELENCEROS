const Lead = require("../models/Lead");

const getLeadAnalytics = async (userId) => {
  const totalLeads = await Lead.countDocuments({
    createdBy: userId,
  });

  const newLeads = await Lead.countDocuments({
    createdBy: userId,
    status: "New",
  });

  const contacted = await Lead.countDocuments({
    createdBy: userId,
    status: "Contacted",
  });

  const qualified = await Lead.countDocuments({
    createdBy: userId,
    status: "Qualified",
  });

  const proposalSent = await Lead.countDocuments({
    createdBy: userId,
    status: "Proposal Sent",
  });

  const negotiation = await Lead.countDocuments({
    createdBy: userId,
    status: "Negotiation",
  });

  const converted = await Lead.countDocuments({
    createdBy: userId,
    status: "Converted",
  });

  const lost = await Lead.countDocuments({
    createdBy: userId,
    status: "Lost",
  });

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);

  tomorrow.setDate(today.getDate() + 1);

  const followUps = await Lead.countDocuments({
    createdBy: userId,
    followUpDate: {
      $gte: today,
      $lt: tomorrow,
    },
  });

  const sourceAnalytics = await Lead.aggregate([
    {
      $match: {
        createdBy: userId,
      },
    },
    {
      $group: {
        _id: "$source",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);

  return {
    totalLeads,
    newLeads,
    contacted,
    qualified,
    proposalSent,
    negotiation,
    converted,
    lost,
    followUps,
    sourceAnalytics,
  };
};

module.exports = getLeadAnalytics;