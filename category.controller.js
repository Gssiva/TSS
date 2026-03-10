const User = require("../models/User");
const taskController = require("./task.controller");

exports.addTaskToUser = async (req, res) => {
  try {
    const { userId, taskId } = req.body;

    if (!userId || !taskId) {
      return res.status(400).json({
        message: "userId and taskId are required"
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }
    if (!Array.isArray(user.task)) {
      user.task = [];
    }
    if (user.task.includes(taskId)) {
      return res.status(400).json({
        message: "Task already assigned to user"
      });
    }
    user.task.push(taskId);
    await user.save();
    res.status(200).json({
      message: "Task added to user successfully",
      userId: user._id,
      taskId,
      totalTasks: user.task.length
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getTasksForStudent = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!Array.isArray(user.task) || user.task.length === 0) {
      return res.status(200).json([]);
    }

    const tasks = [];

    for (const taskId of user.task) {
      const task = await taskController.getTaskByIDHelper(taskId);
      if (task) {
        tasks.push(task);
      }
    }

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


