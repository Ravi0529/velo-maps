import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        avatar: string;
        createdAt: Date | null;
        lastSeen: Date | null;
      };
    }
  }
}
