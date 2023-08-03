import { mutation, query } from "./_generated/server";

export const upload = mutation(async ({ db }, { rows }: { rows: any }) => {
  // First wipe
  const existingRows = await db.query("backend_version_history").collect();
  for (const row of existingRows) {
    await db.delete(row._id);
  }

  for (const row of rows) {
    await db.insert("backend_version_history", row);
  }
});

export const list = query(async ({ db }) => {
  return (
    await db
      .query("backend_version_history")
      .withIndex("pushDate")
      .order("desc")
      .collect()
  ).map((row) => ({
    ...row,
    pushDate: +Date.parse(row.pushDate),
  }));
});
