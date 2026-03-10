const SavedCode = require("../models/Savecode");
const studentController = require("./student.controller");

/* ================= CREATE ================= */
exports.createCode = async (req, res) => {
  try {
    const { studentId, title, code } = req.body;

    if (!studentId || !title || !code) {
      return res.status(400).json({
        message: "studentId, title and code are required"
      });
    }

    /* ===== FETCH STUDENT DETAILS ===== */
    const student = await studentController.getStudentHelper(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    /* ===== BUILD SAVE OBJECT ===== */
    const savePayload = {
      title,
      code,

      studentId: student._id,
      studentName: student.name,
      studentClg: student.college,
      studentYear: student.year,
      studentBatch: student.batch
    };

    /* ===== SAVE CODE ===== */
    const savedCode = await SavedCode.create(savePayload);

    res.status(201).json(savedCode);
  } catch (err) {
    console.error("Save Code Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= READ ALL ================= */
exports.getAllCodes = async (req, res) => {
  try {
    const codes = await SavedCode.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= READ BY ID ================= */
exports.getCodeById = async (req, res) => {
  try {
    const { id } = req.body;

    const code = await SavedCode.findById(id);
    if (!code) return res.status(404).json({ message: "Code not found" });

    res.json(code);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE ================= */
exports.updateCode = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;

    const updated = await SavedCode.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Code not found" });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ================= DELETE ================= */
exports.deleteCode = async (req, res) => {
  try {
    const { id } = req.body;

    const deleted = await SavedCode.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Code not found" });

    res.json({ message: "Code deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= FILTER APIs ================= */

/* BY STUDENT ID */
exports.getByStudentId = async (req, res) => {
  try {
    const { studentId } = req.body;

    const data = await SavedCode.find({ studentId })
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* BY BATCH */
exports.getByBatch = async (req, res) => {
  try {
    const { studentBatch } = req.body;
    const data = await SavedCode.find({ studentBatch });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* BY YEAR */
exports.getByYear = async (req, res) => {
  try {
    const { studentYear } = req.body;
    const data = await SavedCode.find({ studentYear });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* BY COLLEGE */
exports.getByCollege = async (req, res) => {
  try {
    const { studentClg } = req.body;
    const data = await SavedCode.find({ studentClg });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
