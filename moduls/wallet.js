import mongoose from "mongoose";
import { DateTime } from "luxon";

const PaymentRequestSchema = new mongoose.Schema({
  request_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  username: { type: String, required: true },
  amount: { type: Number, enum: [50, 500, 100], required: true },
  status: { type: String, enum: ["requested", "accepted"], default: "requested" },
  created_at: { type: String, default: () => DateTime.now().toISODate() }
});

export default mongoose.model("PaymentRequest", PaymentRequestSchema);
