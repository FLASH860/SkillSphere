const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const Freelancer = require('../models/Freelancer');

exports.getClientStats = async (req, res) => {
  try {
    const gigs = await Gig.find({ client: req.user._id });
    const proposalCounts = await Proposal.aggregate([
      { $lookup: { from: 'gigs', localField: 'gig', foreignField: '_id', as: 'gigDoc' }},
      { $unwind: '$gigDoc' },
      { $match: { 'gigDoc.client': req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusBreakdown = gigs.reduce((acc, g) => {
      acc[g.status] = (acc[g.status] || 0) + 1;
      return acc;
    }, {});

    const monthly = {};
    gigs.forEach((g) => {
      const month = new Date(g.createdAt).toLocaleString('default', { month: 'short' });
      monthly[month] = (monthly[month] || 0) + 1;
    });

    res.json({
      totalGigs: gigs.length,
      statusBreakdown: Object.entries(statusBreakdown).map(([name, value]) => ({ name, value })),
      proposalBreakdown: proposalCounts.map((p) => ({ name: p._id, value: p.count })),
      gigsPerMonth: Object.entries(monthly).map(([name, gigs]) => ({ name, gigs })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFreelancerStats = async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id }).populate('gig');

    const statusBreakdown = proposals.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    const earnings = proposals
      .filter((p) => p.status === 'accepted')
      .map((p) => ({ name: p.gig?.title?.slice(0, 15) || 'Gig', amount: p.bidAmount }));

    const decided = proposals.filter((p) => p.status === 'accepted' || p.status === 'rejected');
    const accepted = decided.filter((p) => p.status === 'accepted').length;
    const jobSuccessRate = decided.length > 0 ? Math.round((accepted / decided.length) * 100) : null;

    const freelancerProfile = await Freelancer.findOne({ user: req.user._id });
    const profileViews = freelancerProfile?.profileViews || 0;

    res.json({
      totalProposals: proposals.length,
      statusBreakdown: Object.entries(statusBreakdown).map(([name, value]) => ({ name, value })),
      earnings,
      jobSuccessRate,
      decidedCount: decided.length,
      profileViews,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
