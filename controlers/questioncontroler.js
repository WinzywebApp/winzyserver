import EmojiQuestion from "../moduls/question.js"; // Adjust path if needed
import User from "../moduls/user.js";
import { DateTime } from "luxon";

const TIMEZONE = "Asia/Colombo"; // Your timezone

// Helper to check admin access
function checkAdmin(user, res) {
  if (!user) {
    res.status(401).json({ message: "Please log in first" });
    return false;
  }
  if (user.type !== "admin") {
    res.status(403).json({ message: "Only admin can perform this action" });
    return false;
  }
  return true;
}

// -------------------------------------------
// 1. Create a new Emoji Question (Admin only)
export async function createEmojiQuestion(req, res) {
  try {
    const user = req.user;
    if (!checkAdmin(user, res)) return;

    const { emoji_clue, correct_answer, category, hint } = req.body;

    if (!emoji_clue || !correct_answer || !category) {
      return res.status(400).json({
        message: "emoji_clue, correct_answer, and category are required",
      });
    }

    // Generate unique question_id like emoji_q_0001
    const latestQuestion = await EmojiQuestion.findOne().sort({ createdAt: -1 });

    let newQuestionId = "emoji_q_0001";

    if (latestQuestion) {
      const lastId = latestQuestion.question_id;
      const lastNum = parseInt(lastId.split("_")[2], 10);
      const nextNum = lastNum + 1;
      newQuestionId = `emoji_q_${String(nextNum).padStart(4, "0")}`;
    }

    const newQuestion = new EmojiQuestion({
      question_id: newQuestionId,
      emoji_clue,
      correct_answer,
      category,
      hint,
    });

    await newQuestion.save();

    res.status(201).json({
      message: "Emoji question created successfully",
      question: newQuestion,
    });
  } catch (error) {
    console.error("Error creating emoji question:", error.message);
    res.status(500).json({
      error: "Failed to create emoji question",
      details: error.message,
    });
  }
}

// -------------------------------------------
// 2. Get all Emoji Questions (anyone)
export async function getAllEmojiQuestions(req, res) {
  try {
    const questions = await EmojiQuestion.find().sort({ question_id: 1 });

    res.status(200).json({
      message: "All emoji questions fetched successfully",
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error("Error fetching emoji questions:", error.message);
    res.status(500).json({
      error: "Failed to fetch emoji questions",
      details: error.message,
    });
  }
}

// -------------------------------------------
// 3. Submit Emoji Answer and reward coins (user only)
export async function submitEmojiAnswer(req, res) {
  try {
    const { question_id, answer } = req.body;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ message: "Please log in first" });
    }

    if (!question_id || !answer) {
      return res.status(400).json({ message: "question_id and answer are required" });
    }

    const user = await User.findOne({ user_id: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Reset dailyQuizCount if new day
    const now = DateTime.now().setZone(TIMEZONE);
    const todayStr = now.toISODate();
    const lastQuizDate = user.lastQuizAt ? DateTime.fromJSDate(user.lastQuizAt).setZone(TIMEZONE) : null;

    if (!lastQuizDate || lastQuizDate.toISODate() !== todayStr) {
      user.dailyQuizCount = 0;
    }

    if (user.dailyQuizCount >= 10) {
      return res.status(429).json({ message: "Daily quiz limit of 10 reached" });
    }

    const question = await EmojiQuestion.findOne({ question_id });
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Check answer correctness (case insensitive)
    const isCorrect = question.correct_answer.trim().toLowerCase() === answer.trim().toLowerCase();
    let reward = 50;

    if (isCorrect) {
      reward = 100; // adjust reward here
      user.coin_balance += reward;
    }

    user.dailyQuizCount += 1;
    user.lastQuizAt = now.toJSDate();
    await user.save();

    res.status(200).json({
      correct: isCorrect,
      reward,
      coin_balance: user.coin_balance,
      attempts_remaining: 10 - user.dailyQuizCount,
    });
  } catch (error) {
    console.error("Error submitting emoji answer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// -------------------------------------------
// 4. Get next 10 Emoji Questions based on user's dailyQuizCount (user only)
export async function getNextEmojiQuestions(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized: Please log in" });

    const dbUser = await User.findOne({ user_id: user.user_id });
    if (!dbUser) return res.status(404).json({ message: "User not found" });

    const now = DateTime.now().setZone(TIMEZONE);
    const today = now.toISODate();
    const lastQuizDate = dbUser.lastQuizAt ? DateTime.fromJSDate(dbUser.lastQuizAt).setZone(TIMEZONE) : null;

    // Reset daily quiz count if new day
    if (!lastQuizDate || lastQuizDate.toISODate() !== today) {
      dbUser.dailyQuizCount = 0;
      await dbUser.save();
    }

    if (dbUser.dailyQuizCount >= 10) {
      return res.status(200).json({
        message: "Daily quiz limit reached",
        data: [],
      });
    }

    // Calculate next 10 question_ids to fetch
    const start = dbUser.dailyQuizCount + 1;
    const questionIds = Array.from({ length: 10 }, (_, i) => `emoji_q_${String(start + i).padStart(4, "0")}`);

    const questions = await EmojiQuestion.find({ question_id: { $in: questionIds } });

    res.status(200).json({
      message: "Next 10 questions fetched successfully",
      data: questions,
    });
  } catch (error) {
    console.error("Error fetching next questions:", error);
    res.status(500).json({
      message: "Server error while fetching quiz questions",
      error: error.message,
    });
  }
}

// -------------------------------------------
// 5. Update Emoji Question by MongoDB _id (Admin only)
export async function updateEmojiQuestionById(req, res) {
  try {
    const user = req.user;
    if (!checkAdmin(user, res)) return;

    const { id } = req.params;
    const { emoji_clue, correct_answer, category, hint } = req.body;

    if (!id) {
      return res.status(400).json({ message: "id param is required" });
    }

    const updated = await EmojiQuestion.findByIdAndUpdate(
      id,
      {
        ...(emoji_clue && { emoji_clue }),
        ...(correct_answer && { correct_answer }),
        ...(category && { category }),
        ...(hint && { hint }),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Emoji question not found" });

    res.status(200).json({
      message: "Emoji question updated successfully",
      updated_question: updated,
    });
  } catch (error) {
    console.error("Error updating emoji question:", error.message);
    res.status(500).json({
      error: "Failed to update emoji question",
      details: error.message,
    });
  }
}

// -------------------------------------------
// 6. Delete Emoji Question by MongoDB _id (Admin only)
export async function deleteEmojiQuestionById(req, res) {
  try {
    const user = req.user;
    if (!checkAdmin(user, res)) return;

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "id param is required" });
    }

    const deleted = await EmojiQuestion.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ message: "Question not found" });

    res.status(200).json({
      message: "Emoji question deleted successfully",
      deleted_question: deleted,
    });
  } catch (error) {
    console.error("Error deleting emoji question:", error.message);
    res.status(500).json({
      error: "Failed to delete emoji question",
      details: error.message,
    });
  }
}
