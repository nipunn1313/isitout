import { mutation, query } from "./_generated/server";

export const update = mutation(async ({ db }, args: { time: string }) => {
  const lastSync = await db.query("last_sync").unique();
  if (lastSync) {
    db.replace(lastSync._id, args);
  } else {
    db.insert("last_sync", args);
  }
});

export const get = query(async ({ db }) => {
  return db.query("last_sync").unique();
});
