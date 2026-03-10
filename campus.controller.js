const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const sendMail = require("../utils/mail");
const logger = require("../utils/logger");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Lazy load logo to base64 with fallback
let logoDataUri = null;

function loadLogo() {
  try {
    const logoPath = path.join(__dirname, "../assets/tsslogo.png");
    if (fs.existsSync(logoPath)) {
      const logoBase64 = fs.readFileSync(logoPath).toString("base64");
      logoDataUri = `data:image/png;base64,${logoBase64}`;
      logger.info("Logo loaded successfully");
    } else {
      logger.warn("Logo file not found at " + logoPath);
      logoDataUri = null;
    }
  } catch (err) {
    logger.error("Error loading logo: " + err.message);
    logoDataUri = null;
  }
}

// Load logo on startup
loadLogo();

exports.createAdmin = async (req, res) => {
  logger.info("createAdmin API called");
  const { email } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // 🔐 Generate temp password
    const tempPassword = crypto.randomBytes(4).toString("hex");
    logger.info("Temporary password generated: " + tempPassword);
    
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await User.create({
      email,
      password: hashedPassword,
      role: "admin"
    });

    // 📧 Send email
    const logoHtml = logoDataUri 
      ? `<img src="${logoDataUri}" alt="TSS Logo" style="max-width:150px; margin-bottom:20px;" />`
      : '';

    await sendMail(
      email,
      "Your Admin Access",
      `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          ${logoHtml}
          <h3>Admin Account Created</h3>
          <p>Email: <b>${email}</b></p>
          <p>Temporary Password: <b>${tempPassword}</b></p>
        </div>
      `
    );

    logger.success("Admin created and email sent successfully");
    res.json({ message: "Admin created & email sent" });
  } catch (err) {
    logger.error("Error in createAdmin: " + err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createStaff = async (req, res) => {
  logger.info("createStaff API called");
  const { email, college } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // 🔐 Generate temp password
    const tempPassword = crypto.randomBytes(4).toString("hex");
    logger.info("Temporary password generated: " + tempPassword);
    
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await User.create({
      email,
      password: hashedPassword,
      role: "staff",
      college : college
    });

    logger.success("Staff created and email sent successfully");
    res.json({ message: "Staff created & email sent" });
  } catch (err) {
    logger.error("Error in createStaff: " + err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createStudent = async (req, res) => {
  logger.info("createStudent API called");

  const {
    email,
    college,
    year,
    batch,
    course,
    password,
    phNo,
    regNo,
    name
  } = req.body;

  if (!email || !college) {
    return res.status(400).json({
      message: "Email and college are required"
    });
  }

  try {
    /* ---------- CHECK EXISTING STUDENT ---------- */
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({
        message: "Student already exists"
      });
    }

    /* ---------- PASSWORD ---------- */
    const tempPassword =
      password || crypto.randomBytes(4).toString("hex");

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    /* ---------- BREVO SMTP ---------- */
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: "a0835b001@smtp-brevo.com",
        pass: "bskQbz5SggUfSJT"
      }
    });

    /* ---------- MAIL CONTENT ---------- */
    const logoHtml = logoDataUri
      ? `<img src="${logoDataUri}" alt="TSS Student Hub" style="max-width:150px;margin-bottom:10px;border-radius:10px;" />`
      : "";

    const mailOptions = {
      from: `"TSS Student Hub" <studentshub.tss@gmail.com>`,
      to: email.toLowerCase(),
      cc: "chandruvasan65@gmail.com",
      subject: "🎓 Welcome to TSS Student Hub – Login Credentials",
      html: `
<div style="font-family:Arial,Helvetica,sans-serif;background:#eef2f7;padding:30px;">
  <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.1);">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:25px;text-align:center;color:#ffffff;">
      ${logoHtml}
      <h2 style="margin:0;">TSS Student Hub</h2>
      <p style="margin-top:6px;font-size:14px;opacity:0.9;">
        Your Learning Journey Starts Here 🚀
      </p>
    </div>

    <!-- BODY -->
    <div style="padding:25px;color:#1f2937;">
      <h3>Dear ${name || "Student"} 👋</h3>

      <p>
        Your student account has been <b>successfully created</b>.
        You can now access coding practice, MCQs, assignments,
        and learning resources on <b>TSS Student Hub</b>.
      </p>

      <!-- CREDENTIALS -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
        <h4>🔐 Login Credentials</h4>
        <p><b>Email:</b> ${email.toLowerCase()}</p>
        <p>
          <b>Password:</b>
          <span style="background:#111827;color:#ffffff;padding:6px 10px;border-radius:6px;font-family:monospace;">
            ${tempPassword}
          </span>
        </p>
      </div>

      <!-- ACADEMIC DETAILS -->
      <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:16px;">
        <h4>📘 Academic Details</h4>
        <p><b>College:</b> ${college}</p>
        <p><b>Year:</b> ${year || "-"}</p>
        <p><b>Batch:</b> ${batch || "-"}</p>
        <p><b>Register No:</b> ${regNo || "-"}</p>
      </div>

      <!-- LOGIN BUTTON -->
      <div style="text-align:center;margin:30px 0;">
        <a href="https://platform.teamtechsign.in/login"
           style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:30px;font-weight:600;">
          🚀 Login to TSS Student Hub
        </a>
      </div>

      <p style="font-size:14px;color:#374151;">
        ⚠️ Please log in and <b>change your password immediately</b>.
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0;" />

      <p>
        Regards,<br/>
        <b>TSS Team</b>
      </p>
    </div>

    <!-- FOOTER -->
    <div style="background:#f8fafc;text-align:center;padding:14px;font-size:12px;color:#64748b;">
      © ${new Date().getFullYear()} TSS Student Hub<br/>
      Empowering Students Through Technology ⚡
    </div>

  </div>
</div>
`
    };

    /* ---------- SEND MAIL FIRST ---------- */
    await transporter.sendMail(mailOptions);

    logger.info(`Student mail sent to ${email}`);

    /* ---------- CREATE STUDENT (AFTER MAIL SUCCESS) ---------- */
    await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "student",
      college,
      year,
      batch,
      course,
      phNo,
      regNo,
      name
    });

    logger.success("Student created & credentials sent");

    return res.json({
      message: "Student created and credentials sent successfully"
    });

  } catch (err) {
    logger.error("Error in createStudent: " + err.message);
    return res.status(500).json({
      message: "Server error" 
    });
  }
};



