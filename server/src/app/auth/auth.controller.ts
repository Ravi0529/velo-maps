import { Request, Response } from "express";
import { loginWithGoogle } from "./auth.service";

class AuthenticationController {
  public async handleGoogleAuth(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: "Google token is required",
        });
      }

      const result = await loginWithGoogle(token);

      return res.json(result);
    } catch (error) {
      console.error("Auth Error:", error);
      return res.status(500).json({
        error: "Authentication failed",
      });
    }
  }
}

export default AuthenticationController;
