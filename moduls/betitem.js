import mongoose from "mongoose";

const betItemSchema = new mongoose.Schema({
  product_id: { type: String, unique: true },
  name: { type: String, required: true },
  description: String,
  image: String,
  coin_price: { type: Number, default: 0 },
  main_price: { type: Number, default: 0 },
  start_time: Date,
  end_time: Date,
});

export default mongoose.model("BetItem", betItemSchema);
