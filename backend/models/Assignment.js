const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    deadline: {
      type: Date,
      required: true
    },

    maximumMarks: {
      type: Number,
      required: true,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Assignment", assignmentSchema);