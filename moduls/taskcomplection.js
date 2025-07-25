// models/UserTaskCompletion.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const userTaskSchema = new Schema({
  user_id: String, // e.g. "winzy_u_0004"
  task_id: String, // change from ObjectId to String to match your task.task_id field
  coinsAdded: { type: Boolean, default: false },
});

export default mongoose.model('UserTaskCompletion', userTaskSchema);
