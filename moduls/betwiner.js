// Winner Mongoose schema
import mongoose from "mongoose";

const WinnerSchema = new mongoose.Schema({
  product_id: { type: String, required: true, index: true, unique: true },
  product_name: { type: String },
  product_image: { type: String },
  product_price: { type: Number },
  user_email: { type: String, required: true },
  user_name: { type: String },
  bet_code: { type: String },
  date: { type: Date, default: () => new Date() },
});

export const Winner = mongoose.models.Winner || mongoose.model("Winner", WinnerSchema);
