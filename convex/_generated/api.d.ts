/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as http from "../http.js";
import type * as resolutionTemplates from "../resolutionTemplates.js";
import type * as resolutions from "../resolutions.js";
import type * as seedCategroies from "../seedCategroies.js";
import type * as seedTemplates from "../seedTemplates.js";
import type * as userCategoryStats from "../userCategoryStats.js";
import type * as userResolutions from "../userResolutions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  categories: typeof categories;
  http: typeof http;
  resolutionTemplates: typeof resolutionTemplates;
  resolutions: typeof resolutions;
  seedCategroies: typeof seedCategroies;
  seedTemplates: typeof seedTemplates;
  userCategoryStats: typeof userCategoryStats;
  userResolutions: typeof userResolutions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
