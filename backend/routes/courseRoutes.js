const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const Course = require("../models/Course");

const router = express.Router();

// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({
    message: "Course route is working"
  });
});



// CREATE COURSE - ADMIN ONLY
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        duration,
        difficulty,
        image
      } = req.body;

      if (!title || !description || !category || !duration) {
        return res.status(400).json({
          message: "Title, description, category and duration are required."
        });
      }

      const course = await Course.create({
        title,
        description,
        category,
        instructor: req.user.id,
        duration,
        difficulty,
        image
      });

      res.status(201).json({
        message: "Course created successfully.",
        course
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to create course.",
        error: error.message
      });
    }
  }
);

// GET ALL COURSES
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructor", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: courses.length,
      courses
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch courses.",
      error: error.message
    });
  }
});

// GET SINGLE COURSE
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name email");

    if (!course) {
      return res.status(404).json({
        message: "Course not found."
      });
    }

    res.status(200).json({
      course
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch course.",
      error: error.message
    });
  }
});

// UPDATE COURSE - ADMIN ONLY
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        duration,
        difficulty,
        image
      } = req.body;

      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          message: "Course not found."
        });
      }

      course.title = title ?? course.title;
      course.description = description ?? course.description;
      course.category = category ?? course.category;
      course.duration = duration ?? course.duration;
      course.difficulty = difficulty ?? course.difficulty;
      course.image = image ?? course.image;

      await course.save();

      res.status(200).json({
        message: "Course updated successfully.",
        course
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to update course.",
        error: error.message
      });
    }
  }
);

// DELETE COURSE - ADMIN ONLY
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          message: "Course not found."
        });
      }

      await Course.findByIdAndDelete(req.params.id);

      res.status(200).json({
        message: "Course deleted successfully."
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to delete course.",
        error: error.message
      });
    }
  }
);

module.exports = router;