import "server-only";

import { eq } from "drizzle-orm";
import type { ChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";

export async function ensureProfile(user: ChatGPTUser) {
  const db = getDb();
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.authUserId, user.userId),
  });
  if (existing) {
    await db.update(profiles).set({
      email: user.email,
      displayName: user.displayName,
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(profiles.id, existing.id));
    return { ...existing, email: user.email, displayName: user.displayName };
  }

  const profile = {
    id: crypto.randomUUID(),
    authUserId: user.userId,
    email: user.email,
    displayName: user.displayName,
    lastSeenAt: new Date(),
  };
  await db.insert(profiles).values(profile).onConflictDoNothing({ target: profiles.authUserId });
  return (await db.query.profiles.findFirst({ where: eq(profiles.authUserId, user.userId) }))!;
}
