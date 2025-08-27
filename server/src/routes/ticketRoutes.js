// import { Router } from "express";
// import Ticket from "../models/Ticket.js";
// import Project from "../models/Project.js";
// import User from "../models/User.js";
// import { auth, requireRole } from "../middleware/auth.js";
// import { sendTicketEmail } from "../lib/mailer.js";

// const router = Router();

// // GET /api/tickets - list with search & filters
// router.get("/", auth(), async (req, res) => {
//   const { q, status, priority, project, assignee } = req.query;
//   const filter = {};
//   if (status) filter.status = status;
//   if (priority) filter.priority = priority;
//   if (project) filter.project = project;
//   if (assignee) filter.assignee = assignee;

//   if (q) {
//     filter.$or = [
//       { title: new RegExp(q, "i") },
//       { description: new RegExp(q, "i") },
//     ];
//   }

//   // Non-admins see only tickets they belong to (reporter/assignee or project member)
//   if (req.user.role !== "admin") {
//     const userId = req.user._id;
//     filter.$or = filter.$or || [];
//     filter.$or.push(
//       { reporter: userId },
//       { assignee: userId },
//       {
//         project: {
//           $in: await Project.find({ members: userId }).distinct("_id"),
//         },
//       }
//     );
//   }

//   const tickets = await Ticket.find(filter)
//     .populate("project", "name key members")
//     .populate("reporter", "name email role")
//     .populate("assignee", "name email role")
//     .sort({ createdAt: -1 });

//   res.json(tickets);
// });

// // POST /api/tickets - create ticket
// router.post("/", auth(), async (req, res) => {
//   const { title, description, project, assignee, priority, labels } = req.body;
//   const proj = await Project.findById(project);
//   if (!proj) return res.status(400).json({ message: "Invalid project" });

//   const ticket = await Ticket.create({
//     title,
//     description,
//     project,
//     reporter: req.user._id,
//     assignee,
//     priority: priority || "medium",
//     labels,
//     status: "open",
//   });

//   await ticket.populate([
//     { path: "project", select: "name key" },
//     { path: "reporter", select: "name email" },
//     { path: "assignee", select: "name email" },
//   ]);

//   // Notify assignee
// if (assignee) {
//   const u = await User.findById(assignee);
//   if (u?.email) {
//     sendTicketEmail({
//       to: u.email,
//       subject: `New Ticket: ${ticket.title}`,
//       html: ticketEmailTemplate({
//         title: ticket.title,
//         projectKey: ticket.project.key,
//         action: "Assigned a ticket to you",
//         details: `You were assigned ticket "${ticket.title}".`,
//       })
//     }).catch(console.error);
//   }
// }

//   res.status(201).json(ticket);
// });

// // PATCH /api/tickets/:id - update ticket (assign, status, priority, comments)
// router.patch("/:id", auth(), async (req, res) => {
//   const updates = req.body;
//   const ticket = await Ticket.findById(req.params.id);
//   if (!ticket) return res.status(404).json({ message: "Ticket not found" });

//   const allowed =
//     req.user.role === "admin" ||
//     req.user.role === "manager" ||
//     String(ticket.reporter) === String(req.user._id) ||
//     String(ticket.assignee) === String(req.user._id);

//   if (!allowed) return res.status(403).json({ message: "Forbidden" });

//   // Restrict status updates
//   const allowedStatuses = ["open", "in-progress", "resolved", "closed", "fixed"];
//   if (updates.status && !allowedStatuses.includes(updates.status)) {
//     return res.status(400).json({ message: "Invalid status" });
//   }

//   // Track status timestamps
//   if (updates.status === "resolved") ticket.resolvedAt = new Date();
//   if (updates.status === "closed") ticket.closedAt = new Date();

//   // Notify if reassigned
//   if (updates.assignee && String(updates.assignee) !== String(ticket.assignee)) {
//     const u = await User.findById(updates.assignee);
//     if (u?.email) {
//       sendTicketEmail(u.email, {
//         title: ticket.title,
//         projectKey: ticket.project.toString?.() || "",
//         action: "Assigned a ticket to you",
//         details: `You were assigned ticket "${ticket.title}".`,
//       }).catch(console.error);
//     }
//   }

//   Object.assign(ticket, updates);
//   await ticket.save();

//   await ticket.populate([
//     { path: "project", select: "name key" },
//     { path: "reporter", select: "name email" },
//     { path: "assignee", select: "name email" },
//   ]);

//   res.json(ticket);
// });

