const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const User = require("../models/User");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Enrollment = require("../models/Enrollment");

const router = express.Router();


// ADMIN DASHBOARD STATISTICS
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const totalStudents = await User.countDocuments({
        role: "student"
      });

      const totalCourses = await Course.countDocuments();

      const totalModules = await Module.countDocuments();

      const totalAssignments = await Assignment.countDocuments();

      const totalSubmissions = await Submission.countDocuments();

      res.status(200).json({
        message: "Admin dashboard data fetched successfully.",
        statistics: {
          totalStudents,
          totalCourses,
          totalModules,
          totalAssignments,
          totalSubmissions
        }
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch admin dashboard data.",
        error: error.message
      });
    }
  }
);


// VIEW ALL STUDENT PROGRESS
router.get(
  "/student-progress",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const enrollments = await Enrollment.find()
        .populate("studentId", "name email")
        .populate("courseId", "title category difficulty");

      res.status(200).json({
        message: "Student progress fetched successfully.",
        totalEnrollments: enrollments.length,
        progress: enrollments
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch student progress.",
        error: error.message
      });
    }
  }
);


// VIEW ALL STUDENTS
router.get(
  "/students",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {

      const students = await User.find({
        role: "student"
      }).select("-password").sort({
        createdAt: -1
      });

      const studentData = await Promise.all(
        students.map(async (student) => {

          const enrolledCourses = await Enrollment.countDocuments({
            studentId: student._id
          });

          return {
            id: student._id,
            name: student.name,
            email: student.email,
            role: student.role,
            createdAt: student.createdAt,
            enrolledCourses
          };
        })
      );

      res.status(200).json({
        message: "Students fetched successfully.",
        totalStudents: studentData.length,
        students: studentData
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch students.",
        error: error.message
      });
    }
  }
);


// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({
    message: "Admin route is working"
  });
});


module.exports = router;