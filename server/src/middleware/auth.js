import jwt from "jsonwebtoken";
import User from "../models/User.js";

export function auth(required = true) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      if (required) return res.status(401).json({ message: "No token provided" });
      req.user = null; return next();
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id).select("-password");
      if (!user) return res.status(401).json({ message: "User not found" });
      req.user = user;
      next();
    } catch (e) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
