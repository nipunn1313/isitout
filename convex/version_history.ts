import moment from "moment";
import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

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

export const services = query(async (ctx) => {
  const services = [];
  let doc = await ctx.db
    .query("version_history")
    .withIndex("by_service")
    .first();
  while (doc !== null) {
    const service = doc.service;
    services.push(service);
    doc = await ctx.db
      .query("version_history")
      .withIndex("by_service", (q) => q.gt("service", service))
      .first();
  }
  return services;
});

export const list = query(async (ctx, { service }: { service?: string }) => {
  checkIdentity(ctx);
  let queryResult;
  if (service) {
    queryResult = await ctx.db
      .query("version_history")
      .withIndex("by_service", (q) => q.eq("service", service))
      .order("desc")
      .collect();
  } else {
    queryResult = await ctx.db.query("version_history").order("desc").collect();
  }
  const result = queryResult.map((row) => {
    const url = `https://go.cvx.is/github_release/${row.service}/${row.version}`;
    const [datePart] = row.version.split("-");
    const buildDate = +moment(datePart).toDate();
    const pushDate = row._creationTime;
    return {
      _creationTime: row._creationTime,
      service: row.service,
      version: row.version,
      url,
      buildDate,
      pushDate,
    };
  });
  return result;
});

export const prevRev = query({
  args: {
    service: v.string(),
    _creationTime: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("version_history")
      .withIndex("by_service", (q) =>
        q.eq("service", args.service).lt("_creationTime", args._creationTime)
      )
      .first();
  },
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
