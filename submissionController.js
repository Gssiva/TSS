const OwnTaskForStudent = require("../models/OwnTaskForStudent");
const studentController = require("./student.controller");

exports.createTask = async (req, res) => {
  try {
    const { studentId, taskName, description } = req.body;

    if (!studentId || !taskName) {
      return res.status(400).json({
        message: "studentId and taskName are required"
      });
    }
    const student = await studentController.getStudentHelper(studentId);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const taskPayload = {
      taskName,

      studentId: student._id,
      studentName: student.name,
      studentClg: student.college,
      studentYear: student.year,
      studentBatch: student.batch,

      status: "started",
      startedOn: new Date()
    };

    const task = await OwnTaskForStudent.create(taskPayload);

    res.status(201).json(task);
  } catch (err) {
    console.error("Create Task Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const { taskId, timeTaken } = req.body;

    if (!taskId) {
      return res.status(400).json({
        message: "taskId is required"
      });
    }

    const task = await OwnTaskForStudent.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status === "completed") {
      return res.status(400).json({
        message: "Task already completed"
      });
    }

    task.status = "completed";
    task.completedBy = new Date();
    task.timeTaken = timeTaken || 0;

    await task.save();

    res.json({
      message: "Task completed successfully",
      task
    });
  } catch (err) {
    console.error("Complete Task Error:", err);
    res.status(500).json({ message: err.message });
  }
};
exports.getTasksByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const tasks = await OwnTaskForStudent.find({ studentId })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error("Get Tasks By Student Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await OwnTaskForStudent.find()
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error("Get All Tasks Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await OwnTaskForStudent.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Delete Task Error:", err);
    res.status(500).json({ message: err.message });
  }
};
