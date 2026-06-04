import cors from "cors";
import express, { type Request, type Response } from "express";
import morgan from "morgan";

import { setupSwagger } from "./shared/docs/swagger.js";
import { env } from "./config/env.js";
import { authMiddleware } from "./shared/middlewares/auth.middleware.js";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";
import { sendSuccess } from "./shared/utils/response.js";
import { aiRouter } from "./modules/ai/ai.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { caregiverRouter } from "./modules/caregiver/caregiver.routes.js";
import { dailyPlanRouter } from "./modules/daily-plan/daily-plan.routes.js";
import { intakeRouter } from "./modules/intake/intake.routes.js";
import { medicationRouter } from "./modules/medication/medication.routes.js";
import { medicationCatalogRouter } from "./modules/medication-catalog/medication-catalog.routes.js";
import { profileRouter } from "./modules/profile/profile.routes.js";
import { safetyRouter } from "./modules/safety/safety.routes.js";
import { scheduleRouter } from "./modules/schedule/schedule.routes.js";
import { uploadRouter } from "./modules/static/static.routes.js";

const app = express();

app.use(cors());
app.use(
  morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
    skip: (req: Request) => req.path === "/api/v1/health",
  }),
);
app.use(express.json());
app.use(authMiddleware);

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - System
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 */
app.get("/api/v1/health", (_req: Request, res: Response) => {
  sendSuccess(res, { status: "ok" });
});

setupSwagger(app);

app.use("/api/v1/profiles", profileRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/caregivers", caregiverRouter);
app.use("/api/v1/medications", medicationRouter);
app.use("/api/v1/medication-catalogs", medicationCatalogRouter);
app.use("/api/v1/schedules", scheduleRouter);
app.use("/api/v1/daily-plan", dailyPlanRouter);
app.use("/api/v1/safety", safetyRouter);
app.use("/api/v1/intakes", intakeRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/uploads", uploadRouter);

app.use(errorMiddleware);

export { app };
