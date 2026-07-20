const User = require('../models/User');
const Freelancer = require('../models/Freelancer');
const Client = require('../models/Client');

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  let profile;
  if (user.role === 'freelancer') {
    const isOwner = req.user && req.user._id.toString() === user._id.toString();
    if (!isOwner) {
      profile = await Freelancer.findOneAndUpdate(
        { user: user._id },
        { $inc: { profileViews: 1 } },
        { new: true, upsert: true }
      );
    } else {
      profile = await Freelancer.findOne({ user: user._id });
    }
  } else if (user.role === 'client') {
    profile = await Client.findOne({ user: user._id });
  } else {
    profile = {
      bio: user.bio,
      hourlyRate: user.hourlyRate,
      skills: user.skills,
      availability: user.availability,
      portfolio: user.portfolio,
      resumeUrl: user.resumeUrl,
      certifications: user.certifications,
      experience: user.experience,
    };
  }
  res.json({ user, profile });
};

exports.updateProfile = async (req, res) => {
  const { bio, hourlyRate, skills, availability, portfolio, resumeUrl, certifications, experience, ...restProfile } = req.body.profile || {};
  let user;
  let profile;

  if (req.user.role === 'freelancer') {
    user = await User.findByIdAndUpdate(req.user._id, req.body.user, { new: true });
    profile = await Freelancer.findOneAndUpdate(
      { user: req.user._id },
      { bio, hourlyRate, skills, availability, portfolio, resumeUrl, certifications, experience, ...restProfile },
      { new: true, upsert: true }
    );
  } else if (req.user.role === 'client') {
    user = await User.findByIdAndUpdate(req.user._id, req.body.user, { new: true });
    profile = await Client.findOneAndUpdate(
      { user: req.user._id },
      { bio, hourlyRate, skills, availability, portfolio, resumeUrl, certifications, experience, ...restProfile },
      { new: true, upsert: true }
    );
  } else {
    user = await User.findByIdAndUpdate(
      req.user._id,
      { ...req.body.user, bio, hourlyRate, skills, availability, portfolio, resumeUrl, certifications, experience },
      { new: true }
    );
    profile = {
      bio: user.bio,
      hourlyRate: user.hourlyRate,
      skills: user.skills,
      availability: user.availability,
      portfolio: user.portfolio,
      resumeUrl: user.resumeUrl,
      certifications: user.certifications,
      experience: user.experience,
    };
  }

  res.json({ user, profile });
};
