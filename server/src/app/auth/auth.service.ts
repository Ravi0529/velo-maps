import { OAuth2Client } from "google-auth-library";
import { db } from "../../db";
import { users } from "../../db/schema";
import { desc, eq } from "drizzle-orm";
import { createUserToken } from "../utils/token";
import { env } from "../../env";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function loginWithGoogle(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Invalid Google token");
  }

  const { email, name, picture } = payload;

  if (!email || !name || !picture) {
    throw new Error("Incomplete Google profile");
  }

  let user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .then((res) => res[0]);

  if (!user) {
    const newUser = await db
      .insert(users)
      .values({
        email,
        name,
        avatar: picture,
      })
      .returning();

    user = newUser[0];
  }

  if (!user) {
    throw new Error("Failed to create or retrieve user");
  }

  const token = createUserToken({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar!,
  });

  return {
    user,
    token,
  };
}

export async function listCommunityAvatars() {
  const community = await db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      lastSeen: users.lastSeen,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.lastSeen), desc(users.createdAt))
    .limit(18);

  return {
    users: community,
    total: community.length,
  };
}
