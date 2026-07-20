require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const Freelancer = require('../models/Freelancer');

const email = process.argv[2];
if (!email) {
  console.log('Usage: node scripts/deleteUser.js someone@example.com');
  process.exit(1);
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.log('No user found with that email.');
    process.exit(0);
  }
  await Client.deleteMany({ user: user._id });
  await Freelancer.deleteMany({ user: user._id });
  await User.deleteOne({ _id: user._id });
  console.log(`Deleted user ${email} and any linked Client/Freelancer records.`);
  process.exit(0);
})();
