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
  },
  telegram_chat_id: {
    type: Number,
    default: null,
  },
  user_image:{
    type:String,
    default:"https://i.ibb.co/dwhB6Xy0/who-has-any-bart-simpson-pfps-not-the-horrible-emo-ones-v0-869inxr4zljd1.jpg"
  }

}, { timestamps: true });

const User = mongoose.model ("User", userSchema);

export default User;
  