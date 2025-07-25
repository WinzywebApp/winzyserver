import express from "express";
import { completeTask, deleteTaskById, getAllTasks, getAvailableTasks, taskCreate, updateTaskById } from "../controlers/taskcontroler.js"; // adjust path as needed

const taskrouter = express.Router();

// 🟢 Admin Endpoints
taskrouter.post("/creat", taskCreate);               // Create new task
taskrouter.get("/all", getAllTasks);            // Get all tasks (admin)
taskrouter.put("/:id", updateTaskById);         // Update task by ID
taskrouter.delete("/:id", deleteTaskById);      // Delete task by ID

// 🔵 User Endpoints
taskrouter.get("/available/:type", getAvailableTasks);         // Get available (not completed) tasks for user
taskrouter.post("/complete", completeTask);  



export default taskrouter;
