const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const {
  isValidObjectId
} = require("../utils/validation");

const router = express.Router();

// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({
    message: "Enrollment route is working"
  });
});



// ENROLL IN COURSE - STUDENT ONLY
router.post(
  "/",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const { courseId } = req.body;
      if (!isValidObjectId(courseId)) {
  return res.status(400).json({
    message: "Invalid course ID."
  });
}

      if (!courseId) {
        return res.status(400).json({
          message: "Course ID is required."
        });
      }

      // Check course exists
      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          message: "Course not found."
        });
      }

      // Check duplicate enrollment
      const existingEnrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId
      });

      if (existingEnrollment) {
        return res.status(400).json({
          message: "You are already enrolled in this course."
        });
      }

      // Create enrollment
      const enrollment = await Enrollment.create({
        studentId: req.user.id,
        courseId
      });

      res.status(201).json({
        message: "Enrolled successfully.",
        enrollment
      });

    } catch (error) {
      res.status(500).json({
        message: "Enrollment failed.",
        
      });
    }
  }
);

// GET MY ENROLLED COURSES - STUDENT ONLY
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const enrollments = await Enrollment.find({
        studentId: req.user.id
      })
        .populate("courseId")
        .sort({ enrollmentDate: -1 });

      res.status(200).json({
        count: enrollments.length,
        enrollments
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch enrolled courses.",
        
      });
    }
  }
);

// GET MY ENROLLMENT FOR A COURSE - STUDENT ONLY
router.get(
  "/:courseId",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
           if (!isValidObjectId(req.params.courseId)) {
  return res.status(400).json({
    message: "Invalid course ID."
  });
}
      const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: req.params.courseId
      })
        .populate("courseId")
        .populate("studentId", "name email");

      if (!enrollment) {
        return res.status(404).json({
          message: "Enrollment not found."
        });
      }

      res.status(200).json({
        enrollment
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch enrollment.",
        
      });
    }
  }
);

module.exports = router;