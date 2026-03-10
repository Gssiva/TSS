const User = require("../models/User");
const Course = require("../models/Course");
const logger = require("../utils/logger");
const nodemailer = require("nodemailer");

exports.addCourse = async (req, res) => {
  logger.info("addCourse API called");

  const { email, course } = req.body; // course = courseId

  try {
    /* ---------- USER ---------- */
    const user = await User.findOne({ email });
    if (!user) {
      logger.error("User not found in addCourse");
      return res.status(404).json({ message: "User not found" });
    }

    /* ---------- DUPLICATE CHECK ---------- */
    if (user.course.includes(course)) {
      return res.status(400).json({ message: "Course already exists" });
    }

    /* ---------- COURSE ---------- */
    const courseDetails = await Course.findById(course);
    if (!courseDetails) {
      return res.status(404).json({ message: "Course not found" });
    }

    /* ---------- ADD ---------- */
    user.course.push(course);
    await user.save();

    /* ---------- SMTP ---------- */
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "studentshub.tss@gmail.com",
        pass: "htzh fxjj rsxp hcsb"
      }
    });

    /* ---------- MAIL ---------- */
    await transporter.sendMail({
      from: `"TSS Student Hub" <studentshub.tss@gmail.com>`,
      to: email,
      subject: "📘 New Course Added",
      html: `
        <p>Hello,</p>
        <p><b>${courseDetails.name}</b> has been added to your account.</p>
        <p>Login: <a href="https://platform.teamtechsign.in">TSS Student Hub</a></p>
        <br/>
        <p>Regards,<br/>TSS Team</p>
      `
    });

    logger.success("Course added successfully");

    res.json({
      message: "Course added successfully",
      courses: user.course
    });

  } catch (err) {
    logger.error("Error in addCourse: " + err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeCourse = async (req, res) => {
  logger.info("removeCourse API called");

  const { email, course } = req.body; // course = courseId

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.error("User not found in removeCourse");
      return res.status(404).json({ message: "User not found" });
    }

    /* ---------- CHECK & REMOVE ---------- */
    if (user.course.includes(course)) {
      user.course = user.course.filter(id => id.toString() !== course);
      await user.save();
      logger.success("Course removed successfully");
    }

    res.json({
      message: "Course removal processed",
      courses: user.course
    });

  } catch (err) {
    logger.error("Error in removeCourse: " + err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addAssignment = async (req, res) => {
  logger.info("addAssignment API called");

  const { email, assignmentId } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.error("User not found in addAssignment");
      return res.status(404).json({ message: "User not found" });
    }

    if (user.assignments.includes(assignmentId)) {
      return res.status(400).json({ message: "Assignment already exists" });
    }

    user.assignments.push(assignmentId);
    await user.save();

    logger.success("Assignment added successfully");

    res.json({
      message: "Assignment added successfully",
      assignments: user.assignments
    });

  } catch (err) {
    logger.error("Error in addAssignment: " + err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeAssignment = async (req, res) => {
  logger.info("removeAssignment API called");

  const { email, assignmentId } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.error("User not found in removeAssignment");
      return res.status(404).json({ message: "User not found" });
    }

    /* ---------- CHECK & REMOVE ---------- */
    if (user.assignments.includes(assignmentId)) {
      user.assignments = user.assignments.filter(
        id => id.toString() !== assignmentId
      );
      await user.save();
      logger.success("Assignment removed successfully");
    }

    res.json({
      message: "Assignment removal processed",
      assignments: user.assignments
    });

  } catch (err) {
    logger.error("Error in removeAssignment: " + err.message);
    res.status(500).json({ message: "Server error" });
  }
};
