import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { distanceToSegment, haversineDistance } from "./geo";

const DEFAULT_RADIUS = 100;

export const evaluateGeofences = internalMutation({
	args: {
		vehicleId: v.id("vehicles"),
		previousLatitude: v.number(),
		previousLongitude: v.number(),
		latitude: v.number(),
		longitude: v.number(),
		timestamp: v.number(),
	},
	handler: async (ctx, args) => {
		const geofences = await ctx.db
			.query("checkpoints")
			.withIndex("by_routeId_and_isDeleted", (q) =>
				q.eq("routeId", null as never).eq("isDeleted", false),
			)
			.take(1000);

		let eventCount = 0;

		for (const geofence of geofences) {
			const radius = geofence.radius ?? DEFAULT_RADIUS;
			const insideCurr =
				haversineDistance(
					args.latitude,
					args.longitude,
					geofence.latitude,
					geofence.longitude,
				) <= radius;

			const state = await ctx.db
				.query("checkpointState")
				.withIndex("by_vehicleId_and_checkpointId", (q) =>
					q.eq("vehicleId", args.vehicleId).eq("checkpointId", geofence._id),
				)
				.first();

			const wasInside = state?.inside ?? false;

			if (insideCurr && !wasInside) {
				const eventId = await ctx.db.insert("events", {
					vehicleId: args.vehicleId,
					checkpointId: geofence._id,
					type: "entered",
					createdAt: args.timestamp,
				});

				await ctx.scheduler.runAfter(
					0,
					internal.pushNotifications.notifyForEvent,
					{ eventId },
				);

				if (state) {
					await ctx.db.patch(state._id, {
						inside: true,
						enteredAt: args.timestamp,
					});
				} else {
					await ctx.db.insert("checkpointState", {
						vehicleId: args.vehicleId,
						checkpointId: geofence._id,
						inside: true,
						enteredAt: args.timestamp,
					});
				}

				eventCount++;
			} else if (!insideCurr && wasInside) {
				const eventId = await ctx.db.insert("events", {
					vehicleId: args.vehicleId,
					checkpointId: geofence._id,
					type: "exited",
					createdAt: args.timestamp,
				});

				await ctx.scheduler.runAfter(
					0,
					internal.pushNotifications.notifyForEvent,
					{ eventId },
				);

				await ctx.db.patch(state!._id, {
					inside: false,
					exitedAt: args.timestamp,
				});

				eventCount++;
			} else if (!insideCurr && !wasInside) {
				const distance = distanceToSegment(
					args.previousLatitude,
					args.previousLongitude,
					args.latitude,
					args.longitude,
					geofence.latitude,
					geofence.longitude,
				);

				if (distance <= radius) {
					const eventId = await ctx.db.insert("events", {
						vehicleId: args.vehicleId,
						checkpointId: geofence._id,
						type: "crossed",
						createdAt: args.timestamp,
					});

					await ctx.scheduler.runAfter(
						0,
						internal.pushNotifications.notifyForEvent,
						{ eventId },
					);

					eventCount++;
				}
			}
		}

		return eventCount;
	},
});
