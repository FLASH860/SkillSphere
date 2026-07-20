const Freelancer = require('../models/Freelancer');
const Gig = require('../models/Gig');
const { rankFreelancers } = require('../utils/matching');

exports.getRecommendedFreelancers = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });

    const freelancers = await Freelancer.find({}).populate('user', 'name');
    const ranked = rankFreelancers(gig.skillsRequired, freelancers);

    const top = ranked.slice(0, 5).map((r) => ({
      _id: r.freelancer.user._id,
      name: r.freelancer.user.name,
      skills: r.freelancer.skills,
      reputationScore: r.freelancer.reputationScore,
      hourlyRate: r.freelancer.hourlyRate,
      matchScore: Math.round(r.score * 100),
    }));

    res.json(top);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
