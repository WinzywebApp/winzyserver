import mongoose from "mongoose";

const giftCodeSchema = new mongoose.Schema(
  {
    /** 🔢 අහඹු හෝ ඔබ යනවනම් UUID වර්ගයක කේතය */
    code: {
      type: String,
      required: true,
      unique: true,
    },
    /** 🪙 ලබා දිය යුතු coins ප්‍රමාණය */
    coins: {
      type: Number,
      required: true,
      min: 1,
    },
    /** ⚠️ ඇතුළත් කළ විට auto‑set වෙන දින 23:59 (Asia/Colombo) */
    expireAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index → doc auto‑delete
    },
  
    createdBy: {
      type: String,
      ref: "User",
},
    redeemedBy: {
       type: [String], // Array of user_ids
       default: [],
}

  },
  { timestamps: true }
);

export default mongoose.model("GiftCode", giftCodeSchema);
