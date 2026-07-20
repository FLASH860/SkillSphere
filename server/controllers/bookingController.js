const Booking = require('../models/Booking');
const Gig = require('../models/Gig');
const notify = require('../utils/notify');

exports.createBooking = async (req, res) => {
  try {
    const { gig, day, slot, message } = req.body;
    if (!gig || !day || !slot) {
      return res.status(400).json({ message: 'gig, day, and slot are required' });
    }

    const gigDoc = await Gig.findById(gig);
    if (!gigDoc) return res.status(404).json({ message: 'Gig not found' });
    if (gigDoc.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!gigDoc.assignedFreelancer) {
      return res.status(400).json({ message: 'This gig has no assigned freelancer' });
    }

    const existing = await Booking.findOne({ gig, day, slot, freelancer: gigDoc.assignedFreelancer });
    if (existing) return res.status(400).json({ message: 'This slot has already been requested' });

    const booking = await Booking.create({
      freelancer: gigDoc.assignedFreelancer,
      client: req.user._id,
      gig,
      day,
      slot,
      message,
    });

    const io = req.app.get('io');
    await notify(
      io,
      gigDoc.assignedFreelancer,
      'booking_requested',
      `${req.user.name} requested a booking (${day}, ${slot}) for "${gigDoc.title}"`,
      `/freelancer/bookings`
    );

    res.status(201).json(booking);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This slot has already been requested' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ freelancer: req.user._id })
      .populate('client', 'name email')
      .populate('gig', 'title')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookingsForGig = async (req, res) => {
  try {
    const bookings = await Booking.find({ gig: req.params.gigId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id).populate('gig');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();

    const io = req.app.get('io');
    await notify(
      io,
      booking.client,
      status === 'confirmed' ? 'booking_confirmed' : 'booking_declined',
      `${req.user.name} ${status} your booking request (${booking.day}, ${booking.slot}) for "${booking.gig.title}"`,
      `/gigs/${booking.gig._id}`
    );

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
