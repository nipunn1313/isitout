import { mutation, query } from "./_generated/server";
import { checkIdentity } from "./backend_version_history";

const expectedSecret = process.env.ISITOUT_SECRET;

export const update = mutation(
  async ({ db }, args: { time: number; secret: string }) => {
    const { secret, ...rest } = args;
    if (secret !== expectedSecret) {
      throw new Error("bad credentials");
    }
    const lastSync = await db.query("last_sync").unique();
    if (lastSync) {
      await db.patch(lastSync._id, rest);
    } else {
      await db.insert("last_sync", rest);
    }
  }
);

export const get = query(async (ctx) => {
  checkIdentity(ctx);
  return ctx.db.query("last_sync").unique();
});
