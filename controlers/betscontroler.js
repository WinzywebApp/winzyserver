import Bet from '../moduls/bets.js';
import BetItem from '../moduls/betitem.js';
import User from '../moduls/user.js';
import Winner from '../moduls/dailywiner.js';
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';

const TZ = 'Asia/Colombo';

// ✅ PLACE A BET
   

export async function placeBet(req, res) {
  try {
    const user = req.user;
    if (!user || !user.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { product_id, name, address, city, contact } = req.body;

    const dbUser = await User.findOne({ user_id: user.user_id });
    if (!dbUser) return res.status(404).json({ message: "User not found" });

    const product = await BetItem.findOne({ product_id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const now = DateTime.now().setZone(TZ);
    const start = DateTime.fromJSDate(product.start_time).setZone(TZ);
    const end = DateTime.fromJSDate(product.end_time).setZone(TZ);

    if (now < start) return res.status(400).json({ message: "Betting not started yet" });
    if (now > end) return res.status(400).json({ message: "Betting time is over" });

    if (dbUser.main_balance < product.main_price) {
      return res.status(400).json({ message: "Insufficient main balance" });
    }

    // Get latest bet_id (sorted descending)
    const latestBet = await Bet.findOne().sort({ bet_id: -1 }).exec();

    let nextIdNum = 1;
    if (latestBet && latestBet.bet_id) {
      // Extract number from bet_id like "bet_0005" -> 5
      const match = latestBet.bet_id.match(/bet_(\d+)/);
      if (match && match[1]) {
        nextIdNum = parseInt(match[1], 10) + 1;
      }
    }

    // Format new bet_id with padding zeros
    const newBetId = `bet_${String(nextIdNum).padStart(4, '0')}`;

    // Deduct balance
    dbUser.main_balance -= product.main_price;
    await dbUser.save();

    // Create new bet with newBetId
    const newBet = new Bet({
      bet_id: newBetId,
      user_email: dbUser.email,
      code: nanoid(8),
      user_info: { name, address, city, contact },
      product_id: product.product_id,
      product_name: product.name,
      product_price: product.main_price,
    });

    await newBet.save();

    res.status(201).json({ message: "Bet placed successfully", 
      bet: newBet, 
      remaining_balance: dbUser.main_balance  });

  } catch (err) {
    console.error("❌ Bet error:", err);
    res.status(500).json({ message: "Error placing bet", error: err.message });
  }
}







// ✅ ADMIN: GET ALL BETS
export async function getAllBets(req, res) {
  try {
    const bets = await Bet.find().sort({ created_at: -1 });
    res.json(bets);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bets", error: err.message });
  }
}

// ✅ GET USER’S OWN BETS
export async function getUserBets(req, res) {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const dbUser = await User.findOne({ user_id: userId });
    if (!dbUser) return res.status(404).json({ message: "User not found" });

    const bets = await Bet.find({ user_email: dbUser.email }).sort({ created_at: -1 });
    res.json(bets);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user bets", error: err.message });
  }
}

   

export async function selectWinnersForExpiredBets(req, res = null) {
  try {
    const now = DateTime.now().setZone(TZ);
    const betItems = await BetItem.find();

    for (const item of betItems) {
      const end = DateTime.fromJSDate(item.end_time).setZone(TZ);
      if (now < end.plus({ seconds: 5 })) continue;

      // Check if this item already has a winner
      const existingWinner = await Winner.findOne({ product_id: item.product_id });
      if (existingWinner) continue;

      // Find all bets placed on this item
      const bets = await Bet.find({ product_id: item.product_id });
      if (bets.length === 0) continue;

      // Get all users who have won before (regardless of product)
      const pastWinners = await Winner.find().distinct("user_email");

      // Find eligible bets (those not owned by past winners)
      const eligibleBets = bets.filter(bet => !pastWinners.includes(bet.user_email));

      let selectedBet = null;

      if (eligibleBets.length > 0) {
        // Prefer a user who has never won before
        selectedBet = eligibleBets[Math.floor(Math.random() * eligibleBets.length)];
      } else {
        // If all users have won before, allow everyone
        selectedBet = bets[Math.floor(Math.random() * bets.length)];
      }

      // Save the selected winner
      const winner = new Winner({
        product_id: item.product_id,
        user_email: selectedBet.user_email,
        bet_id: selectedBet._id,
      });

      await winner.save();
      console.log(`✅ Winner selected for "${item.name}" → ${selectedBet.user_email}`);
    }

    if (res) {
      res.json({ message: "Winner selection completed." });
    }
  } catch (err) {
    console.error("⚠️ Error selecting winners:", err.message);
    if (res) {
      res.status(500).json({ message: "Error selecting winners", error: err.message });
    }
  }
}

   