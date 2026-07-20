require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.log('No user found.');
  } else {
    console.log(`isVerified: ${user.isVerified}`);
  }
  process.exit(0);
})();
