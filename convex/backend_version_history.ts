import { secret as expectedSecret } from "../secret";
import { mutation, query, QueryCtx } from "./_generated/server";

export const upload = mutation(
  async (ctx, { rows, secret }: { rows: any; secret: string }) => {
    if (secret !== expectedSecret) {
      throw new Error("bad credentials");
    }
    // First wipe
    const existingRows = await ctx.db
      .query("backend_version_history")
      .collect();
    for (const row of existingRows) {
      await ctx.db.delete(row._id);
    }

    for (const row of rows) {
      await ctx.db.insert("backend_version_history", row);
    }
  }
);

export const list = query(async (ctx) => {
  checkIdentity(ctx);
  return (
    await ctx.db
      .query("backend_version_history")
      .withIndex("pushDate")
      .order("desc")
      .collect()
  ).map((row) => ({
    ...row,
    pushDate: +Date.parse(row.pushDate),
  }));
});

export async function checkIdentity(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated call");
  }
  if (!identity.email) {
    throw new Error("Requires email");
  }
  if (!identity.email.endsWith("@convex.dev")) {
    throw new Error("Must have @convex.dev email");
  }
  if (!identity.emailVerified) {
    throw new Error("Email must be verified");
  }
}
