import { Request, Response } from "express";
import { listCommunityAvatars, loginWithGoogle } from "./auth.service";

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

  public async handleListCommunity(_req: Request, res: Response) {
    try {
      const community = await listCommunityAvatars();
      return res.json(community);
    } catch (error) {
      console.error("Community Error:", error);
      return res.status(500).json({
        error: "Failed to fetch community avatars",
      });
    }
  }
}

export default AuthenticationController;
