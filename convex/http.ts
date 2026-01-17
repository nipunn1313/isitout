import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/latest-stable-biz-version",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { service } = await request.json();
    const version = await ctx.runQuery(
      api.version_history.latestStableReleaseForBiz,
      { service }
    );

    return new Response(JSON.stringify({ service, version }), { status: 200 });
  }),
});

auth.addHttpRoutes(http);

export default http;
