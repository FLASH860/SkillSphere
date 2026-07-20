const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Gig = require('../models/Gig');
const notify = require('../utils/notify');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { gigId, milestoneId } = req.body;
    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });

    const milestone = gig.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the client can pay for this gig' });
    }
    if (!gig.assignedFreelancer) {
      return res.status(400).json({ message: 'No freelancer assigned to this gig yet' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: { name: `${gig.title} — ${milestone.title}` },
            unit_amount: Math.round(milestone.amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment-result?status=success&gigId=${gigId}&milestoneId=${milestoneId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-result?status=cancelled&gigId=${gigId}`,
      metadata: { gigId, milestoneId, payerId: req.user._id.toString(), payeeId: gig.assignedFreelancer.toString() },
    });

    await Payment.create({
      gig: gigId,
      milestone: milestone.title,
      payer: req.user._id,
      payee: gig.assignedFreelancer,
      amount: milestone.amount,
      razorpayOrderId: session.id,
      status: 'pending',
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { sessionId, gigId, milestoneId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    await Payment.findOneAndUpdate(
      { razorpayOrderId: sessionId },
      { status: 'escrow', razorpayPaymentId: session.payment_intent }
    );

    const gig = await Gig.findById(gigId);
    const milestone = gig.milestones.id(milestoneId);
    if (milestone) {
      milestone.status = 'paid';
      await gig.save();
    }

    res.json({ message: 'Payment confirmed', status: 'escrow' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.releaseMilestone = async (req, res) => {
  try {
    const { gigId, milestoneId } = req.body;
    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the client can release payment' });
    }

    const milestone = gig.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    await Payment.findOneAndUpdate(
      { gig: gigId, milestone: milestone.title, status: 'escrow' },
      { status: 'released' }
    );

    const io = req.app.get('io');
    await notify(
      io,
      gig.assignedFreelancer,
      'payment_received',
      `Payment released for "${milestone.title}" on "${gig.title}"`,
      `/gigs/${gigId}`
    );

    res.json({ message: 'Milestone released to freelancer' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPaymentsForGig = async (req, res) => {
  try {
    const payments = await Payment.find({ gig: req.params.gigId });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
