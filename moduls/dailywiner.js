// models/DailyWinner.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const dailyWinnerSchema = new Schema(
  {
    date: { type: Date, unique: true, required: true }, // Example: 2025‑07‑17 00:00
    user: { type: String, ref: 'User', required: true }, // Use custom user_id
  },
  { timestamps: true }
);

export default mongoose.model('DailyWinner', dailyWinnerSchema);
