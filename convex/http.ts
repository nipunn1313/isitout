import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/latest-stable-biz-version",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const service = url.searchParams.get("service");
    if (!service) {
      return new Response(JSON.stringify({ error: "Service is required" }), {
        status: 400,
      });
    }
    const version = await ctx.runQuery(
      api.version_history.latestStableReleaseForBiz,
      { service }
    );
    if (!version) {
      return new Response(
        JSON.stringify({
          error: "No stable version found for service " + service,
        }),
        { status: 404 }
      );
    }
    return new Response(JSON.stringify({ service, version }), { status: 200 });
  }),
});

auth.addHttpRoutes(http);

export default http;
