import express from "express";
import type { Express, Request, Response } from "express";

export function createApplication(): Express {
  const app = express();

  app.get("/health", (_: Request, res: Response) => {
    res.json({ message: "Welcome to Velo Maps!" });
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  return app;
}
