const {getStudentHelper} = require("./student.controller");
const TaskSubmission = require("../models/TaskSubmission");
const Task = require("../models/Task");

exports.startTask = async (req, res) => {
  try {
    const { studentId, taskId } = req.body;

    if (!studentId || !taskId) {
      return res.status(400).json({
        message: "studentId and taskId are required"
      });
    }

    /* ---------- GET STUDENT DETAILS ---------- */
    const student = await getStudentHelper(studentId);
    console.log(student);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    /* ---------- GET TASK DETAILS ---------- */
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    /* ---------- FIND OR CREATE SUBMISSION ---------- */
    let submission = await TaskSubmission.findOne({
      studentId,
      taskId
    });

    if (!submission) {
      submission = new TaskSubmission({
        studentId,
        taskId,
        studentName: student.name,
        studentCollege: student.college,
        studentBatch: student.batch,
        studentYear: student.year,
        taskName: task.title,
        taskDescription: task.description,
        taskStatus: "started",
        startedOn: new Date()
      });

      await submission.save();

      return res.json({
        message: "Task started successfully",
        startedOn: submission.startedOn
      });
    }

    if (submission.taskStatus === "started") {
      return res.status(400).json({
        message: "Task already started"
      });
    }

    submission.taskStatus = "started";
    submission.startedOn = new Date();
    await submission.save();

    res.json({
      message: "Task started successfully",
      startedOn: submission.startedOn
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const { studentId, taskId, proof = [] } = req.body;

    const submission = await TaskSubmission.findOne({
      studentId,
      taskId
    });

    if (!submission) {
      return res.status(404).json({
        message: "Task submission not found"
      });
    }

    if (submission.taskStatus !== "started") {
      return res.status(400).json({
        message: "Task must be started before completing"
      });
    }

    const completedOn = new Date();

    let timeTaken = 0;
    if (submission.startedOn) {
      timeTaken = Math.floor(
        (completedOn - submission.startedOn) / 60000
      );
    }

    const task = await Task.findById(taskId);
    const isBreached =
      task?.dueDate && completedOn > task.dueDate;

    submission.completedOn = completedOn;
    submission.taskStatus = "completed";
    submission.timeTakenToCompete = timeTaken;
    submission.isBreached = isBreached;
    submission.proof = proof;

    await submission.save();

    res.json({
      message: "Task completed successfully",
      completedOn,
      timeTaken,
      isBreached
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await TaskSubmission.find()
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSubmissionsByStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        message: "studentId is required"
      });
    }

    const submissions = await TaskSubmission.find({ studentId })
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSubmissionByStudentAndTask = async(req, res) =>  {
  try {
    const {studentId, taskId } = req.body;
    const submission = await TaskSubmission.find( {studentId, taskId});
    res.json(submission);
  }
  catch {
      res.status(500).json({ message: err.message });
  }
}

exports.getSubmissionsByTask = async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({
        message: "taskId is required"
      });
    }

    const submissions = await TaskSubmission.find({ taskId });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSubmissionsByCollege = async (req, res) => {
  try {
    const { college } = req.body;

    if (!college) {
      return res.status(400).json({
        message: "college is required"
      });
    }

    const submissions = await TaskSubmission.find({
      studentCollege: college
    });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSubmissionsByYearAndCollege = async (req, res) => {
  try {
    const { college, year } = req.body;

    if (!college || !year) {
      return res.status(400).json({
        message: "college and year are required"
      });
    }

    const submissions = await TaskSubmission.find({
      studentCollege: college,
      studentYear: year
    });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSubmissionsByBatchYearCollege = async (req, res) => {
  try {
    const { college, year, batch } = req.body;

    if (!college || !year || !batch) {
      return res.status(400).json({
        message: "college, year, batch are required"
      });
    }

    const submissions = await TaskSubmission.find({
      studentCollege: college,
      studentYear: year,
      studentBatch: batch
    });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSubmissionsByStatus = async (req, res) => {
  try {
    const { status } = req.body; // assigned | started | completed

    if (!status) {
      return res.status(400).json({
        message: "status is required"
      });
    }

    const submissions = await TaskSubmission.find({
      taskStatus: status
    });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBreachedSubmissions = async (req, res) => {
  try {
    const submissions = await TaskSubmission.find({
      isBreached: true
    });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

