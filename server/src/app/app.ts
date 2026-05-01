import express from "express";
import type { Express, Request, Response } from "express";
import cors from "cors";

import { authRouter } from "./auth/auth.routes";
import { authenticationMiddleware } from "./middleware/auth.middleware";

export function createApplication(): Express {
  const app = express();

  app.get("/health", (_: Request, res: Response) => {
    res.json({ message: "Welcome to Velo Maps!" });
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(cors());

  app.use(authenticationMiddleware());
  app.use("/api/auth", authRouter);

  return app;
}
