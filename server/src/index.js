import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import { notFound, errorHandler } from "./middleware/error.js";

dotenv.config();
const app = express();

const allowedOrigins = [
  "http://localhost:5173", // local dev (Vite default)
  "http://localhost:3000", // local dev (CRA default)
  "https://bug-tracker-frontend-gamma.vercel.app" // your deployed frontend
];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => res.json({ status: "ok", service: "bug-tracker-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tickets", ticketRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(port, () => console.log(`API listening on :${port}`));
});
