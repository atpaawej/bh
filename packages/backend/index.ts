import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./lib/config";
import { errorHandler } from "./lib/middleware/errorHandler";
import { apiLimiter } from "./lib/middleware/rateLimiter";
import productRoutes from "./lib/routes/productRoutes";
import categoryRoutes from "./lib/routes/categoryRoutes";
import authRoutes from "./lib/routes/authRoutes";
import commentRoutes from "./lib/routes/commentRoutes";
import leaderboardRoutes from "./lib/routes/leaderboardRoutes";
import userRoutes from "./lib/routes/userRoutes";
import cronRoutes from "./lib/routes/cronRoutes";

const app = express();

// ── Security ──
app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Body + cookie parsing ──
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ── Rate limit all API routes ──
app.use("/api", apiLimiter);

// ── Health check ──
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/products/:slug/comments", commentRoutes);
app.use("/api/users", userRoutes);

// ── Internal cron / scheduled tasks ──
app.use("/api/cron", cronRoutes);

// ── Error handler (MUST be last) ──
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 BharatHunt API running on port ${config.port}`);
});

export default app;
