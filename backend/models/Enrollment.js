const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    enrollmentDate: {
      type: Date,
      default: Date.now
    },

    completedModules: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Module",
      default: []
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    status: {
      type: String,
      enum: ["Enrolled", "In Progress", "Completed"],
      default: "Enrolled"
    }
  },
  {
    timestamps: true
  }
);

enrollmentSchema.index(
  {
    studentId: 1,
    courseId: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  "Enrollment",
  enrollmentSchema
);