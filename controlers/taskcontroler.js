import Task from '../moduls/task.js';
import UserTaskCompletion from '../moduls/taskcomplection.js';
import User from '../moduls/user.js';

// 🎯 Get tasks not completed by current user
export const getAvailableTasks = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const taskType = req.params.type; // From path param

    const completedTaskIds = await UserTaskCompletion.find({ user_id: userId }).distinct('task_id');

    const query = {
      task_id: { $nin: completedTaskIds }
    };

    // ✅ Only add type filter if it's valid
    const validTypes = ["daily task", "new user task"];
    if (taskType && validTypes.includes(taskType)) {
      query.type = taskType;
    }

    const tasks = await Task.find(query);
    res.json({ success: true, tasks });
  } catch (err) {
   
    res.status(500).json({ message: 'Server error' });
  }
};

    

// ✅ Complete a task
export const completeTask = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { task_id } = req.body;

    const user = await User.findOne({ user_id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const task = await Task.findOne({ task_id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const alreadyCompleted = await UserTaskCompletion.findOne({ user_id: userId, task_id });
    if (alreadyCompleted) return res.status(400).json({ message: 'Task already completed' });

    await UserTaskCompletion.create({ user_id: userId, task_id, coinsAdded: true });

    user.coin_balance += task.point_balance;
    await user.save();

    res.json({
      success: true,
      message: 'Task completed successfully',
      coinsEarned: task.point_balance,
      balance: user.coin_balance,
    });

  } catch (err) {
    
    res.status(500).json({ message: 'Server error' });
  }
};

// 🆕 Create a new task
export const taskCreate = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admins only" });
    }

    const { point_balance, link, task_description, type, icon } = req.body;

    const tasks = await Task.find({}, { task_id: 1 });
    const numbers = tasks.map(t => {
      const match = t.task_id.match(/task_(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const newTaskId = `task_${String(maxNumber + 1).padStart(4, "0")}`;

    const newTask = new Task({
      task_id: newTaskId,
      point_balance,
      link,
      task_description,
      type,
      icon // ✅ Now handled properly
    });

    await newTask.save();
    res.status(201).json({ success: true, message: "Task created successfully", task: newTask });

  } catch (error) {
    
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 📋 Get all tasks
export const getAllTasks = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admins only" });
    }

    const tasks = await Task.find().sort({ date: -1 });
    res.status(200).json({ success: true, tasks });
  } catch (error) {
   
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔄 Update a task
export const updateTaskById = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admins only" });
    }

    const { id } = req.params;
    const { task_id, point_balance, link, task_description, type, icon } = req.body;

    const updatedTask = await Task.findOneAndUpdate(
      { task_id: id },
      { task_id, point_balance, link, task_description, type, icon },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, message: "Task updated", task: updatedTask });
  } catch (error) {
    
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ❌ Delete a task
export const deleteTaskById = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admins only" });
    }

    const { id } = req.params;
    const deletedTask = await Task.findOneAndDelete({ task_id: id });

    if (!deletedTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, message: "Task deleted", task: deletedTask });
  } catch (error) {
   
    res.status(500).json({ success: false, message: "Server error" });
  }
};
