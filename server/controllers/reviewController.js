const Review = require('../models/Review');
const Gig = require('../models/Gig');
const Client = require('../models/Client');
const Freelancer = require('../models/Freelancer');
const User = require('../models/User');

const HALF_LIFE_DAYS = 90;
const PRIOR_MEAN = 4.0;
const PRIOR_WEIGHT = 3;

const computeWeightedScore = (reviews) => {
  if (reviews.length === 0) return 0;
  const now = Date.now();
  let weightedSum = 0;
  let weightTotal = 0;

  reviews.forEach((r) => {
    const ageDays = (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    weightedSum += r.rating * recencyWeight;
    weightTotal += recencyWeight;
  });

  const bayesianScore = (PRIOR_WEIGHT * PRIOR_MEAN + weightedSum) / (PRIOR_WEIGHT + weightTotal);
  return Math.round(bayesianScore * 10) / 10;
};

const recalculateRating = async (userId) => {
  const reviews = await Review.find({ reviewee: userId });
  if (reviews.length === 0) return;

  const score = computeWeightedScore(reviews);
  const user = await User.findById(userId);

  if (user.role === 'freelancer') {
    await Freelancer.findOneAndUpdate({ user: userId }, { reputationScore: score });
  } else if (user.role === 'client') {
    await Client.findOneAndUpdate({ user: userId }, { ratingAvg: score });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { gig, reviewee, rating, comment } = req.body;

    const gigDoc = await Gig.findById(gig);
    if (!gigDoc) return res.status(404).json({ message: 'Gig not found' });

    const isClient = gigDoc.client.toString() === req.user._id.toString();
    const isAssignedFreelancer = gigDoc.assignedFreelancer?.toString() === req.user._id.toString();

    if (!isClient && !isAssignedFreelancer) {
      return res.status(403).json({ message: 'Not authorized to review this gig' });
    }
    if (gigDoc.status !== 'completed' && gigDoc.status !== 'in_progress') {
      return res.status(400).json({ message: 'Gig must be in progress or completed to leave a review' });
    }

    const existing = await Review.findOne({ gig, reviewer: req.user._id, reviewee });
    if (existing) return res.status(400).json({ message: 'You already reviewed this user for this gig' });

    const review = await Review.create({
      gig,
      reviewer: req.user._id,
      reviewee,
      rating,
      comment,
      weightedScore: rating,
    });

    await recalculateRating(reviewee);

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReviewsForUser = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name')
      .populate('gig', 'title')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReviewsForGig = async (req, res) => {
  try {
    const reviews = await Review.find({ gig: req.params.gigId })
      .populate('reviewer', 'name')
      .populate('reviewee', 'name');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReviewAnalytics = async (req, res) => {
  try {
    const userId = req.params.userId;
    const reviews = await Review.find({ reviewee: userId });
    const totalReviews = reviews.length;

    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      name: `${star}\u2605`,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    const rawAverage = totalReviews > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

    const weightedScore = computeWeightedScore(reviews);

    res.json({ totalReviews, rawAverage, weightedScore, distribution });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
