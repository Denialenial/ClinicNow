const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUser,
  updateUser,
  verifyStaff,
  updateStaffDutyStatus,
  banUser,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/user/:userId", getUser);
router.put("/user/:userId", updateUser);
router.put("/staff/:userId/duty", updateStaffDutyStatus);
router.put("/staff/:userId/approve", verifyStaff);
router.put("/user/:userId/ban", banUser);

module.exports = router;