import moment from "moment";
import { mutation, query, QueryCtx } from "./_generated/server";

const expectedSecret = process.env.ISITOUT_SECRET;

export const addRow = mutation(
  async (
    ctx,
    {
      version,
      service,
      secret,
    }: { version: string; service: string; secret: string }
  ) => {
    if (secret !== expectedSecret) {
      throw new Error("bad credentials");
    }
    const currRow = await ctx.db
      .query("version_history")
      .withIndex("by_service", (q) => q.eq("service", service))
      .order("desc")
      .first();
    if (currRow?.version === version) {
      return;
    }
    await ctx.db.insert("version_history", { service, version });
  }
);

export const list = query(async (ctx) => {
  checkIdentity(ctx);
  return (
    await ctx.db
      .query("version_history")
      .withIndex("by_service", (q) => q.eq("service", "convex-backend"))
      .order("desc")
      .collect()
  ).map((row) => {
    const url = `https://go.cvx.is/github_release/${row.service}/${row.version}`;
    const [datePart] = row.version.split("-");
    const pushDate = +moment(datePart).toDate();
    return {
      version: row.version,
      url,
      pushDate,
    };
  });
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