exports.findNotCreatedStudents = async (req, res) => {
  logger.info("findNotCreatedStudents API called");

  const { emails } = req.body;

  try {
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        message: "Emails array is required"
      });
    }

    /* ---------- EMAIL REGEX ---------- */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const normalized = emails.map(e => e?.trim().toLowerCase());

    /* ---------- INVALID EMAILS ---------- */
    const invalidEmails = normalized.filter(
      email => !emailRegex.test(email)
    );

    /* ---------- VALID EMAILS ---------- */
    const validEmails = normalized.filter(
      email => emailRegex.test(email)
    );

    /* ---------- REMOVE DUPLICATES ---------- */
    const uniqueValidEmails = [...new Set(validEmails)];

    /* ---------- FIND EXISTING USERS ---------- */
    const existingUsers = await User.find(
      { email: { $in: uniqueValidEmails } },
      { email: 1, _id: 0 }
    );

    const existingEmails = existingUsers.map(u => u.email);

    /* ---------- NOT CREATED ---------- */
    const notCreatedEmails = uniqueValidEmails.filter(
      email => !existingEmails.includes(email)
    );

    res.json({
      totalGiven: emails.length,              // 267
      invalidCount: invalidEmails.length,
      invalidEmails,

      validUniqueCount: uniqueValidEmails.length,
      existingCount: existingEmails.length,
      existingEmails,

      notCreatedCount: notCreatedEmails.length,
      notCreatedEmails
    });

  } catch (err) {
    logger.error("Error in findNotCreatedStudents: " + err.message);
    res.status(500).json({ message: "Server error" });
  }
};


