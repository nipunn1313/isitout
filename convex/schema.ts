import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  backend_version_history: defineTable({
    pushDate: v.string(),
    url: v.string(),
    version: v.string(),
  }).index("pushDate", ["pushDate"]),
  version_history: defineTable({
    service: v.string(),
    version: v.string(),
  }).index("by_service", ["service", "version"]),
  last_sync: defineTable({
    time: v.float64(),
  }),
});
