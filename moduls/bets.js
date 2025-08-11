import mongoose from "mongoose";

const betSchema = new mongoose.Schema({
  bet_id: { type: String, unique: true, required: true },
  user_email: { type: String, required: true },
  code: { type: String, required: true },
  user_info: {
    name: String,
    address: String,
    city: String,
    contact: String,
  },
  product_id: { type: String, ref: "BetItem", required: true },
  product_name: String,
  product_price: Number,
  product_image: {
  type: String,
  required: true
},
  created_at: { type: Date, default: Date.now },
});


export default mongoose.model("Bet", betSchema);
