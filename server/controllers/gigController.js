const Gig = require('../models/Gig');
const Client = require('../models/Client');
const Settings = require('../models/Settings');

exports.createGig = async (req, res) => {
  try {
    const { title, description, skillsRequired, budget, milestones, location } = req.body;
    const settings = await Settings.findOne({ key: 'global' });
    const approvalRequired = settings?.manualGigApprovalEnabled || false;
    const gig = await Gig.create({
      client: req.user._id,
      title,
      description,
      skillsRequired,
      budget,
      milestones,
      location,
      status: approvalRequired ? 'pending' : 'open',
    });
    await Client.findOneAndUpdate({ user: req.user._id }, { $inc: { gigsPosted: 1 } });
    res.status(201).json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGigs = async (req, res) => {
  try {
    const { skill, minBudget, maxBudget, city, remote, minRating, status } = req.query;
    const query = { status: status || 'open' };
    if (skill) query.skillsRequired = { $in: [new RegExp(skill, 'i')] };
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (remote === 'true') query['location.remote'] = true;
    if (minBudget || maxBudget) {
      query['budget.max'] = {};
      if (minBudget) query['budget.max'].$gte = Number(minBudget);
      if (maxBudget) query['budget.min'] = { $lte: Number(maxBudget) };
    }
    let gigs = await Gig.find(query)
      .populate('client', 'name')
      .sort({ createdAt: -1 });
    if (minRating) {
      const clientIds = gigs.map((g) => g.client._id);
      const clients = await Client.find({ user: { $in: clientIds } });
      const ratingMap = {};
      clients.forEach((c) => { ratingMap[c.user.toString()] = c.ratingAvg; });
      gigs = gigs.filter((g) => (ratingMap[g.client._id.toString()] || 0) >= Number(minRating));
    }
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGigById = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('client', 'name email')
      .populate('assignedFreelancer', 'name email');
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ client: req.user._id }).sort({ createdAt: -1 });
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { progressPercent } = req.body;
    if (progressPercent === undefined || progressPercent < 0 || progressPercent > 100) {
      return res.status(400).json({ message: 'progressPercent must be between 0 and 100' });
    }
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    if (!gig.assignedFreelancer || gig.assignedFreelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the assigned freelancer can update progress' });
    }
    gig.progressPercent = progressPercent;
    await gig.save();
    const populated = await Gig.findById(gig._id)
      .populate('client', 'name email')
      .populate('assignedFreelancer', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAssignedGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ assignedFreelancer: req.user._id })
      .populate('client', 'name')
      .sort({ updatedAt: -1 });
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the gig owner can edit this gig' });
    }
    if (gig.status !== 'open') {
      return res.status(400).json({ message: 'Gig can only be edited while open' });
    }
    const { title, description, skillsRequired, budget, milestones, location } = req.body;
    gig.title = title ?? gig.title;
    gig.description = description ?? gig.description;
    gig.skillsRequired = skillsRequired ?? gig.skillsRequired;
    gig.budget = budget ?? gig.budget;
    gig.milestones = milestones ?? gig.milestones;
    gig.location = location ?? gig.location;
    await gig.save();
    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


