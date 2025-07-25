import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },

  type: {
    type: String,
    default: "customer"
  },

  password: {
    type: String,
    required: true
  },

  username: {
    type: String,
    required: true,
    unique: true
  },

  isblock: {
    type: Boolean,
    default: false
  },

  coin_balance: {
    type: Number,
    default: 0
  },

  main_balance: {
    type: Number,
    default: 0
  },

  refaral_count: {
    type: Number,
    default: 0,
    required: true
  },

  refaral_code: {
    type: String
  },

  user_id: {
    type: String,
    required: true
  },

  // 🔄 Spin Tracking
  spinsToday: {
    type: Number,
    default: 0
  },

  lastSpinAt: {
    type: Date
  },

  // 🏆 Daily Winner Tracking
  dailyWinnerDate: {
    type: Date
  },

  // ❓ Quiz Tracking
  dailyQuizCount: {
    type: Number,
    default: 0
  },

  lastQuizAt: {
    type: Date
  }

}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
