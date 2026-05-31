import { env } from "./config/env.js";
import { app } from "./app.js";
import { logger } from "./shared/utils/logger.js";

app.listen(env.PORT, () => {
  logger.info("PillPal backend started", { port: env.PORT });
});
