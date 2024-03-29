/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * Generated by convex@1.0.2.
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as backend_version_history from "../backend_version_history";
import type * as ingest_github from "../ingest_github";
import type * as last_sync from "../last_sync";
import type * as seed from "../seed";
import type * as seed_data_backend_version_history from "../seed_data/backend_version_history";
import type * as seed_data_last_sync from "../seed_data/last_sync";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  backend_version_history: typeof backend_version_history;
  ingest_github: typeof ingest_github;
  last_sync: typeof last_sync;
  seed: typeof seed;
  "seed_data/backend_version_history": typeof seed_data_backend_version_history;
  "seed_data/last_sync": typeof seed_data_last_sync;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
