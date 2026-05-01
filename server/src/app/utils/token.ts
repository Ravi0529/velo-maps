import JWT from "jsonwebtoken";
import { env } from "../../env";

export interface UserTokenPayload {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export function createUserToken(payload: UserTokenPayload) {
  const token = JWT.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
  return token;
}

export function verifyUserToken(token: string): UserTokenPayload | null {
  try {
    const payload = JWT.verify(token, env.JWT_SECRET) as UserTokenPayload;
    return payload;
  } catch {
    return null;
  }
}
