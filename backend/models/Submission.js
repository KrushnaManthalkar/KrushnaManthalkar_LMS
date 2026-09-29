const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    submissionLink: {
      type: String,
      required: true,
      trim: true
    },

    submissionDate: {
      type: Date,
      default: Date.now
    },

    marks: {
      type: Number,
      default: null,
      min: 0
    },

    feedback: {
      type: String,
      default: "",
      trim: true
    },

    status: {
      type: String,
      enum: ["Submitted", "Reviewed"],
      default: "Submitted"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Submission", submissionSchema);