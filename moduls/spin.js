// models/spin.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const spinSchema = new Schema(
  {
    user: { type: String, ref: 'User', required: true }, // changed from ObjectId → String
    number: { type: Number, required: true },
    coins: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Spin', spinSchema);
