const mongoose = require("mongoose");

const ownTaskForStudentSchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
      required: true,
      trim: true
    },

    studentName: {
      type: String,
      required: true,
      trim: true
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    studentClg: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    studentBatch: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    studentYear: {
      type: Number,
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["started", "completed"],
      default: "started",
      index: true
    },

    startedOn: {
      type: Date,
      default: Date.now
    },

    completedBy: {
      type: Date,
      default: null
    },

    /* 🆕 TIME TAKEN (in minutes) */
    timeTaken: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "OwnTaskForStudent",
  ownTaskForStudentSchema
);
