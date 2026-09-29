const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Module = require("../models/Module");

const router = express.Router();

// TEST ROUTE
router.get(
  "/test",
  (req, res) => {
    res.json({
      message:
        "Progress route is working"
    });
  }
);





// GET COURSE PROGRESS - STUDENT ONLY
router.get(
  "/:courseId",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: req.params.courseId
      }).populate(
        "courseId",
        "title description"
      );

      if (!enrollment) {
        return res.status(404).json({
          message: "You are not enrolled in this course."
        });
      }

      res.status(200).json({
        course: enrollment.courseId,
        progress: enrollment.progress,
        status: enrollment.status,
        completedModules:
          enrollment.completedModules
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch course progress.",
        error: error.message
      });
    }
  }
);


// COMPLETE MODULE - STUDENT ONLY
router.post(
  "/:courseId/module/:moduleId/complete",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const { courseId, moduleId } =
        req.params;

      // Find student's enrollment
      const enrollment =
        await Enrollment.findOne({
          studentId: req.user.id,
          courseId
        });

      if (!enrollment) {
        return res.status(404).json({
          message:
            "You are not enrolled in this course."
        });
      }


      // Check course
      const course =
        await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          message: "Course not found."
        });
      }


      // Check module belongs to this course
      const module =
        await Module.findOne({
          _id: moduleId,
          courseId
        });

      if (!module) {
        return res.status(404).json({
          message:
            "Module not found in this course."
        });
      }


      // Count total modules
      const totalModules =
        await Module.countDocuments({
          courseId
        });

      if (totalModules === 0) {
        return res.status(400).json({
          message:
            "No modules found for this course."
        });
      }


      // Check whether module was already completed
      const alreadyCompleted =
        enrollment.completedModules.some(
          completedModule =>
            completedModule.toString() ===
            moduleId
        );


      // If already completed, do not increase progress
      if (alreadyCompleted) {
        return res.status(200).json({
          message:
            "Module was already completed.",
          module: {
            id: module._id,
            title: module.title
          },
          progress:
            enrollment.progress,
          status:
            enrollment.status,
          alreadyCompleted: true
        });
      }


      // Add module to completed modules
      enrollment.completedModules.push(
        module._id
      );


      // Calculate progress from actual completed modules
      const completedCount =
        enrollment.completedModules.length;

      const progress =
        Math.round(
          (completedCount / totalModules) *
            100
        );

      enrollment.progress =
        Math.min(progress, 100);


      // Update enrollment status
      if (enrollment.progress === 100) {
        enrollment.status =
          "Completed";
      } else {
        enrollment.status =
          "In Progress";
      }


      await enrollment.save();


      res.status(200).json({
        message:
          "Module completed successfully.",
        module: {
          id: module._id,
          title: module.title
        },
        progress:
          enrollment.progress,
        status:
          enrollment.status,
        completedModules:
          enrollment.completedModules.length,
        totalModules,
        alreadyCompleted: false
      });

    } catch (error) {
      res.status(500).json({
        message:
          "Failed to complete module.",
        error: error.message
      });
    }
  }
);


module.exports = router;