const User = require('../models/User');
const Freelancer = require('../models/Freelancer');
const Gig = require('../models/Gig');
const Payment = require('../models/Payment');
const Dispute = require('../models/Dispute');
const Settings = require('../models/Settings');

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeFreelancers = await User.countDocuments({ role: 'freelancer', isSuspended: false });
    const openDisputes = await Dispute.countDocuments({ status: { $in: ['open', 'reviewing'] } });
    const payments = await Payment.find({ status: { $in: ['escrow', 'released'] } });
    const platformRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({ totalUsers, activeFreelancers, platformRevenue, openDisputes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleSuspend = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isSuspended = !user.isSuspended;
    user.status = user.isSuspended ? 'suspended' : 'active';
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyFreelancer = async (req, res) => {
  try {
    const freelancer = await Freelancer.findOneAndUpdate(
      { user: req.params.userId },
      { verificationBadge: true },
      { new: true }
    );
    if (!freelancer) return res.status(404).json({ message: 'Freelancer profile not found' });
    await User.findByIdAndUpdate(req.params.userId, { isVerified: true });
    res.json(freelancer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({}).populate('client', 'name').sort({ createdAt: -1 });
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getPendingGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ status: 'pending' }).populate('client', 'name email').sort({ createdAt: -1 });
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.approveGig = async (req, res) => {
  try {
    const gig = await Gig.findByIdAndUpdate(req.params.id, { status: 'open' }, { new: true });
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.rejectGig = async (req, res) => {
  try {
    const gig = await Gig.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'global' });
    if (!settings) {
      settings = await Settings.create({ key: 'global', manualGigApprovalEnabled: false });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateSettings = async (req, res) => {
  try {
    const { manualGigApprovalEnabled } = req.body;
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { manualGigApprovalEnabled },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





