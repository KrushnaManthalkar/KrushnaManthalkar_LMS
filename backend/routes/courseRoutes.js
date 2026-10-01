const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const Course = require("../models/Course");
const {
  isValidObjectId,
  isNonEmptyString
} = require("../utils/validation");

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
      
    });
  }
});

// GET SINGLE COURSE
router.get("/:id", async (req, res) => {
  try {
        if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid course ID."
      });
    }
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

      // Validate course ID
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid course ID."
        });
      }

      const {
        title,
        description,
        category,
        duration,
        difficulty,
        image
      } = req.body;


      // Validate provided fields
      if (
        title !== undefined &&
        !isNonEmptyString(title)
      ) {
        return res.status(400).json({
          message: "Course title cannot be empty."
        });
      }


      if (
        description !== undefined &&
        !isNonEmptyString(description)
      ) {
        return res.status(400).json({
          message: "Course description cannot be empty."
        });
      }


      if (
        category !== undefined &&
        !isNonEmptyString(category)
      ) {
        return res.status(400).json({
          message: "Course category cannot be empty."
        });
      }


      if (
        duration !== undefined &&
        !isNonEmptyString(duration)
      ) {
        return res.status(400).json({
          message: "Course duration cannot be empty."
        });
      }


      // Find course
      const course =
        await Course.findById(req.params.id);


      if (!course) {
        return res.status(404).json({
          message: "Course not found."
        });
      }


      // Update only provided fields
      course.title =
        title !== undefined
          ? title.trim()
          : course.title;

      course.description =
        description !== undefined
          ? description.trim()
          : course.description;

      course.category =
        category !== undefined
          ? category.trim()
          : course.category;

      course.duration =
        duration !== undefined
          ? duration.trim()
          : course.duration;

      course.difficulty =
        difficulty !== undefined
          ? difficulty
          : course.difficulty;

      course.image =
        image !== undefined
          ? image.trim()
          : course.image;


      await course.save();


      res.status(200).json({
        message: "Course updated successfully.",
        course
      });

    } catch (error) {

      res.status(500).json({
        message: "Failed to update course."
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
            if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid course ID."
        });
      }
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
        
      });
    }
  }
);

module.exports = router;