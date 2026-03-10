import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import authRoutes from "./routes/auth.js";
import masterDataRoutes from "./routes/masterData.js";
import referenceRoutes from "./routes/reference.js";
import projectRoutes from "./routes/projects.js";
import changeRequestRoutes from "./routes/changeRequests.js";
import deliveryRoutes from "./routes/deliveries.js";
import activityRoutes from "./routes/activity.js";
import uploadRoutes from "./routes/uploads.js";
import reportRoutes from "./routes/reports.js";
import clientRoutes from "./routes/clients.js";
import { attachContext } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(attachContext);
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", masterDataRoutes);
app.use("/api/reference", referenceRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", changeRequestRoutes);
app.use("/api", deliveryRoutes);
app.use("/api", activityRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api", reportRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`INKA backend running on port ${env.port}`);
});
