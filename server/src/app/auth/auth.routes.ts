import express from "express";
import type { Router } from "express";
import AuthenticationController from "./auth.controller";

export const authRouter: Router = express.Router();

const authenticationController = new AuthenticationController();

authRouter.get(
  "/community",
  authenticationController.handleListCommunity.bind(authenticationController),
);

authRouter.post(
  "/google",
  authenticationController.handleGoogleAuth.bind(authenticationController),
);
