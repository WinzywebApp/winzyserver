import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  task_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  point_balance: {
    type: Number,
    required: true,
    default: 0,
  },
  link: {
    type: String,
    required: true,
    trim: true,
  },
  task_description: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["daily task", "new user task"],
    default: "daily task",
    lowercase: true,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  icon: {
    type: String,
    enum: ["tiktok", "facebook", "telegram", "youtube"],
    lowercase: true,
    trim: true,
  },
});

const Task = mongoose.model("Task", taskSchema);
export default Task;
