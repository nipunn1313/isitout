import { mutation, query } from "./_generated/server";
import { checkIdentity } from "./backend_version_history";

const expectedSecret = process.env.BACKEND_HISTORY_SECRET;

export const update = mutation(
  async ({ db }, args: { time: string; secret: string }) => {
    const { secret, ...rest } = args;
    if (secret !== expectedSecret) {
      throw new Error("bad credentials");
    }
    const lastSync = await db.query("last_sync").unique();
    if (lastSync) {
      await db.replace(lastSync._id, rest);
    } else {
      await db.insert("last_sync", rest);
    }
  }
);

export const get = query(async (ctx) => {
  checkIdentity(ctx);
  return ctx.db.query("last_sync").unique();
});
