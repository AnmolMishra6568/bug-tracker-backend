import { Router } from "express";
import Project from "../models/Project.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

// router.get("/", auth(), async (req, res) => {
//   const projects = await Project.find({ members: req.user._id }).populate("members", "name email role");
//   res.json(projects);
// });

router.get("/", auth(), async (req, res) => {
  let projects;

  if (req.user.role === "admin") {
    // Admins see all projects
    projects = await Project.find().populate("members", "name email role");
  } else {
    // Other users see only projects they belong to
    projects = await Project.find({ members: req.user._id })
      .populate("members", "name email role");
  }

  res.json(projects);
});

router.post("/", auth(), requireRole("admin", "manager"), async (req, res) => {
  const { name, key, description, members } = req.body;
  const exists = await Project.findOne({ key });
  if (exists) return res.status(409).json({ message: "Project key already exists" });
  const project = await Project.create({
    name, key, description, members: members && members.length ? members : [req.user._id], createdBy: req.user._id
  });
  res.status(201).json(project);
});

router.patch("/:id", auth(), requireRole("admin", "manager"), async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!project) return res.status(404).json({ message: "Project not found" });
  res.json(project);
});

router.delete("/:id", auth(), requireRole("admin"), async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });
  res.json({ message: "Project deleted" });
});

export default router;
