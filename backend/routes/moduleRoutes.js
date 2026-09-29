const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const Module = require("../models/Module");
const Course = require("../models/Course");

const router = express.Router();

// CREATE MODULE - ADMIN ONLY
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
        resourceLink,
        moduleOrder
      } = req.body;

      if (!courseId || !title || !description || !moduleOrder) {
        return res.status(400).json({
          message:
            "Course ID, title, description and module order are required."
        });
      }

      // Check course exists
      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          message: "Course not found."
        });
      }

      // Create module
      const module = await Module.create({
        courseId,
        title,
        description,
        resourceLink,
        moduleOrder
      });

      res.status(201).json({
        message: "Module created successfully.",
        module
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to create module.",
        error: error.message
      });
    }
  }
);

// GET MODULES BY COURSE
router.get(
  "/course/:courseId",
  authMiddleware,
  async (req, res) => {
    try {
      const modules = await Module.find({
        courseId: req.params.courseId
      }).sort({ moduleOrder: 1 });

      res.status(200).json({
        count: modules.length,
        modules
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch modules.",
        error: error.message
      });
    }
  }
);

// UPDATE MODULE - ADMIN ONLY
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        resourceLink,
        moduleOrder
      } = req.body;

      const module = await Module.findById(req.params.id);

      if (!module) {
        return res.status(404).json({
          message: "Module not found."
        });
      }

      module.title = title ?? module.title;
      module.description = description ?? module.description;
      module.resourceLink = resourceLink ?? module.resourceLink;
      module.moduleOrder = moduleOrder ?? module.moduleOrder;

      await module.save();

      res.status(200).json({
        message: "Module updated successfully.",
        module
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to update module.",
        error: error.message
      });
    }
  }
);

// DELETE MODULE - ADMIN ONLY
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const module = await Module.findById(req.params.id);

      if (!module) {
        return res.status(404).json({
          message: "Module not found."
        });
      }

      await Module.findByIdAndDelete(req.params.id);

      res.status(200).json({
        message: "Module deleted successfully."
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to delete module.",
        error: error.message
      });
    }
  }
);


// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({
    message: "Module route is working"
  });
});

module.exports = router;