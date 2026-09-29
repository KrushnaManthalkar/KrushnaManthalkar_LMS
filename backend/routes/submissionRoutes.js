const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");

const router = express.Router();

// SUBMIT ASSIGNMENT - STUDENT ONLY
router.post(
  "/",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const {
        assignmentId,
        submissionLink
      } = req.body;

      if (!assignmentId || !submissionLink) {
        return res.status(400).json({
          message: "Assignment ID and submission link are required."
        });
      }

      // Check assignment exists
      const assignment = await Assignment.findById(assignmentId);

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found."
        });
      }

      // Check if student already submitted
      const existingSubmission = await Submission.findOne({
        assignmentId,
        studentId: req.user.id
      });

      if (existingSubmission) {
        return res.status(400).json({
          message: "You have already submitted this assignment."
        });
      }

      // Create submission
      const submission = await Submission.create({
        assignmentId,
        studentId: req.user.id,
        submissionLink
      });

      res.status(201).json({
        message: "Assignment submitted successfully.",
        submission
      });

    } catch (error) {
      res.status(500).json({
        message: "Assignment submission failed.",
        error: error.message
      });
    }
  }
);

// GET MY SUBMISSIONS - STUDENT ONLY
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const submissions = await Submission.find({
        studentId: req.user.id
      })
        .populate("assignmentId", "title description deadline maximumMarks")
        .sort({ submissionDate: -1 });

      res.status(200).json({
        count: submissions.length,
        submissions
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch submissions.",
        error: error.message
      });
    }
  }
);

// GET SUBMISSIONS BY ASSIGNMENT - ADMIN ONLY
router.get(
  "/assignment/:assignmentId",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const submissions = await Submission.find({
        assignmentId: req.params.assignmentId
      })
        .populate("studentId", "name email")
        .populate("assignmentId", "title maximumMarks deadline")
        .sort({ submissionDate: -1 });

      res.status(200).json({
        count: submissions.length,
        submissions
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch submissions.",
        error: error.message
      });
    }
  }
);

// REVIEW SUBMISSION - ADMIN ONLY
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { marks, feedback, status } = req.body;

      const submission = await Submission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({
          message: "Submission not found."
        });
      }

      if (marks !== undefined) {
        submission.marks = marks;
      }

      if (feedback !== undefined) {
        submission.feedback = feedback;
      }

      if (status !== undefined) {
        submission.status = status;
      } else {
        submission.status = "Reviewed";
      }

      await submission.save();

      res.status(200).json({
        message: "Submission reviewed successfully.",
        submission
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to review submission.",
        error: error.message
      });
    }
  }
);

// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({
    message: "Submission route is working"
  });
});

module.exports = router;