// moduls/verificationCode.js
import mongoose from 'mongoose';

const verificationCodeSchema = new mongoose.Schema({
  user_id: { type: String, index: true, default: null }, // optional now
  telegram_chat_id: { type: String, required: true, index: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// TTL index: createdAt වලින් 30 තත්පරකට පසුව document එක auto-delete වෙනවා
verificationCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 });

// Composite uniqueness only on telegram_chat_id + code (user_id optional)
verificationCodeSchema.index(
  { telegram_chat_id: 1, code: 1 },
  { unique: true, partialFilterExpression: { code: { $exists: true } } }
);

const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);
export default VerificationCode;


