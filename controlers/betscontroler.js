import Bet from '../moduls/bets.js';
import BetItem from '../moduls/betitem.js';
import User from '../moduls/user.js';
import { nanoid } from 'nanoid';
import { Winner } from "../moduls/betwiner.js";
import { sendBetPlaced, sendBetWinner } from '../bot/bot.js';

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

  






// ✅ ADMIN: Select Winner by product_id
export async function selectWinnerByAdmin(req, res) {
  try {
    if (!req.user || req.user.type !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    const { product_id } = req.params;
    const product = await BetItem.findOne({ product_id });
    if (!product) return res.status(404).json({ message: "Bet item not found" });

    const bets = await Bet.find({ product_id });
    if (bets.length === 0) {
      return res.status(400).json({ message: "No bets placed for this item" });
    }

    const pastWinners = await Winner.find().distinct("user_email");
    const eligibleBets = bets.filter(bet => !pastWinners.includes(bet.user_email));

    let selectedBet;
    if (eligibleBets.length > 0) {
      selectedBet = eligibleBets[Math.floor(Math.random() * eligibleBets.length)];
    } else {
      selectedBet = bets[Math.floor(Math.random() * bets.length)];
    }

    // Atomic upsert to avoid duplicate winner for same product
    const winnerDoc = await Winner.findOneAndUpdate(
      { product_id: product.product_id },
      {
        $setOnInsert: {
          product_id: product.product_id,
          product_name: product.name,
          product_image: product.product_image,
          product_price: product.main_price,
          user_email: selectedBet.user_email,
          user_name: selectedBet.user_info?.name || "",
          bet_code: selectedBet.code,
          date: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    // ✅ Send Telegram message to the winner (non-blocking)
    try {
      const winnerUser = await User.findOne({ email: selectedBet.user_email });
      if (winnerUser?.telegram_chat_id) {
        await sendBetWinner(winnerUser.telegram_chat_id.toString(), {
          product_name: product.name,
          product_price: product.main_price,
          bet_code: selectedBet.code,
          date: new Date(),
        });
      }
    } catch (botErr) {
      console.warn("⚠️ Failed to send Telegram winner notification:", botErr?.message || botErr);
    }

    return res.status(200).json({
      message: "Winner selected (or already existed)",
      winner: winnerDoc,
    });
  } catch (err) {
    return res.status(500).json({ message: "Error selecting winner", error: err.message });
  }
}







export async function placeBet(req, res) {
  try {
    const { product_id, name, address, city, contact } = req.body;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const dbUser = await User.findOne({ user_id: userId });
    if (!dbUser) return res.status(404).json({ message: "User not found" });

    const product = await BetItem.findOne({ product_id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // ✅ Betting window check: end_time ඉක්මවා ගියා නම් bet place කරන්න බැහැ
    const now = DateTime.now().setZone(TZ);
    const end = DateTime.fromJSDate(product.end_time).setZone(TZ);
    if (now > end) {
      return res.status(400).json({ message: "Betting time is over" });
    }

    // ✅ Main balance >= product price
    if (dbUser.main_balance < product.main_price) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // ✅ Bet ID generate
    const latestBet = await Bet.findOne().sort({ bet_id: -1 });
    let nextIdNum = 1;
    if (latestBet && latestBet.bet_id) {
      const match = latestBet.bet_id.match(/bet_(\d+)/);
      if (match && match[1]) {
        nextIdNum = parseInt(match[1], 10) + 1;
      }
    }
    const newBetId = `bet_${String(nextIdNum).padStart(4, '0')}`;

    // ✅ Unique English letters 8 characters code
    const betCode = nanoid(8);

    // ✅ Balance deduction
    dbUser.main_balance -= product.main_price;
    await dbUser.save();

    // ✅ Save bet
    const newBet = new Bet({
      bet_id: newBetId,
      user_email: dbUser.email,
      code: betCode,
      user_info: { name, address, city, contact },
      product_id: product.product_id,
      product_name: product.name,
      product_price: product.main_price,
      created_at: new Date()
    });

    await newBet.save();

    // ✅ Send Telegram notification about bet placed (if chat ID exists)
    try {
      const telegramChatId = req.user?.telegram_chat_id || dbUser.telegram_chat_id;
      if (telegramChatId) {
        await sendBetPlaced(telegramChatId.toString(), {
          bet_id: newBet.bet_id,
          product_name: newBet.product_name,
          product_price: newBet.product_price,
          date: newBet.created_at,
        });
      }
    } catch (botErr) {
      console.warn("Failed to send bet placed notification:", botErr?.message || botErr);
    }

    return res.status(201).json({
      message: "Bet placed successfully",
      bet: newBet,
      remaining_balance: dbUser.main_balance
    });

  } catch (err) {
    return res.status(500).json({ message: "Error placing bet", error: err.message });
  }
}







export async function getAllWinners(req, res) {
  try {
    const winners = await Winner.find()
      .sort({ date: -1 })
      .lean();

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