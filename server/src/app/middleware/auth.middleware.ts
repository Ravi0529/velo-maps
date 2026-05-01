import type { NextFunction, Request, Response } from "express";
import { verifyUserToken } from "../utils/token";

export function authenticationMiddleware() {
  return function (req: Request, res: Response, next: NextFunction) {
    const header = req.headers["authorization"];

    if (!header) return next();

    if (!header.startsWith("Bearer ")) {
      return res
        .status(400)
        .json({ error: "Authorization must start with Bearer" });
    }

    const token = header.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        error: "Token missing",
      });
    }

    const user = verifyUserToken(token);

    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // @ts-ignore
    req.user = user;

    next();
  };
}

export function restrictToAuthenticatedUser() {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.user)
      return res.status(401).json({ error: "Authentication Required" });
    return next();
  };
}
