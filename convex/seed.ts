import seedBackendVersionHistory from "./seed_data/backend_version_history.json";
import seedLastSync from "./seed_data/last_sync.json";
import { internalMutation } from "./_generated/server";

export default internalMutation(async (ctx) => {
  const existing = await ctx.db.query("backend_version_history").first();
  if (existing !== null) return;
  const existing2 = await ctx.db.query("last_sync").first();
  if (existing2 !== null) return;

  console.log("seeding data");
  for (const record of seedBackendVersionHistory) {
    const { _id, _creationTime, ...withoutSystemFields } = record;
    await ctx.db.insert("backend_version_history", withoutSystemFields);
  }
  for (const record of seedLastSync) {
    const { _id, _creationTime, ...withoutSystemFields } = record;
    await ctx.db.insert("last_sync", withoutSystemFields);
  }
});
