const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");

const router = express.Router();

// CREATE ASSIGNMENT - ADMIN ONLY
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const {
        courseId,
        title,
        description,
        deadline,
        maximumMarks
      } = req.body;

      if (
        !courseId ||
        !title ||
        !description ||
        !deadline ||
        !maximumMarks
      ) {
        return res.status(400).json({
          message:
            "Course ID, title, description, deadline and maximum marks are required."
        });
      }

      // Check course exists
      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          message: "Course not found."
        });
      }

      // Create assignment
      const assignment = await Assignment.create({
        courseId,
        title,
        description,
        deadline,
        maximumMarks
      });

      res.status(201).json({
        message: "Assignment created successfully.",
        assignment
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to create assignment.",
        error: error.message
      });
    }
  }
);

// GET ASSIGNMENTS BY COURSE
router.get(
  "/course/:courseId",
  authMiddleware,
  async (req, res) => {
    try {
      const assignments = await Assignment.find({
        courseId: req.params.courseId
      }).sort({ deadline: 1 });

      res.status(200).json({
        count: assignments.length,
        assignments
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch assignments.",
        error: error.message
      });
    }
  }
);

// UPDATE ASSIGNMENT - ADMIN ONLY
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        deadline,
        maximumMarks
      } = req.body;

      const assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found."
        });
      }

      assignment.title = title ?? assignment.title;
      assignment.description = description ?? assignment.description;
      assignment.deadline = deadline ?? assignment.deadline;
      assignment.maximumMarks = maximumMarks ?? assignment.maximumMarks;

      await assignment.save();

      res.status(200).json({
        message: "Assignment updated successfully.",
        assignment
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to update assignment.",
        error: error.message
      });
    }
  }
);

// DELETE ASSIGNMENT - ADMIN ONLY
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found."
        });
      }

      await Assignment.findByIdAndDelete(req.params.id);

      res.status(200).json({
        message: "Assignment deleted successfully."
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to delete assignment.",
        error: error.message
      });
    }
  }
);

// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({
    message: "Assignment route is working"
  });
});

module.exports = router;