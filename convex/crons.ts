import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const crons = cronJobs();

crons.interval(
  "track convex-backend releases",
  { minutes: 1 },
  internal.github.trackConvexBackendRelease,
);

crons.interval(
  "track convex-backend container",
  { minutes: 1 },
  internal.github.trackConvexBackendContainer,
);

crons.interval(
  "track branch revs",
  { minutes: 1 },
  internal.github.trackBranchRevs,
);

export default crons;