exports.bulkCreateStudents = async (req, res) => {
  logger.info("bulkCreateStudents API called");

  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
      message: "Students array is required"
    });
  }

  const created = [];
  const skipped = [];
  const errors = [];

  try {
    // ⚡ First, batch check all existing emails to avoid sequential queries
    const emails = students.map(s => s.email?.toLowerCase()).filter(Boolean);
    const existingUsers = await User.find({ email: { $in: emails } }).select("email").lean();
    const existingEmailsSet = new Set(existingUsers.map(u => u.email.toLowerCase()));

    // ⚡ Process all students concurrently with controlled concurrency
    const processStudent = async (student) => {
      const { email, college, year, batch, course, password, regNO } = student;

      if (!email || !college || !year || !batch) {
        errors.push({
          email,
          reason: "Missing required fields"
        });
        return;
      }

      if (existingEmailsSet.has(email.toLowerCase())) {
        skipped.push({
          email,
          reason: "Student already exists"
        });
        return;
      }

      try {
        // 🔐 Generate temporary password
        const tempPassword = password || crypto.randomBytes(4).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // 👨‍🎓 Create student
        await User.create({
          email,
          password: hashedPassword,
          role: "student",
          college,
          year,
          batch,
          course
        });

        created.push({
          email,
          tempPassword
        });
      } catch (err) {
        errors.push({
          email,
          reason: err.message
        });
      }
    };

    // ⚡ Process max 10 students concurrently
    const batchSize = 10;
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      await Promise.all(batch.map(processStudent));
    }

    logger.success("Bulk student upload completed");

    res.json({
      message: "Bulk student upload completed",
      summary: {
        total: students.length,
        created: created.length,
        skipped: skipped.length,
        errors: errors.length
      },
      created,
      skipped,
      errors
    });
  } catch (err) {
    logger.error("Error in bulkCreateStudents: " + err.message);
    res.status(500).json({ message: "Server error" });
  }
};



