import moment from "moment";
import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const expectedSecret = process.env.ISITOUT_SECRET;

export const addRow = mutation({
  args: {
    version: v.string(),
    service: v.string(),
    secret: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { version, service, secret }) => {
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
  },
});

export const services = query({
  args: {},
  returns: (v as any).record(v.string(), v.number()),
  handler: async (ctx) => {
    const services: Record<string, number> = {};
    let doc = await ctx.db
      .query("version_history")
      .withIndex("by_service")
      .order("desc")
      .first();
    while (doc !== null) {
      const service = doc.service;
      services[service] = doc._creationTime;
      doc = await ctx.db
        .query("version_history")
        .withIndex("by_service", (q) => q.lt("service", service))
        .order("desc")
        .first();
    }
    return services;
  },
});

export const list = query({
  args: { service: v.optional(v.string()) },
  returns: v.array(
    v.object({
      _creationTime: v.number(),
      service: v.string(),
      version: v.string(),
      url: v.string(),
      buildDate: v.number(),
      pushDate: v.number(),
    })
  ),
  handler: async (ctx, { service }) => {
    checkIdentity(ctx);
    let queryResult;
    if (service) {
      queryResult = await ctx.db
        .query("version_history")
        .withIndex("by_service", (q) => q.eq("service", service))
        .order("desc")
        .collect();
    } else {
      queryResult = await ctx.db
        .query("version_history")
        .order("desc")
        .collect();
    }
    const result = queryResult.map((row) => {
      let url = `https://go.cvx.is/github_release/${row.service}/${row.version}`;
      const [datePart] = row.version.split("-");
      let buildDate;
      try {
        buildDate = +moment(datePart).toDate();
      } catch (e) {
        buildDate = 0;
        url = `https://github.com/get-convex/convex/commit/${row.version}`;
      }
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
  },
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