// // DELETE /api/tickets/:id - only admin
// router.delete("/:id", auth(), requireRole("admin"), async (req, res) => {
//   const t = await Ticket.findById(req.params.id);
//   if (!t) return res.status(404).json({ message: "Ticket not found" });
//   await t.deleteOne();
//   res.json({ message: "Ticket deleted" });
// });

// export default router;









import { Router } from "express";
import Ticket from "../models/Ticket.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";
import { sendTicketEmail, ticketEmailTemplate } from "../lib/mailer.js";

const router = Router();

// GET /api/tickets - list with search & filters
router.get("/", auth(), async (req, res) => {
  const { q, status, priority, project, assignee } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (project) filter.project = project;
  if (assignee) filter.assignee = assignee;

  if (q) {
    filter.$or = [
      { title: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
    ];
  }

  if (req.user.role !== "admin") {
    const userId = req.user._id;
    filter.$or = filter.$or || [];
    filter.$or.push(
      { reporter: userId },
      { assignee: userId },
      {
        project: {
          $in: await Project.find({ members: userId }).distinct("_id"),
        },
      }
    );
  }

  const tickets = await Ticket.find(filter)
    .populate("project", "name key members")
    .populate("reporter", "name email role")
    .populate("assignee", "name email role")
    .sort({ createdAt: -1 });

  res.json(tickets);
});

// POST /api/tickets - create ticket
router.post("/", auth(), async (req, res) => {
  const { title, description, project, assignee, priority, labels } = req.body;
  const proj = await Project.findById(project);
  if (!proj) return res.status(400).json({ message: "Invalid project" });

  const ticket = await Ticket.create({
    title,
    description,
    project,
    reporter: req.user._id,
    assignee,
    priority: priority || "medium",
    labels,
    status: "open",
  });

  await ticket.populate([
    { path: "project", select: "name key" },
    { path: "reporter", select: "name email" },
    { path: "assignee", select: "name email" },
  ]);

  // Notify assignee safely
  if (assignee) {
    const u = await User.findById(assignee);
    if (u?.email) {
      sendTicketEmail({
        to: u.email,
        subject: `New Ticket: ${ticket.title}`,
        html: ticketEmailTemplate({
          title: ticket.title,
          projectKey: ticket.project.key,
          action: "Assigned a ticket to you",
          details: `You were assigned ticket "${ticket.title}".`,
        }),
      }).catch((err) =>
        console.error("[EMAIL ERROR] Failed to send ticket email:", err)
      );
    } else {
      console.warn("[EMAIL WARNING] Assignee has no email:", assignee);
    }
  }

  res.status(201).json(ticket);
});

// PATCH /api/tickets/:id - update ticket
router.patch("/:id", auth(), async (req, res) => {
  const updates = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  const allowed =
    req.user.role === "admin" ||
    req.user.role === "manager" ||
    String(ticket.reporter) === String(req.user._id) ||
    String(ticket.assignee) === String(req.user._id);

  if (!allowed) return res.status(403).json({ message: "Forbidden" });

  const allowedStatuses = ["open", "in-progress", "resolved", "closed", "fixed"];
  if (updates.status && !allowedStatuses.includes(updates.status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (updates.status === "resolved") ticket.resolvedAt = new Date();
  if (updates.status === "closed") ticket.closedAt = new Date();

  // Notify if reassigned safely
  if (updates.assignee && String(updates.assignee) !== String(ticket.assignee)) {
    const u = await User.findById(updates.assignee);
    if (u?.email) {
      sendTicketEmail({
        to: u.email,
        subject: `Ticket Assigned: ${ticket.title}`,
        html: ticketEmailTemplate({
          title: ticket.title,
          projectKey: ticket.project?.key || "",
          action: "Assigned a ticket to you",
          details: `You were assigned ticket "${ticket.title}".`,
        }),
      }).catch((err) =>
        console.error("[EMAIL ERROR] Failed to send reassignment email:", err)
      );
    } else {
      console.warn("[EMAIL WARNING] Reassigned user has no email:", updates.assignee);
    }
  }

  Object.assign(ticket, updates);
  await ticket.save();

  await ticket.populate([
    { path: "project", select: "name key" },
    { path: "reporter", select: "name email" },
    { path: "assignee", select: "name email" },
  ]);

  res.json(ticket);
});

// DELETE /api/tickets/:id - only admin
router.delete("/:id", auth(), requireRole("admin"), async (req, res) => {
  const t = await Ticket.findById(req.params.id);
  if (!t) return res.status(404).json({ message: "Ticket not found" });
  await t.deleteOne();
  res.json({ message: "Ticket deleted" });
});

export default router;
