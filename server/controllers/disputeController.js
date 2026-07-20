const Dispute = require('../models/Dispute');
const Gig = require('../models/Gig');

exports.createDispute = async (req, res) => {
  try {
    const { gig, reason, evidenceUrls } = req.body;
    const gigDoc = await Gig.findById(gig);
    if (!gigDoc) return res.status(404).json({ message: 'Gig not found' });

    const isParty =
      gigDoc.client.toString() === req.user._id.toString() ||
      gigDoc.assignedFreelancer?.toString() === req.user._id.toString();
    if (!isParty) return res.status(403).json({ message: 'Not authorized to raise a dispute on this gig' });

    const dispute = await Dispute.create({
      gig,
      raisedBy: req.user._id,
      reason,
      evidenceUrls: evidenceUrls || [],
    });
    res.status(201).json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ raisedBy: req.user._id })
      .populate('gig', 'title')
      .sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({})
      .populate('gig', 'title')
      .populate('raisedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDisputeStatus = async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;
    if (!['open', 'reviewing', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status, resolutionNote },
      { new: true }
    );
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    res.json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
