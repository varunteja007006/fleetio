import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

function haversineDistance(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const R = 6371000;
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) *
			Math.cos(toRad(lat2)) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

const PROXIMITY_THRESHOLD = 100;

async function autoDetectCheckpoints(
	ctx: any,
	routeRunId: any,
	latitude: number,
	longitude: number,
) {
	const visits = await ctx.db
		.query("checkpointVisits")
		.withIndex("by_routeRunId", (q) => q.eq("routeRunId", routeRunId))
		.take(1000);

	const pendingVisits = visits.filter((v: any) => v.status === "pending");

	await Promise.all(
		pendingVisits.map(async (visit: any) => {
			const checkpoint = await ctx.db.get(visit.checkpointId);
			if (!checkpoint || checkpoint.isDeleted) return;

			const distance = haversineDistance(
				latitude,
				longitude,
				checkpoint.latitude,
				checkpoint.longitude,
			);

			if (distance <= PROXIMITY_THRESHOLD) {
				await ctx.db.patch(visit._id, {
					status: "completed",
					reachedAt: Date.now(),
				});
			}
		}),
	);
}

export const recordLocation = mutation({
	args: {
		routeRunId: v.id("routeRuns"),
		latitude: v.number(),
		longitude: v.number(),
		speed: v.optional(v.number()),
		heading: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!profile) {
			throw new Error("Profile not found");
		}

		const routeRun = await ctx.db.get(args.routeRunId);
		if (!routeRun) {
			throw new Error("Route run not found");
		}

		if (routeRun.driverId !== profile._id) {
			throw new Error("Not your route run");
		}

		if (routeRun.status !== "running") {
			throw new Error("Route run is not active");
		}

		await ctx.db.insert("driverLocations", {
			routeRunId: args.routeRunId,
			latitude: args.latitude,
			longitude: args.longitude,
			speed: args.speed,
			heading: args.heading,
			timestamp: Date.now(),
		});

		await autoDetectCheckpoints(ctx, args.routeRunId, args.latitude, args.longitude);
	},
});

export const recordLocationBatch = mutation({
	args: {
		locations: v.array(
			v.object({
				routeRunId: v.id("routeRuns"),
				latitude: v.number(),
				longitude: v.number(),
				speed: v.optional(v.number()),
				heading: v.optional(v.number()),
			}),
		),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!profile) {
			throw new Error("Profile not found");
		}

		const now = Date.now();

		const routeRunId = args.locations[0].routeRunId;

		await Promise.all(
			args.locations.map((loc) => {
				if (loc.routeRunId !== routeRunId) {
					throw new Error("All locations must belong to the same route run");
				}
				return ctx.db.insert("driverLocations", {
					routeRunId: loc.routeRunId,
					latitude: loc.latitude,
					longitude: loc.longitude,
					speed: loc.speed,
					heading: loc.heading,
					timestamp: now,
				});
			}),
		);

		const lastLoc = args.locations[args.locations.length - 1];
		await autoDetectCheckpoints(ctx, routeRunId, lastLoc.latitude, lastLoc.longitude);
	},
});

export const getLocationsForRun = query({
	args: {
		routeRunId: v.id("routeRuns"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!profile) {
			throw new Error("Profile not found");
		}

		const routeRun = await ctx.db.get(args.routeRunId);
		if (!routeRun) {
			throw new Error("Route run not found");
		}

		if (
			routeRun.driverId !== profile._id &&
			profile.role !== "admin" &&
			profile.role !== "manager"
		) {
			throw new Error("Unauthorized");
		}

		const locations = await ctx.db
			.query("driverLocations")
			.withIndex("by_routeRunId", (q) => q.eq("routeRunId", args.routeRunId))
			.order("asc")
			.take(10000);

		return locations;
	},
});

export const getLatestLocation = query({
	args: {
		routeRunId: v.id("routeRuns"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			return null;
		}

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!profile) {
			return null;
		}

		const locations = await ctx.db
			.query("driverLocations")
			.withIndex("by_routeRunId", (q) => q.eq("routeRunId", args.routeRunId))
			.order("desc")
			.take(1);

		return locations[0] ?? null;
	},
});
