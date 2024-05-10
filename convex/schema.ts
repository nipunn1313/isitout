import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  version_history: defineTable({
    service: v.string(),
    version: v.string(),
  }).index("by_service", ["service"]),
  last_sync: defineTable({
    time: v.float64(),
  }),
});
