import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  version_history: defineTable({
    service: v.string(),
    version: v.string(),
    release_tag: v.optional(v.string()),
    is_stable: v.optional(v.boolean()),
  })
    .index("by_service", ["service"])
    .index("by_service_and_version", ["service", "version"])
    .index("by_service_and_release_tag", ["service", "release_tag"])
    .index("by_service_release_tag_and_is_stable", [
      "service",
      "release_tag",
      "is_stable",
    ]),
  last_sync: defineTable({
    time: v.float64(),
  }),
});
