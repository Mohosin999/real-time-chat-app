import express, { Request, Response } from "express";
import { applyMiddleware } from "./middleware";
import { asyncHandler } from "./middleware/asyncHandler";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";

const app = express();

applyMiddleware(app);
app.use(routes);

app.use(errorHandler);

app.get(
  "/health",
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      message: "Server is healthy",
      status: "OK",
    });
  })
);

export default app;
