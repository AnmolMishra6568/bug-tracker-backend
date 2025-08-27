import { Router } from "express";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/me", auth(), async (req, res) => {
  res.json(req.user);
});

router.get("/", auth(), requireRole("admin", "manager"), async (_req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
});

router.patch("/:id/role", auth(), requireRole("admin"), async (req, res) => {
  const { role } = req.body;
  if (!["admin", "manager", "developer", "tester"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

export default router;
