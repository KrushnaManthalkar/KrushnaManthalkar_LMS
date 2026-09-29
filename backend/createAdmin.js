const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("./models/User");

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({
      email: "admin@lms.com"
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await User.create({
      name: "LMS Admin",
      email: "admin@lms.com",
      password: hashedPassword,
      role: "admin"
    });

    console.log("Admin created successfully.");
    console.log("Email: admin@lms.com");
    console.log("Password: Admin@123");

    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  }
};

createAdmin();