const Proposal = require('../models/Proposal');
const Gig = require('../models/Gig');
const notify = require('../utils/notify');

exports.createProposal = async (req, res) => {
  try {
    const { gig, description, bidAmount, estimatedDays } = req.body;

    const gigDoc = await Gig.findById(gig);
    if (!gigDoc) return res.status(404).json({ message: 'Gig not found' });
    if (gigDoc.status !== 'open') return res.status(400).json({ message: 'Gig is not open for proposals' });

    const existing = await Proposal.findOne({ gig, freelancer: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already applied to this gig' });

    const proposal = await Proposal.create({
      gig,
      freelancer: req.user._id,
      description,
      bidAmount,
      estimatedDays,
      offers: [{ by: 'freelancer', amount: bidAmount, estimatedDays, message: description }],
    });
    res.status(201).json(proposal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProposalsForGig = async (req, res) => {
  try {
    const gigDoc = await Gig.findById(req.params.gigId);
    if (!gigDoc) return res.status(404).json({ message: 'Gig not found' });
    if (gigDoc.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const proposals = await Proposal.find({ gig: req.params.gigId })
      .populate('freelancer', 'name email')
      .sort({ createdAt: -1 });
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id })
      .populate('gig', 'title budget status')
      .sort({ createdAt: -1 });
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProposalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const proposal = await Proposal.findById(req.params.id).populate('gig');
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    if (proposal.gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    proposal.status = status;

    if (status === 'accepted') {
      const lastOffer = proposal.offers[proposal.offers.length - 1];
      proposal.bidAmount = lastOffer.amount;
      proposal.estimatedDays = lastOffer.estimatedDays;
    }

    await proposal.save();

    const io = req.app.get('io');

    if (status === 'accepted') {
      await Gig.findByIdAndUpdate(proposal.gig._id, {
        status: 'in_progress',
        assignedFreelancer: proposal.freelancer,
      });
      await Proposal.updateMany(
        { gig: proposal.gig._id, _id: { $ne: proposal._id }, status: { $in: ['pending', 'negotiating'] } },
        { status: 'rejected' }
      );

      await notify(
        io,
        proposal.freelancer,
        'proposal_accepted',
        `Your proposal for "${proposal.gig.title}" was accepted`,
        `/gigs/${proposal.gig._id}`
      );
    } else {
      await notify(
        io,
        proposal.freelancer,
        'proposal_rejected',
        `Your proposal for "${proposal.gig.title}" was rejected`,
        `/freelancer/proposals`
      );
    }

    res.json(proposal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.counterProposal = async (req, res) => {
  try {
    const { amount, estimatedDays, message } = req.body;
    if (!amount || !estimatedDays) {
      return res.status(400).json({ message: 'Amount and estimated days are required' });
    }

    const proposal = await Proposal.findById(req.params.id).populate('gig');
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    if (proposal.gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!['pending', 'negotiating'].includes(proposal.status)) {
      return res.status(400).json({ message: 'This proposal is no longer open for negotiation' });
    }

    proposal.offers.push({ by: 'client', amount, estimatedDays, message });
    proposal.status = 'negotiating';
    await proposal.save();

    const io = req.app.get('io');
    await notify(
      io,
      proposal.freelancer,
      'proposal_countered',
      `${req.user.name} sent a counter-offer on your proposal for "${proposal.gig.title}"`,
      `/freelancer/proposals`
    );

    res.json(proposal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.respondToOffer = async (req, res) => {
  try {
    const { action, amount, estimatedDays, message } = req.body;
    if (!['accept', 'reject', 'counter'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const proposal = await Proposal.findById(req.params.id).populate('gig');
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    if (proposal.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (proposal.status !== 'negotiating') {
      return res.status(400).json({ message: 'This proposal is not currently in negotiation' });
    }

    const io = req.app.get('io');

    if (action === 'reject') {
      proposal.status = 'rejected';
      await proposal.save();
      await notify(
        io,
        proposal.gig.client,
        'proposal_declined',
        `${req.user.name} declined your counter-offer for "${proposal.gig.title}"`,
        `/client/gigs/${proposal.gig._id}/proposals`
      );
      return res.json(proposal);
    }

    if (action === 'counter') {
      if (!amount || !estimatedDays) {
        return res.status(400).json({ message: 'Amount and estimated days are required' });
      }
      proposal.offers.push({ by: 'freelancer', amount, estimatedDays, message });
      await proposal.save();
      await notify(
        io,
        proposal.gig.client,
        'proposal_countered',
        `${req.user.name} sent a new counter-offer for "${proposal.gig.title}"`,
        `/client/gigs/${proposal.gig._id}/proposals`
      );
      return res.json(proposal);
    }

    const lastOffer = proposal.offers[proposal.offers.length - 1];
    proposal.status = 'accepted';
    proposal.bidAmount = lastOffer.amount;
    proposal.estimatedDays = lastOffer.estimatedDays;
    await proposal.save();

    await Gig.findByIdAndUpdate(proposal.gig._id, {
      status: 'in_progress',
      assignedFreelancer: proposal.freelancer,
    });
    await Proposal.updateMany(
      { gig: proposal.gig._id, _id: { $ne: proposal._id }, status: { $in: ['pending', 'negotiating'] } },
      { status: 'rejected' }
    );

    await notify(
      io,
      proposal.gig.client,
      'proposal_accepted',
      `${req.user.name} accepted your counter-offer for "${proposal.gig.title}"`,
      `/client/gigs/${proposal.gig._id}/proposals`
    );

    res.json(proposal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
