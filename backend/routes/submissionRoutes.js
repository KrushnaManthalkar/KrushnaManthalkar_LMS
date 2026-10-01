const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Enrollment = require("../models/Enrollment");
const {
  isValidObjectId,
  isNonEmptyString
} = require("../utils/validation");

const router = express.Router();

// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({
    message: "Submission route is working"
  });
});



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

      if (!isValidObjectId(assignmentId)) {
  return res.status(400).json({
    message: "Invalid assignment ID."
  });
}

if (!isNonEmptyString(submissionLink)) {
  return res.status(400).json({
    message: "Submission link is required."
  });
}

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

      const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: assignment.courseId
      });

      if (!enrollment) {
        return res.status(403).json({
          message: "You are not enrolled in this course."
        });
      }

      if (
        assignment.deadline &&
        new Date() > new Date(assignment.deadline)
      ) {
        return res.status(400).json({
          message: "The assignment deadline has passed."
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
        submissionLink: submissionLink.trim()
      });

      res.status(201).json({
        message: "Assignment submitted successfully.",
        submission
      });

    } catch (error) {
      res.status(500).json({
        message: "Assignment submission failed.",
        
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
      if (!isValidObjectId(req.params.assignmentId)) {
  return res.status(400).json({
    message: "Invalid assignment ID."
  });
}
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
      if (!isValidObjectId(req.params.id)) {
  return res.status(400).json({
    message: "Invalid submission ID."
  });
}
      const { marks, feedback, status } = req.body;

      const submission = await Submission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({
          message: "Submission not found."
        });
      }

      if (marks !== undefined) {
        const assignment = await Assignment.findById(
          submission.assignmentId
        );

        if (!assignment) {
  return res.status(404).json({
    message: "Assignment not found."
  });
}

        const numericMarks = Number(marks);
        const maximumMarks = Number(
          assignment?.maximumMarks || 0
        );

        if (
          !Number.isFinite(numericMarks) ||
          numericMarks < 0 ||
          numericMarks > maximumMarks
        ) {
          return res.status(400).json({
            message: `Marks must be between 0 and ${maximumMarks}.`
          });
        }

        submission.marks = numericMarks;
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
        
      });
    }
  }
);

module.exports = router;