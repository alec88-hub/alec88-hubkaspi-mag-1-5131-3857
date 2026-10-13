import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { base } from "../__core/app";
import { auth } from "../auth";
import { db } from "../database";
import { admins } from "../database/schema";
export const admin = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) throw new ORPCError("UNAUTHORIZED");
  const row = await db
    .select()
    .from(admins)
    .where(eq(admins.email, session.user.email.toLowerCase()));
  if (!row.length)
    throw new ORPCError("FORBIDDEN", { message: "Этот аккаунт не назначен администратором" });
  return next({ context: { user: session.user } });
});
