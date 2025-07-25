import { Router } from "express";
import {
  createEmojiQuestion,
  getAllEmojiQuestions,
  deleteEmojiQuestionById,
  submitEmojiAnswer,
  getNextEmojiQuestions,
  updateEmojiQuestionById,
} from "../controlers/questioncontroler.js";

const quizrouter = Router();

// Admin routes
quizrouter.post("/emoji-question/create", createEmojiQuestion);
quizrouter.get("/emoji-question/all", getAllEmojiQuestions);
quizrouter.delete("/emoji-question/:id", deleteEmojiQuestionById);
quizrouter.put("/emoji-question/:id", updateEmojiQuestionById);

// User quiz routes
quizrouter.post("/emoji-answer", submitEmojiAnswer);
quizrouter.get("/emoji-next", getNextEmojiQuestions);

export default quizrouter;

  