import moment from "moment";
import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

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

async function listServices(ctx: QueryCtx) {
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
}

export const services = query({
  args: {},
  returns: (v as any).record(v.string(), v.number()),
  handler: listServices,
});

const renderedVersionHistoryRow = v.object({
  _creationTime: v.number(),
  service: v.string(),
  version: v.string(),
  url: v.string(),
  buildDate: v.number(),
  pushDate: v.number(),
});

export const list = query({
  args: { service: v.optional(v.string()) },
  returns: v.array(renderedVersionHistoryRow),
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
    const result = queryResult.map(renderVersionHistoryRow);
    return result;
  },
});

function renderVersionHistoryRow(row: Doc<"version_history">) {
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
}

export const listLatest = query({
  args: {},
  returns: v.array(renderedVersionHistoryRow),
  handler: async (ctx) => {
    const services = await listServices(ctx);
    const result = await Promise.all(
      Object.entries(services).map(async ([service, _creationTime]) => {
        const row = await ctx.db
          .query("version_history")
          .withIndex("by_service", (q) => q.eq("service", service))
          .order("desc")
          .first();
        return renderVersionHistoryRow(row!);
      })
    );
    // Sort by pushDate descending.
    result.sort((a, b) => b.pushDate - a.pushDate);
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
      .order("desc")
      .first();
  },
});

export async function checkIdentity(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthenticated call");
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Unauthenticated call");
  }
  if (!user.email) {
    throw new Error("Requires email");
  }
  if (!user.email.endsWith("@convex.dev")) {
    throw new Error("Must have @convex.dev email");
  }
  if (user.emailVerificationTime === undefined) {
    throw new Error("Email must be verified");
  }
}
