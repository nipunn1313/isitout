import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  version_history: defineTable({
    service: v.string(),
    version: v.string(),
    is_stable: v.optional(v.boolean()),
  })
    .index("by_service", ["service"])
    .index("by_service_and_is_stable", ["service", "is_stable"])
    .index("by_service_and_version", ["service", "version"]),
  last_sync: defineTable({
    time: v.float64(),
  }),
});
