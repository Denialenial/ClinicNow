const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const clinicRoutes = require("./routes/clinicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const staffRoutes = require("./routes/staffRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const { expandPendingCases } = require("./controllers/emergencyController");
const appointmentRoutes = require("./routes/appointmentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/appointments", appointmentRoutes);

// Run expansion every 30 seconds
setInterval(() => {
  expandPendingCases();
}, 30000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔄 Emergency case expansion running every 30 seconds`);
});