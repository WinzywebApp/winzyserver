import { DateTime } from 'luxon';
import User from '../moduls/user.js';
import Spin from '../moduls/spin.js';
import DailyWinner from '../moduls/dailywiner.js';

const TZ = 'Asia/Colombo';
const MAX_SPINS_PER_DAY = 5;

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const mul10 = n => Math.floor(n / 10) * 10;

function chooseNormalNumber() {
  const now = DateTime.now().setZone(TZ);
  const cycleSec = 11 * 60;
  const pos = now.toSeconds() % cycleSec;

  if (pos < 300) return rand(1, 2000);
  if (pos < 330) return rand(2000, 2500);
  if (pos < 630) return rand(4500, 5000);
  return rand(4000, 4500);
}

function coinsForNumber(num) {
  if (num >= 1 && num <= 2000) return mul10(rand(0, 50));
  if (num >= 2500 && num <= 4000) return mul10(rand(50, 100));
  if (num >= 4500 && num <= 5000) return mul10(rand(100, 150));
  return 0;
}

function scheduledSpecial(now) {
  const hour = now.hour;
  const minute = now.minute;
  if (minute !== 0) return null;

  const map = {
    0: { num: 1, coins: 500 },
    3: { num: 2, coins: 500 },
    6: { num: 3, coins: 500 },
    9: { num: 4, coins: 500 },
    12: { num: 1, coins: 500 },
    15: { num: 2, coins: 500 },
  };

  return map[hour] ?? null;
}

export const spin = async (req, res) => {
  try {
    const userr = req.user;
    const userId = userr.user_id;

    // ✅ FIXED: get correct user from DB using user_id
    const user = await User.findOne({ user_id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.type !== 'customer') return res.status(403).json({ message: 'Only customers can spin' });

    const now = DateTime.now().setZone(TZ);
    const todayStr = now.startOf('day').toISODate();
    const lastSpinDate = user.lastSpinAt ? DateTime.fromJSDate(user.lastSpinAt).setZone(TZ).toISODate() : null;

    if (lastSpinDate !== todayStr) {
      user.spinsToday = 0;
    }

    console.log(`[SPIN] User: ${user.user_id}, Spins Today: ${user.spinsToday}, Last Spin: ${user.lastSpinAt}`);

    if (user.spinsToday >= MAX_SPINS_PER_DAY) {
      return res.status(429).json({ message: 'You have used all 5 spins for today' });
    }

    let number, coins;
    const dailyWinnerExists = await DailyWinner.findOne({ date: new Date(todayStr) });
    const special = scheduledSpecial(now);

    if (!dailyWinnerExists && special === null) {
      number = 9999;
      coins = 1000;
    } else if (special) {
      number = special.num;
      coins = special.coins;
    } else {
      number = chooseNormalNumber();
      coins = coinsForNumber(number);
    }

    if (number === 9999 && coins === 1000 && !dailyWinnerExists) {
      await DailyWinner.create({ date: new Date(todayStr), user: user.user_id });
      user.dailyWinnerDate = new Date(todayStr);
    }

    user.coin_balance += coins;
    user.spinsToday += 1;
    user.lastSpinAt = now.toJSDate();
    await user.save();

    await Spin.create({
      user: user.user_id,
      number,
      coins,
    });

    res.json({
      success: true,
      number,
      coins,
      balance: user.coin_balance,
      spinsRemaining: MAX_SPINS_PER_DAY - user.spinsToday,
    });
  } catch (err) {
    console.error('[SPIN ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
};














export const getDailyWinner = async (req, res) => {
  try {
    const dateStr = req.query.date || DateTime.now().setZone(TZ).toISODate();
    const dateStart = new Date(dateStr);

    // Find the winner document (user is a user_id string)
    const dailyWinner = await DailyWinner.findOne({ date: dateStart });
    if (!dailyWinner) {
      return res.status(404).json({ message: 'No winner found for the selected date.' });
    }

    // Manually fetch user by user_id string
    const user = await User.findOne({ user_id: dailyWinner.user });
    if (!user) {
      return res.status(404).json({ message: 'User not found for the winner.' });
    }

    res.json({
      date: dateStr,
      winner: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        coin_balance: user.coin_balance,
      }
    });

  } catch (err) {
    console.error('Error fetching daily winner:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
 