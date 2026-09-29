const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const progressRoutes = require("./routes/progressRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("LMS API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});