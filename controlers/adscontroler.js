import AdWatch from "../moduls/ads.js";
import User from "../moduls/user.js";
import { DateTime } from "luxon";

const MAX_ADS_PER_DAY = 20;
const COINS_PER_AD = 150;

export const watchAd = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get start of today
    const startOfToday = DateTime.now().startOf("day").toJSDate();

    // Count how many ads this user has watched today
    const adsWatchedTodayCount = await AdWatch.countDocuments({
      user_id: userId,
      watchedAt: { $gte: startOfToday },
    });

    if (adsWatchedTodayCount >= MAX_ADS_PER_DAY) {
      return res.status(429).json({
        success: false,
        message: "You reached max 20 ads for today",
      });
    }

    // ✅ Generate unique ad_id like ad_0005
    const totalAdCount = await AdWatch.countDocuments();
    const ad_id = `ad_${String(totalAdCount + 1).padStart(4, "0")}`; // ad_0001, ad_0002...

    // ✅ Save ad watch record (coins = 0 for now)
    await AdWatch.create({
      user_id: userId,
      ad_id,
      coinsEarned: 0,
    });

    // Respond to user immediately
    res.json({
      success: true,
      message: `Ad watched! Coins will be added in 15 seconds.`,
      ad_id,
      adsWatchedToday: adsWatchedTodayCount + 1,
      adsLeft: MAX_ADS_PER_DAY - (adsWatchedTodayCount + 1),
    });

    // ✅ Add coins after 18 seconds in background
    setTimeout(async () => {
      const user = await User.findOne({ user_id: userId });
      if (!user) return;

      user.coin_balance += COINS_PER_AD;
      await user.save();

      // Update AdWatch record with coin info
      await AdWatch.updateOne(
        { user_id: userId, ad_id },
        { $set: { coinsEarned: COINS_PER_AD } }
      );

      console.log(`✅ Coins added to ${userId} for ${ad_id} after 18s`);
    }, 16000);
  } catch (error) {
    console.error("Error watching ad:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};






export const getAdStats = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // අද දවස් පටන් ගන්න
    const startOfToday = DateTime.now().startOf("day").toJSDate();

    // අද දින බලපු ads ගණන
    const adsWatchedToday = await AdWatch.countDocuments({
      user_id: userId,
      watchedAt: { $gte: startOfToday },
    });

    res.json({
      success: true,
      adsWatchedToday,
      adsLeft: MAX_ADS_PER_DAY - adsWatchedToday,
    });
  } catch (error) {  
    console.error("Error fetching ad stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching ad stats",
    });
  }
};