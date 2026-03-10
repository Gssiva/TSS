const Task = require("../models/Task");

/* ================= CREATE TASK ================= */
exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      dueDate
    });

    res.status(201).json({
      message: "Task created successfully",
      task
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET ALL TASKS ================= */
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET SINGLE TASK ================= */
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskByIDHelper = async(id) => {
  try {
    const task = await Task.findById(id);
    
    if(!task)  return "Task not found";
    else return task;
  } catch (error) {
    return error + "Error in finding task"
  }
}

/* ================= UPDATE TASK ================= */
exports.updateTask = async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, dueDate },
      { new: true, runValidators: true }
    );

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    res.json({
      message: "Task updated successfully",
      task
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE TASK ================= */
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.body.taskId);

    if (!task)
      return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
    