import GiftCode from "../moduls/giftcode.js";
import User from "../moduls/user.js";
import { DateTime } from "luxon";

/* ---------------- Admin — Create gift code ---------------- */
export const createGiftCode = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({ message: "Access denied – Admins only" });
    }

    const { code, coins } = req.body;

    const expireAt = DateTime.now()
      .setZone("Asia/Colombo")
      .endOf("day")
      .toJSDate();

    const newGift = await GiftCode.create({
      code,
      coins,
      expireAt,
      createdBy: req.user.user_id,
    });

    res.status(201).json({
      message: "Gift code created successfully",
      data: newGift,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ---------------- Customer — Redeem gift code ---------------- */
export const redeemGiftCode = async (req, res) => {
  try {
    if (req.user.type !== "customer") {
      return res.status(403).json({ message: "Only customers can redeem gift codes" });
    }

    const { code } = req.body;
    const userId = req.user.user_id;

    const gift = await GiftCode.findOne({ code });

    if (!gift) {
      return res.status(404).json({ message: "Gift code not found" });
    }

    if (gift.expireAt < new Date()) {
      return res.status(410).json({ message: "Gift code expired" });
    }

    // Check if user already redeemed
    if (gift.redeemedBy.includes(userId)) {
      return res.status(400).json({ message: "You have already redeemed this code" });
    }

    const session = await GiftCode.startSession();
    await session.withTransaction(async () => {
      await GiftCode.updateOne(
        { _id: gift._id },
        { $push: { redeemedBy: userId } },
        { session }
      );

      await User.findOneAndUpdate(
        { user_id: userId },
        { $inc: { coin_balance: gift.coins } },
        { session }
      );
    });

    await session.endSession();

    res.json({ message: `🎉 You received ${gift.coins} coins!` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};




// PUT /api/giftcode/:id
export const updateGiftCode = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({ message: "Access denied – Admins only" });
    }

    const { id } = req.params;
    const { code, coins } = req.body;

    const updatedGift = await GiftCode.findByIdAndUpdate(
      id,
      { code, coins },
      { new: true }
    );

    if (!updatedGift) {
      return res.status(404).json({ message: "Gift code not found" });
    }

    res.json({ message: "Gift code updated successfully", data: updatedGift });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





// DELETE /api/giftcode/:id
export const deleteGiftCode = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({ message: "Access denied – Admins only" });
    }

    const { id } = req.params;

    const deletedGift = await GiftCode.findByIdAndDelete(id);

    if (!deletedGift) {
      return res.status(404).json({ message: "Gift code not found" });
    }

    res.json({ message: "Gift code deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





// GET /api/giftcode
export const getAllGiftCodes = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({ message: "Access denied – Admins only" });
    }

    const giftCodes = await GiftCode.find().sort({ createdAt: -1 });
    res.json(giftCodes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
