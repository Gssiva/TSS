import mongoose from "mongoose";

const assignmentTimerSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    endTime: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

/* Prevent duplicate timer for same student + assignment */
assignmentTimerSchema.index(
  { assignmentId: 1, studentId: 1 },
  { unique: true }
);

const Assignmenttimer = mongoose.model(
  "Assignmenttimer",
  assignmentTimerSchema
);

export default Assignmenttimer;
