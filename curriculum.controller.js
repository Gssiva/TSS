const AssignmentSubmission = require("../models/AssignmentSubmission");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const {getStudentHelper} = require("./student.controller"); 

/* ---------------- SUBMIT ASSIGNMENT ---------------- */
exports.submitAssignment = async (req, res) => {
  try {
    console.log(req.body);
    const { assignmentId, studentId, solvedQuestions, isFinalSubmisison } = req.body;

    if (!assignmentId || !studentId) {
      return res.status(400).json({
        message: "assignmentId and studentId are required"
      });
    }

    const isCompleted = isFinalSubmisison ? true : false;

    /* ---------- FETCH STUDENT ---------- */
    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    /* ---------- CHECK ASSIGNMENT ---------- */
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found"
      });
    }

    const problemsSolved = solvedQuestions ? solvedQuestions.length : 0;

    /* ---------- UPSERT SUBMISSION ---------- */
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignmentId, studentId },
      {
        assignmentId,
        studentId,
        studentName: student.name,
        rollNo: student.regNo,
        batch: student.batch,
        college:student.college,
        year: student.year,
        solvedQuestions: solvedQuestions || [],
        problemsSolved,
        isCompleted,
      },
      { new: true, upsert: true }
    );

    res.status(201).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to submit assignment"
    });
  }
};

/* ---------------- GET SUBMISSIONS BY ASSIGNMENT ---------------- */
exports.getSubmissionsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await AssignmentSubmission.find({
      assignmentId
    }).sort({ problemsSolved: -1 });

    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        let studentDetails = null;

        try {
          const student = await getStudentHelper(submission.studentId);

          if (student) {
            studentDetails = {
              name: student.name,
              email: student.email,
              regNo: student.regNo,
              batch: student.batch,
              year: student.year,
              college: student.college
            };
          }
        } catch (err) {
          console.error(
            "Failed to fetch student for ID:",
            submission.studentId
          );
        }

        return {
          ...submission.toObject(),
          studentDetails
        };
      })
    );

    res.json(enrichedSubmissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch submissions"
    });
  }
};

/* ---------------- GET SUBMISSION BY STUDENT ---------------- */
exports.getSubmissionByStudent = async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findOne({
      assignmentId: req.params.assignmentId,
      studentId: req.params.studentId
    }).populate("solvedQuestions", "title difficulty");

    console.log(submission);
    

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found"
      });
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch submission"
    });
  }
};

exports.getSubmissionByBatch = async (req, res) => {
  try {    
    const { assignmentId } = req.body;
    const submissions = await AssignmentSubmission.find({
      assignmentId
    }).sort({ problemsSolved: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch submissions by batch"
    });
  }
};

exports.getSubmissionByCollegeAndAssignment = async (req, res) => {
  try {
    const { assignmentId, college } = req.body;
    const student = await User.find({ college, role: "student" });
    const studentIds = student.map((stu) => stu._id);

    const submissions = await AssignmentSubmission.find({
      assignmentId,
      studentId: { $in: studentIds }
    }).sort({ problemsSolved: -1 });
    
    res.json(submissions);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch submissions by college and assignment"
    });
  }
};

