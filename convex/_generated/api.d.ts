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
import type * as checkpointEngine from "../checkpointEngine.js";
import type * as checkpoints from "../checkpoints.js";
import type * as crons from "../crons.js";
import type * as driverLocations from "../driverLocations.js";
import type * as events from "../events.js";
import type * as geo from "../geo.js";
import type * as geocode from "../geocode.js";
import type * as geofences from "../geofences.js";
import type * as help from "../help.js";
import type * as http from "../http.js";
import type * as otp from "../otp.js";
import type * as profile from "../profile.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as requests from "../requests.js";
import type * as routeAssignments from "../routeAssignments.js";
import type * as routeRuns from "../routeRuns.js";
import type * as routes from "../routes.js";
import type * as sync from "../sync.js";
import type * as vehicleIntegrations from "../vehicleIntegrations.js";
import type * as vehicles from "../vehicles.js";
import type * as wheelseye from "../wheelseye.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  checkpointEngine: typeof checkpointEngine;
  checkpoints: typeof checkpoints;
  crons: typeof crons;
  driverLocations: typeof driverLocations;
  events: typeof events;
  geo: typeof geo;
  geocode: typeof geocode;
  geofences: typeof geofences;
  help: typeof help;
  http: typeof http;
  otp: typeof otp;
  profile: typeof profile;
  pushNotifications: typeof pushNotifications;
  requests: typeof requests;
  routeAssignments: typeof routeAssignments;
  routeRuns: typeof routeRuns;
  routes: typeof routes;
  sync: typeof sync;
  vehicleIntegrations: typeof vehicleIntegrations;
  vehicles: typeof vehicles;
  wheelseye: typeof wheelseye;
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

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
