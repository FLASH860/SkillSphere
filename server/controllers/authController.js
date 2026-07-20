const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const Client = require('../models/Client');
const Freelancer = require('../models/Freelancer');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/mailer');

function makeToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

async function sendVerificationEmail(user) {
  const { raw, hash } = makeToken();
  user.emailVerificationToken = hash;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  const link = `${process.env.CLIENT_URL}/verify-email/${raw}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your SkillSphere email',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#14192B;">Welcome to SkillSphere, ${user.name}</h2>
        <p>Confirm your email address to unlock the verified badge on your profile.</p>
        <p><a href="${link}" style="background:#E8A33D;color:#14192B;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Verify Email</a></p>
        <p style="color:#888;font-size:12px;">This link expires in 24 hours. If the button doesn't work, paste this URL into your browser:<br/>${link}</p>
      </div>
    `,
  });
}

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, role });
    if (role === 'client') await Client.create({ user: user._id });
    if (role === 'freelancer') await Freelancer.create({ user: user._id });

    sendVerificationEmail(user).catch((err) => console.error('Verification email error:', err.message));

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, twoFactorCode } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password +twoFactorSecret');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.isSuspended) return res.status(403).json({ message: 'Account suspended' });

    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({ twoFactorRequired: true, userId: user._id });
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 1,
      });
      if (!verified) return res.status(401).json({ message: 'Invalid 2FA code' });
    }

    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

exports.setup2FA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `SkillSphere (${req.user.email})` });
    await User.findByIdAndUpdate(req.user._id, { twoFactorSecret: secret.base32 });
    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ qrDataUrl, secret: secret.base32 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.enable2FA = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
    if (!verified) return res.status(400).json({ message: 'Invalid code' });
    user.twoFactorEnabled = true;
    await user.save();
    res.json({ message: '2FA enabled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: false, twoFactorSecret: null });
    res.json({ message: '2FA disabled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hash,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) return res.status(400).json({ message: 'Invalid or expired verification link' });

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });

    await sendVerificationEmail(user);
    res.json({ message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const { raw, hash } = makeToken();
      user.resetPasswordToken = hash;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
      await user.save();

      const link = `${process.env.CLIENT_URL}/reset-password/${raw}`;
      await sendEmail({
        to: user.email,
        subject: 'Reset your SkillSphere password',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color:#14192B;">Password reset requested</h2>
            <p>Click below to set a new password. This link expires in 1 hour.</p>
            <p><a href="${link}" style="background:#E8A33D;color:#14192B;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Reset Password</a></p>
            <p style="color:#888;font-size:12px;">If you didn't request this, you can safely ignore this email.<br/>${link}</p>
          </div>
        `,
      });
    }

    res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hash,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset link' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
