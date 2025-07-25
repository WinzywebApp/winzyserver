import mongoose from "mongoose";

const adWatchSchema = new mongoose.Schema({
 ad_id: { type: String, required: true },
user_id: { type: String, required: true },
coinsEarned: { type: Number, default: 0 },
watchedAt: { type: Date, default: Date.now },

});

adWatchSchema.index({ user_id: 1, watchedAt: 1 }); 

export default mongoose.model("AdWatch", adWatchSchema);
