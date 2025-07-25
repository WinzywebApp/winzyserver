import mongoose from "mongoose";

const emojiQuestionSchema = new mongoose.Schema({
  question_id: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    enum: ["food", "country", "vehicle", "animal", "object", "place", "other"],
    required: true,
  },
  emoji_clue: {
    type: String,
    required: true,
  },
  hint: {
    type: String,
  },
  correct_answer: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const EmojiQuestion = mongoose.model("EmojiQuestion", emojiQuestionSchema);
export default EmojiQuestion;
