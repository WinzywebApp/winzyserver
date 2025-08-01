import Bet from '../moduls/bets.js';
import BetItem from '../moduls/betitem.js';
import User from '../moduls/user.js';
import Winner from '../moduls/dailywiner.js';
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';
import { Winner } from "../models/Winner";

const TZ = 'Asia/Colombo';


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

  






// Helper to select winner for a specific item if not already chosen
async function selectWinnerForItem(item) {
  const now = DateTime.now().setZone(TZ);
  const end = DateTime.fromJSDate(item.end_time).setZone(TZ);
  if (now < end.plus({ seconds: 5 })) {
    // Too early to pick winner
    return null;
  }

  // If already has winner, return it
  const existingWinner = await Winner.findOne({ product_id: item.product_id });
  if (existingWinner) return existingWinner;

  const bets = await Bet.find({ product_id: item.product_id });
  if (bets.length === 0) return null; // no bets -> no winner

  const pastWinners = await Winner.find().distinct("user_email");

  const eligibleBets = bets.filter(bet => !pastWinners.includes(bet.user_email));

  let selectedBet;
  if (eligibleBets.length > 0) {
    selectedBet = eligibleBets[Math.floor(Math.random() * eligibleBets.length)];
  } else {
    selectedBet = bets[Math.floor(Math.random() * bets.length)];
  }

  const winnerDoc = new Winner({
    product_id: item.product_id,
    product_name: item.name,
    product_image: item.product_image,
    product_price: item.main_price,
    user_email: selectedBet.user_email,
    user_name: selectedBet.user_info?.name || "",
    bet_code: selectedBet.code,
    date: new Date(),
  });

  await winnerDoc.save();
  console.log(`✅ Winner selected for "${item.name}" → ${selectedBet.user_email}`);
  return winnerDoc;
}

// Combined endpoint
export async function placeBetAndMaybeSelectWinner(req, res) {
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

    // If betting period not started
    if (now < start) return res.status(400).json({ message: "Betting not started yet" });

    // If betting period already fully expired (past end +5s), run winner selection instead of placing a bet
    if (now > end.plus({ seconds: 5 })) {
      const winner = await selectWinnerForItem(product);
      if (winner) {
        return res.status(200).json({
          message: "Betting closed; winner selected for this item.",
          winner: {
            product_id: winner.product_id,
            product_name: winner.product_name,
            product_image: winner.product_image,
            product_price: winner.product_price,
            user_email: winner.user_email,
            user_name: winner.user_name,
            bet_code: winner.bet_code,
            date: winner.date,
          },
        });
      } else {
        return res.status(400).json({ message: "Betting closed and no bets exist to select a winner." });
      }
    }

    // Normal bet placing path: still within betting window
    if (now > end) {
      return res.status(400).json({ message: "Betting time is over" });
    }

    if (dbUser.main_balance < product.main_price) {
      return res.status(400).json({ message: "Insufficient main balance" });
    }

    // Generate next bet_id
    const latestBet = await Bet.findOne().sort({ bet_id: -1 }).exec();
    let nextIdNum = 1;
    if (latestBet && latestBet.bet_id) {
      const match = latestBet.bet_id.match(/bet_(\d+)/);
      if (match && match[1]) {
        nextIdNum = parseInt(match[1], 10) + 1;
      }
    }
    const newBetId = `bet_${String(nextIdNum).padStart(4, '0')}`;

    // Deduct balance
    dbUser.main_balance -= product.main_price;
    await dbUser.save();

    // Create new bet
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

    // After placing bet, optionally (if you want) check if end time just passed and pick winner.
    // (This is defensive; normally winner selection runs elsewhere or via cron.)
    let winnerAfter = null;
    if (now > end.plus({ seconds: 5 })) {
      winnerAfter = await selectWinnerForItem(product);
    }

    const responsePayload = {
      message: "Bet placed successfully",
      bet: newBet,
      remaining_balance: dbUser.main_balance,
    };

    if (winnerAfter) {
      responsePayload.winner = {
        product_id: winnerAfter.product_id,
        product_name: winnerAfter.product_name,
        product_image: winnerAfter.product_image,
        product_price: winnerAfter.product_price,
        user_email: winnerAfter.user_email,
        user_name: winnerAfter.user_name,
        bet_code: winnerAfter.bet_code,
        date: winnerAfter.date,
      };
      responsePayload.message += " (Also winner selected since the item expired.)";
    }

    return res.status(201).json(responsePayload);
  } catch (err) {
    console.error("❌ Bet & winner error:", err);
    return res.status(500).json({ message: "Error placing bet / selecting winner", error: err.message });
  }
}







export async function getAllWinners(req, res) {
  try {
    const winners = await Winner.find().sort("-date").limit(MAX_RETURN).lean();

    res.json({
      meta: {
        total_returned: winners.length,
      },
      data: winners.map(w => ({
        product_id: w.product_id,
        product_name: w.product_name,
        product_image: w.product_image,
        product_price: w.product_price,
        user_email: w.user_email,
        user_name: w.user_name,
        bet_code: w.bet_code,
        date: w.date,
      })),
    });
  } catch (err) {
    console.error("Error fetching all winners:", err);
    res.status(500).json({ message: "Error fetching winners", error: err.message });
  }
}
