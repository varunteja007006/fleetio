import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { haversineDistance } from "./geo";
import { fetchVehicleLocation } from "./wheelseye";

const HISTORY_MIN_DISPLACEMENT_M = 20;
const HISTORY_MAX_INTERVAL_MS = 60 * 1000;
const HISTORY_SPEED_DELTA_KMH = 5;
const HISTORY_HEADING_DELTA_DEG = 15;

export const listActiveIntegrations = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("vehicleIntegrations")
			.withIndex("by_status", (q) => q.eq("status", "active"))
			.take(1000);
	},
});

export const pollVehicles = internalAction({
	args: {},
	handler: async (ctx) => {
		const integrations: Doc<"vehicleIntegrations">[] = await ctx.runQuery(
			internal.sync.listActiveIntegrations,
			{},
		);

		await Promise.all(
			integrations.map(async (integration) => {
				try {
					const fix = await fetchVehicleLocation(
						integration.accessToken,
						integration.externalVehicleId,
					);

					await ctx.runMutation(
						internal.sync.ingestVehicleFix,
						{ vehicleId: integration.vehicleId, fix },
					);
				} catch (error) {
					console.log(
						`WheelsEye sync failed for vehicle ${integration.vehicleId}`,
						error,
					);
				}
			}),
		);

		return null;
	},
});

export const ingestVehicleFix = internalMutation({
	args: {
		vehicleId: v.id("vehicles"),
		fix: v.object({
			latitude: v.number(),
			longitude: v.number(),
			speed: v.number(),
			heading: v.number(),
			timestamp: v.number(),
		}),
	},
	handler: async (ctx, args) => {
		const { vehicleId, fix } = args;

		const current = await ctx.db
			.query("currentLocations")
			.withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicleId))
			.first();

		const previousLatitude = current?.latitude ?? fix.latitude;
		const previousLongitude = current?.longitude ?? fix.longitude;

		if (current) {
			await ctx.db.patch(current._id, {
				previousLatitude: current.latitude,
				previousLongitude: current.longitude,
				latitude: fix.latitude,
				longitude: fix.longitude,
				speed: fix.speed,
				heading: fix.heading,
				timestamp: fix.timestamp,
			});
		} else {
			await ctx.db.insert("currentLocations", {
				vehicleId,
				latitude: fix.latitude,
				longitude: fix.longitude,
				speed: fix.speed,
				heading: fix.heading,
				timestamp: fix.timestamp,
				previousLatitude: fix.latitude,
				previousLongitude: fix.longitude,
			});
		}

		const significant =
			!current ||
			haversineDistance(
				previousLatitude,
				previousLongitude,
				fix.latitude,
				fix.longitude,
			) > HISTORY_MIN_DISPLACEMENT_M ||
			fix.timestamp - (current?.timestamp ?? 0) > HISTORY_MAX_INTERVAL_MS ||
			Math.abs(fix.speed - (current?.speed ?? 0)) > HISTORY_SPEED_DELTA_KMH ||
			Math.abs(fix.heading - (current?.heading ?? 0)) > HISTORY_HEADING_DELTA_DEG;

		if (significant) {
			await ctx.db.insert("driverLocations", {
				vehicleId,
				latitude: fix.latitude,
				longitude: fix.longitude,
				speed: fix.speed,
				heading: fix.heading,
				timestamp: fix.timestamp,
			});

			await ctx.runMutation(internal.checkpointEngine.evaluateGeofences, {
				vehicleId,
				previousLatitude,
				previousLongitude,
				latitude: fix.latitude,
				longitude: fix.longitude,
				timestamp: fix.timestamp,
			});
		}

		const integration = await ctx.db
			.query("vehicleIntegrations")
			.withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicleId))
			.first();

		if (integration) {
			await ctx.db.patch(integration._id, { lastSyncAt: fix.timestamp });
		}

		return null;
	},
});