exports.bulkDeleteStudentsByEmail = async (req, res) => {
  logger.info("bulkDeleteStudentsByEmail API called");

  const { emails } = req.body;

  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({
      message: "Emails array is required"
    });
  }

  try {
    // 🔍 Find matching students
    const students = await User.find({
      email: { $in: emails },
      role: "student"
    });

    if (students.length === 0) {
      return res.status(404).json({
        message: "No students found for given emails"
      });
    }

    // ❌ Delete students
    const result = await User.deleteMany({
      email: { $in: emails },
      role: "student"
    });

    const deletedEmails = students.map((s) => s.email);

    logger.success(`Bulk deleted ${result.deletedCount} students`);

    res.json({
      message: "Bulk student deletion completed",
      summary: {
        requested: emails.length,
        deleted: result.deletedCount,
        notFound: emails.length - result.deletedCount
      },
      deletedEmails
    });
  } catch (err) {
    logger.error("Error in bulkDeleteStudentsByEmail: " + err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.sendBulkInvitationMails = async (req, res) => {
  logger.info("sendBulkInvitationMails API called");

  const { college, batch } = req.body;

  if (!college || typeof college !== "string") {
    return res.status(400).json({
      message: "College name is required"
    });
  }

  const sent = [];
  const failed = [];

  try {
    /* ---------- FETCH STUDENTS ---------- */
    const students = await User.find({
      college,
      batch,
      role: "student"
    }).lean(); // ⚡ Use lean() for better performance

    if (students.length === 0) {
      return res.status(404).json({
        message: `No students found for college: ${college}`
      });
    }

    /* ---------- REMOVE DUPLICATE EMAILS (CASE-INSENSITIVE) ---------- */
    const uniqueStudentsMap = new Map();

    for (const student of students) {
      const normalizedEmail = student.email.trim().toLowerCase();

      if (!uniqueStudentsMap.has(normalizedEmail)) {
        uniqueStudentsMap.set(normalizedEmail, {
          ...student,
          normalizedEmail
        });
      }
    }

    const uniqueStudents = Array.from(uniqueStudentsMap.values());

    logger.info(
      `Students fetched: ${students.length}, unique emails: ${uniqueStudents.length}`
    );

    /* ---------- GET GLOBAL SMTP TRANSPORTER ---------- */
    const { getTransporter } = require("../config/smtp");
    const transporter = getTransporter();

    /* ---------- PROCESS STUDENTS CONCURRENTLY ---------- */
    const processStudent = async (student) => {
      try {
        /* 🔐 Generate temporary password */
        const tempPassword = crypto.randomBytes(4).toString("hex");

        /* 🔐 Hash password */
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        /* ---------- SEND MAIL ---------- */
        const mailOptions = {
          from: `"TSS Student Hub" <studentshub.tss@gmail.com>`,
          to: student.normalizedEmail,
          cc: "chandruvasan65@gmail.com",
          subject: "🔐 Your TSS Student Hub Login Credentials",
          html: `
          <div style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 15px;">
        <table width="100%" style="max-width:600px;background:#ffffff;border-radius:14px;box-shadow:0 10px 25px rgba(0,0,0,0.08);overflow:hidden;">
          
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:30px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:26px;">🎓 TSS Student Hub</h1>
              <p style="margin-top:8px;font-size:14px;opacity:0.9;">
                Your learning journey starts here
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px;color:#1f2937;">
              <h2>Dear Student 👋</h2>

              <p>
                We are sharing your <b>TSS Student Hub</b> login credentials.
                Currently, <b>no tests or assignments have been assigned</b>.
                You may use the platform for IDE to Execute your own code.
              </p>

              <p>
                Whenever any test, MCQ, or assignment is assigned,
                you will receive an <b>email notification</b>.
              </p>

              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px;margin:22px 0;">
                <p><b>Username (Email)</b></p>
                <p style="color:#2563eb;">${student.normalizedEmail}</p>

                <p><b>Temporary Password</b></p>
                <p style="font-size:18px;font-weight:bold;color:#dc2626;">
                  ${tempPassword}
                </p>
              </div>

              <div style="text-align:center;margin:25px 0;">
                <a href="https://platform.teamtechsign.in/login"
                  style="background:#2563eb;color:#ffffff;padding:14px 36px;border-radius:30px;text-decoration:none;font-weight:600;">
                  Login to Student Hub
                </a>
              </div>

              <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb;" />

              <h3>While Attendng the test following Auto-Proctoring Features are Enabled</h3>
              <ul style="padding-left:20px;color:#374151;">
                <li>Mandatory Full-Screen Mode</li>
                <li>Camera & Microphone Monitoring</li>
                <li>Tab Switching Monitoring</li>
                <li>MCQ Navigation Restriction (One-time selection)</li>
                <li>Copy–Paste Disabled</li>
                <li>Drag and Drop Disabled</li>
                <li>Real-time Chat with Admin</li>
                <li>Raise Support Ticket to Admin</li>
                <li>MCQ Question & Option Shuffling</li>
              </ul>

              <p>
                Please keep these rules in mind while attending assessments.
              </p>

              <p><b>As soon as possible test will assign please be ready.</b></p>

              <p><b>All the best for your learning journey! 🌟</b></p>

              <p>
                Regards,<br/>
                <b>TSS Team</b>
              </p>
            </td>
          </tr>
        </table>

        <p style="font-size:12px;color:#9ca3af;margin-top:15px;">
          © ${new Date().getFullYear()} TSS Student Hub. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</div>`
        };

        await transporter.sendMail(mailOptions);

        /* ---------- UPDATE PASSWORD AFTER MAIL SUCCESS ---------- */
        await User.updateOne(
          { _id: student._id },
          { password: hashedPassword }
        );

        sent.push(student.normalizedEmail);

      } catch (err) {
        logger.error(`Failed for ${student.email}: ${err.message}`);
        failed.push({
          email: student.email,
          reason: err.message
        });
      }
    };

    // ⚡ Process max 5 students concurrently to avoid overwhelming SMTP
    const batchSize = 5;
    for (let i = 0; i < uniqueStudents.length; i += batchSize) {
      const batch = uniqueStudents.slice(i, i + batchSize);
      await Promise.all(batch.map(processStudent));
    }

    logger.success(`Bulk password reset completed for ${college}`);

    return res.json({
      message: "Bulk password reset completed",
      college,
      summary: {
        total: uniqueStudents.length,
        sent: sent.length,
        failed: failed.length
      },
      sentEmails: sent,
      failedEmails: failed
    });

  } catch (err) {
    logger.error("sendBulkInvitationMails error: " + err.message);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

exports.sendInvitationByEmails = async (req, res) => {
  logger.info("sendInvitationByEmails API called");

  let { emails } = req.body;

  if (!emails) {
    return res.status(400).json({
      message: "Email or email list is required"
    });
  }

  // Normalize to array
  if (!Array.isArray(emails)) {
    emails = [emails];
  }

  const sent = [];
  const failed = [];

  try {
    /* ---------- GET GLOBAL TRANSPORTER ---------- */
    const { getTransporter } = require("../config/smtp");
    const transporter = getTransporter();

    /* ---------- PROCESS EMAILS CONCURRENTLY ---------- */
    const processEmail = async (email) => {
      try {
        const student = await User.findOne({ email }).lean();

        if (!student) {
          failed.push({
            email,
            reason: "Student not found"
          });
          return;
        }

        /* ---------- FIX COLLEGE NAME ---------- */
        let updatedCollege = student.college;
        if (student.college === "MECE") {
          updatedCollege = "MRCE";
        }

        /* ---------- TEMP PASSWORD ---------- */
        const tempPassword = crypto.randomBytes(4).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        /* ---------- MAIL ---------- */
        const mailOptions = {
          from: `"TSS Student Hub" <studentshub.tss@gmail.com>`,
          to: student.email,
          cc: "chandruvasan65@gmail.com",
          subject: "🔐 Your TSS Student Hub Login Credentials",
          html: `
            <div style="margin:0;padding:0;background:#eef2f7;font-family:sans-serif;">
              <table width="100%">
                <tr>
                  <td align="center" style="padding:40px 15px;">
                    <table style="max-width:600px;background:#fff;border-radius:14px;box-shadow:0 10px 25px rgba(0,0,0,.08);">
                      
                      <tr>
                        <td style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:30px;text-align:center;color:#fff;">
                          <h1 style="margin:0;">🎓 TSS Student Hub</h1>
                          <p style="opacity:.9;">Your learning journey starts here</p>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:28px;color:#1f2937;">
                          <h2>Welcome 👋</h2>
                          <p>This is your <b>final and correct</b> login credential email.</p>

                          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px;">
                            <p><b>Email:</b> ${email}</p>
                            <p style="color:#dc2626;font-size:18px;">
                              <b>Password:</b> ${tempPassword}
                            </p>
                            <p><b>College:</b> ${updatedCollege}</p>
                          </div>

                          <div style="text-align:center;margin:25px 0;">
                            <a href="https://platform.teamtechsign.in/login"
                               style="background:#2563eb;color:#fff;padding:14px 36px;
                               text-decoration:none;border-radius:30px;font-weight:600;">
                               Login to Student Hub
                            </a>
                          </div>

                          <p style="font-size:13px;">
                            ⚠️ If you received a previous mail, please ignore it and use this one.
                          </p>

                          <hr/>
                          <p style="font-size:13px;">Regards,<br/><b>TSS Team</b></p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);

        /* ---------- UPDATE PASSWORD + COLLEGE AFTER SUCCESS ---------- */
        const dbUpdateResult = await User.updateOne(
          { _id: student._id },
          {
            password: hashedPassword,
            college: updatedCollege
          }
        );

        logger.info(`Invitation email sent to ${email}, password updated, college fixed.`);
        sent.push(email);

      } catch (err) {
        logger.error(`Mail failed for ${email}: ${err.message}`);
        failed.push({
          email,
          reason: err.message
        });
      }
    };

    // ⚡ Process max 5 emails concurrently
    const batchSize = 5;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      await Promise.all(batch.map(processEmail));
    }

    return res.json({
      message: "Invitation mail process completed",
      summary: {
        total: emails.length,
        sent: sent.length,
        failed: failed.length
      },
      sentEmails: sent,
      failedEmails: failed
    });

  } catch (err) {
    logger.error("sendInvitationByEmails error: " + err.message);
    return res.status(500).json({
      message: "Server error"
    });
  }
};
 
exports.sendAccountCreatedNotificationMails = async (req, res) => {
  logger.info("sendAccountCreatedNotificationMails API called");

  const { college, batch } = req.body;

  if (!college || typeof college !== "string") {
    return res.status(400).json({
      message: "College name is required"
    });
  }

  const sent = [];
  const failed = [];

  try {
    /* ---------- FETCH STUDENTS ---------- */
    const students = await User.find({
      college,
      batch,
      role: "student"
    });

    if (students.length === 0) {
      return res.status(404).json({
        message: `No students found for college: ${college}`
      });
    }

    /* ---------- REMOVE DUPLICATE EMAILS ---------- */
    const uniqueStudentsMap = new Map();

    for (const student of students) {
      if (!student.email) continue;

      const normalizedEmail = student.email.trim().toLowerCase();

      if (!uniqueStudentsMap.has(normalizedEmail)) {
        uniqueStudentsMap.set(normalizedEmail, {
          ...student.toObject(),
          normalizedEmail
        });
      }
    }

    const uniqueStudents = Array.from(uniqueStudentsMap.values());

    logger.info(
      `Students fetched: ${students.length}, unique emails: ${uniqueStudents.length}`
    );

    /* ---------- BREVO SMTP ---------- */
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: "a0835b001@smtp-brevo.com",
        pass: "bskQbz5SggUfSJT"
      } 
    });

    /* ---------- SEND INFORMATION MAIL ---------- */
    for (const student of uniqueStudents) {
      try {
        const mailOptions = {
          from: `"TSS Student Hub" <studentshub.tss@gmail.com>`,
          to: "chandruvasan06032003@gmail.com",
          subject: "🎓 Your TSS Student Hub Account Has Been Created",
          html: `
          <div style="margin:0;padding:0;background:#eef2f7;font-family:sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:40px 15px;">
                  <table width="100%" style="max-width:600px;background:#ffffff;border-radius:14px;box-shadow:0 10px 25px rgba(0,0,0,0.08);overflow:hidden;">
                    
                    <tr>
                      <td style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:30px;text-align:center;color:#fff;">
                        <h1 style="margin:0;font-size:26px;">🎓 TSS Student Hub</h1>
                        <p style="margin-top:8px;font-size:14px;opacity:0.9;">
                          Account Created Successfully
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:30px;color:#1f2937;">
                        <h2>Hello 👋</h2>

                        <p>
                          Your <b>TSS Student Hub</b> account has been successfully created.
                        </p>

                        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px;margin:20px 0;">
                          <p><b>Username</b></p>
                          <p style="color:#2563eb;">
                            ${student.normalizedEmail}
                          </p>

                          <p style="margin-top:12px;color:#374151;">
                            🔐 Your <b>password will be shared with you shortly</b> by the admin.
                          </p>
                        </div>

                        <p style="font-size:13px;color:#6b7280;margin-top:20px;">
                          Please wait for further communication regarding your login credentials.
                        </p>

                        <hr/>

                        <p>
                          Regards,<br/>
                          <b>TSS Team</b>
                        </p>
                      </td>
                    </tr>

                  </table>

                  <p style="font-size:12px;color:#9ca3af;margin-top:15px;">
                    © ${new Date().getFullYear()} TSS Student Hub
                  </p>
                </td>
              </tr>
            </table>
          </div>
          `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Account-created mail sent to ${student.normalizedEmail}`);
        sent.push(student.normalizedEmail);
      } catch (err) {
        logger.error(`Failed for ${student.email}: ${err.message}`);
        failed.push({
          email: student.email,
          reason: err.message
        });
      }
    }

    logger.success(`Account-created mails sent for ${college}`);

    return res.json({
      message: "Account created notification mails sent successfully",
      college,
      summary: {
        totalFetched: students.length,
        uniqueEmails: uniqueStudents.length,
        sent: sent.length,
        failed: failed.length
      },
      sentEmails: sent,
      failedEmails: failed
    });

  } catch (err) {
    logger.error(
      "sendAccountCreatedNotificationMails error: " + err.message
    );
    return res.status(500).json({
      message: "Server error"
    });
  }
};

exports.bulkCreateStudentsWithMail = async (req, res) => {
  logger.info("bulkCreateStudentsWithMail API called");

  const students = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
      message: "Student data array is required"
    });
  }

  const created = [];
  const skipped = [];
  const failed = [];

  try {
    /* ---------- SMTP CONFIG ---------- */
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: "a0835b001@smtp-brevo.com",
        pass: "bskQbz5SggUfSJT"
      }
    });

    /* ---------- CHUNK SETTINGS ---------- */
    const CHUNK_SIZE = 15; // 15 students at a time
    const DELAY_BETWEEN_CHUNKS = 2000; // 2 seconds delay

    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const chunkArray = (array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    const studentChunks = chunkArray(students, CHUNK_SIZE);

    logger.info(`Total Students: ${students.length}`);
    logger.info(`Total Chunks: ${studentChunks.length}`);

    /* ---------- PROCESS CHUNKS ---------- */
    for (let i = 0; i < studentChunks.length; i++) {
      const chunk = studentChunks[i];

      logger.info(`Processing chunk ${i + 1}/${studentChunks.length}`);

      await Promise.all(
        chunk.map(async (student) => {
          const {
            name,
            email,
            college,
            year,
            batch,
            regNo,
            phNo
          } = student;

          if (!email || !college) {
            skipped.push({
              email: email || "unknown",
              reason: "Missing email or college"
            });
            return;
          }

          const normalizedEmail = email.trim().toLowerCase();

          try {
            /* ---------- CHECK EXISTING ---------- */
            const exists = await User.findOne({
              email: normalizedEmail
            });

            if (exists) {
              skipped.push({
                email: normalizedEmail,
                reason: "Already exists"
              });
              return;
            }

            /* ---------- GENERATE PASSWORD ---------- */
            const tempPassword = crypto
              .randomBytes(4)
              .toString("hex");

            const hashedPassword = await bcrypt.hash(
              tempPassword,
              10
            );

            /* ---------- SEND MAIL ---------- */
            await transporter.sendMail({
              from: `"TSS Student Hub" <studentshub.tss@gmail.com>`,
              to: normalizedEmail,
              cc: "chandruvasan65@gmail.com",
              subject:
                "🎓 Welcome to TSS Student Hub – Login Credentials",
              html: `
<div style="font-family:Arial;background:#eef2f7;padding:30px;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.1);">
    
    <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:25px;text-align:center;color:#fff;">
      <h2 style="margin:0;">TSS Student Hub</h2>
      <p style="margin-top:6px;font-size:14px;">
        Your Learning Journey Starts Here 🚀
      </p>
    </div>

    <div style="padding:25px;color:#1f2937;">
      <h3>Dear ${name || "Student"} 👋</h3>
      <p>Your account has been <b>successfully created</b>.</p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
        <h4>🔐 Login Credentials</h4>
        <p><b>Email:</b> ${normalizedEmail}</p>
        <p><b>Password:</b> 
          <span style="background:#111827;color:#fff;padding:6px 10px;border-radius:6px;font-family:monospace;">
            ${tempPassword}
          </span>
        </p>
      </div>

      <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:16px;">
        <p><b>College:</b> ${college}</p>
        <p><b>Year:</b> ${year}</p>
        <p><b>Branch:</b> ${batch}</p>
        <p><b>Register No:</b> ${regNo}</p>
      </div>

      <div style="text-align:center;margin:30px 0;">
        <a href="https://platform.teamtechsign.in/login"
           style="background:#2563eb;color:#fff;text-decoration:none;padding:14px 36px;border-radius:30px;font-weight:600;">
          🚀 Login to Student Hub
        </a>
      </div>

      <p>Regards,<br/><b>TSS Team</b></p>
    </div>

    <div style="background:#f8fafc;text-align:center;padding:14px;font-size:12px;color:#64748b;">
      © ${new Date().getFullYear()} TSS Student Hub
    </div>

  </div>
</div>`
            }); 

            /* ---------- CREATE USER ---------- */
            await User.create({
              name,
              email: normalizedEmail,
              password: hashedPassword,
              role: "student",
              college,
              year,
              batch,
              regNo,
              phNo
            });

            created.push(normalizedEmail);
            logger.info(`Created & mailed: ${normalizedEmail}`);
          } catch (err) {
            failed.push({
              email: normalizedEmail,
              reason: err.message
            });

            logger.error(
              `Failed for ${normalizedEmail}: ${err.message}`
            );
          }
        })
      );

      /* ---------- WAIT BEFORE NEXT CHUNK ---------- */
      if (i < studentChunks.length - 1) {
        logger.info(
          `Waiting ${DELAY_BETWEEN_CHUNKS / 1000} seconds before next chunk`
        );
        await sleep(DELAY_BETWEEN_CHUNKS);
      }
    }

    return res.json({
      message: "Bulk student creation completed",
      summary: {
        total: students.length,
        created: created.length,
        skipped: skipped.length,
        failed: failed.length
      },
      created,
      skipped,
      failed
    });
  } catch (err) {
    logger.error("bulkCreateStudentsWithMail error: " + err.message);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
exports.createSingleStudentWithMail = async (req, res) => {
  logger.info("createSingleStudentWithMail API called");

  const {
    name,
    email,
    college,
    year,
    batch,
    regNo,
    phNo
  } = req.body;

  /* ---------- VALIDATION ---------- */
  if (!email || !college) {
    return res.status(400).json({
      message: "Email and college are required"
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    /* ---------- CHECK EXISTING USER ---------- */
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({
        message: "Student already exists"
      });
    }

    /* ---------- GENERATE PASSWORD ---------- */
    const tempPassword = crypto.randomBytes(4).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    /* ---------- BREVO SMTP ---------- */
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: "a0835b001@smtp-brevo.com",
        pass: "bskQbz5SggUfSJT"
      }
    });

    /* ---------- MAIL CONTENT ---------- */
    const mailOptions = {
      from: `"TSS Student Hub" <studentshub.tss@gmail.com>`,
      to: normalizedEmail,
      cc: "chandruvasan65@gmail.com",
      subject: "🎓 Welcome to TSS Student Hub – Login Credentials",
      html: `
<div style="font-family:Arial,Helvetica,sans-serif;background:#eef2f7;padding:30px;">
  <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.1);">

    <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:25px;text-align:center;color:#ffffff;">
      <h2 style="margin:0;">TSS Student Hub</h2>
      <p style="margin-top:6px;font-size:14px;opacity:0.9;">
        Your Learning Journey Starts Here 🚀
      </p>
    </div>

    <div style="padding:25px;color:#1f2937;">
      <h3>Dear ${name || "Student"} 👋</h3>

      <p>Your student account has been <b>successfully created</b>.</p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
        <h4>🔐 Login Credentials</h4>
        <p><b>Email:</b> ${normalizedEmail}</p>
        <p>
          <b>Password:</b>
          <span style="background:#111827;color:#ffffff;padding:6px 10px;border-radius:6px;font-family:monospace;">
            ${tempPassword}
          </span>
        </p>
      </div>

      <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:16px;">
        <p><b>College:</b> ${college}</p>
        <p><b>Year:</b> ${year}</p>
        <p><b>Branch:</b> ${batch}</p>
        <p><b>Register No:</b> ${regNo}</p>
      </div>

      <div style="text-align:center;margin:30px 0;">
        <a href="https://platform.teamtechsign.in/login"
           style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:30px;font-weight:600;">
          🚀 Login to Student Hub
        </a>
      </div>

      <p>Regards,<br/><b>TSS Team</b></p>
    </div>

    <div style="background:#f8fafc;text-align:center;padding:14px;font-size:12px;color:#64748b;">
      © ${new Date().getFullYear()} TSS Student Hub
    </div>

  </div>
</div>`
    };

    /* ---------- SEND MAIL FIRST ---------- */
    await transporter.sendMail(mailOptions);

    /* ---------- CREATE STUDENT ---------- */
    const newStudent = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "student",
      college,
      year,
      batch,
      regNo,
      phNo
    });

    logger.success(`Student created and mail sent for ${normalizedEmail}`);

    return res.status(201).json({
      message: "Student created successfully",
      student: {
        id: newStudent._id,
        name: newStudent.name,
        email: newStudent.email,
        college: newStudent.college,
        year: newStudent.year,
        batch: newStudent.batch
      }
    });

  } catch (err) {
    logger.error("createSingleStudentWithMail error: " + err.message);
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};
