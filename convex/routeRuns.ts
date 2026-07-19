import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const startRouteRun = mutation({
	args: {
		routeId: v.id("routes"),
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

		if (profile.role !== "driver") {
			throw new Error("Only drivers can start route runs");
		}

		const route = await ctx.db.get(args.routeId);
		if (!route || route.isDeleted) {
			throw new Error("Route not found");
		}

		const existingActiveRun = await ctx.db
			.query("routeRuns")
			.withIndex("by_driverId", (q) => q.eq("driverId", profile._id))
			.take(100);

		const hasActive = existingActiveRun.find((r) => r.status === "running");
		if (hasActive) {
			throw new Error("You already have an active route run");
		}

		const now = Date.now();

		const routeRunId = await ctx.db.insert("routeRuns", {
			routeId: args.routeId,
			driverId: profile._id,
			startedAt: now,
			status: "running",
		});

		const checkpoints = await ctx.db.query("checkpoints").take(10000);

		const routeCheckpoints = checkpoints
			.filter((cp) => cp.routeId === args.routeId && !cp.isDeleted)
			.sort((a, b) => a.sequence - b.sequence);

		await Promise.all(
			routeCheckpoints.map((cp) =>
				ctx.db.insert("checkpointVisits", {
					routeRunId: routeRunId,
					checkpointId: cp._id,
					status: "pending",
					createdAt: now,
				}),
			),
		);

		return routeRunId;
	},
});

export const completeRouteRun = mutation({
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

		if (routeRun.driverId !== profile._id) {
			throw new Error("Not your route run");
		}

		if (routeRun.status !== "running") {
			throw new Error("Route run is not active");
		}

		await ctx.db.patch(args.routeRunId, {
			status: "completed",
			completedAt: Date.now(),
		});

		return args.routeRunId;
	},
});

export const cancelRouteRun = mutation({
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

		if (routeRun.driverId !== profile._id) {
			throw new Error("Not your route run");
		}

		if (routeRun.status !== "running") {
			throw new Error("Route run is not active");
		}

		await ctx.db.patch(args.routeRunId, {
			status: "cancelled",
			completedAt: Date.now(),
		});

		return args.routeRunId;
	},
});

export const getActiveRun = query({
	args: {},
	handler: async (ctx, _args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
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

		const routeRuns = await ctx.db
			.query("routeRuns")
			.withIndex("by_driverId", (q) => q.eq("driverId", profile._id))
			.take(100);

		const activeRun = routeRuns.find((r) => r.status === "running");
		if (!activeRun) {
			return null;
		}

		const route = await ctx.db.get(activeRun.routeId);
		if (!route || route.isDeleted) {
			return null;
		}

		const visits = await ctx.db
			.query("checkpointVisits")
			.withIndex("by_routeRunId", (q) => q.eq("routeRunId", activeRun._id))
			.take(1000);

		const enrichedVisits = await Promise.all(
			visits.map(async (v) => {
				const checkpoint = await ctx.db.get(v.checkpointId);
				return { ...v, checkpoint };
			}),
		);

		const sortedVisits = enrichedVisits
			.filter((v) => v.checkpoint && !v.checkpoint.isDeleted)
			.sort((a, b) => (a.checkpoint?.sequence ?? 0) - (b.checkpoint?.sequence ?? 0));

		return {
			...activeRun,
			route,
			visits: sortedVisits,
		};
	},
});

export const getRouteRunById = query({
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

		if (routeRun.driverId !== profile._id && profile.role !== "admin" && profile.role !== "manager") {
			throw new Error("Unauthorized");
		}

		const route = await ctx.db.get(routeRun.routeId);
		if (!route || route.isDeleted) {
			throw new Error("Route not found");
		}

		const visits = await ctx.db
			.query("checkpointVisits")
			.withIndex("by_routeRunId", (q) => q.eq("routeRunId", routeRun._id))
			.take(1000);

		const enrichedVisits = await Promise.all(
			visits.map(async (v) => {
				const checkpoint = await ctx.db.get(v.checkpointId);
				return { ...v, checkpoint };
			}),
		);

		const sortedVisits = enrichedVisits
			.filter((v) => v.checkpoint && !v.checkpoint.isDeleted)
			.sort((a, b) => (a.checkpoint?.sequence ?? 0) - (b.checkpoint?.sequence ?? 0));

		return {
			...routeRun,
			route,
			visits: sortedVisits,
		};
	},
});

export const listMyRuns = query({
	args: {},
	handler: async (ctx, _args) => {
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

		const routeRuns = await ctx.db
			.query("routeRuns")
			.withIndex("by_driverId", (q) => q.eq("driverId", profile._id))
			.order("desc")
			.take(100);

		const enriched = await Promise.all(
			routeRuns.map(async (r) => {
				const route = await ctx.db.get(r.routeId);
				return { ...r, route };
			}),
		);

		return enriched.filter((r) => r.route && !r.route.isDeleted);
	},
});

export const markCheckpointReached = mutation({
	args: {
		visitId: v.id("checkpointVisits"),
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

		const visit = await ctx.db.get(args.visitId);
		if (!visit) {
			throw new Error("Checkpoint visit not found");
		}

		const routeRun = await ctx.db.get(visit.routeRunId);
		if (!routeRun) {
			throw new Error("Route run not found");
		}

		if (routeRun.driverId !== profile._id) {
			throw new Error("Not your route run");
		}

		if (routeRun.status !== "running") {
			throw new Error("Route run is not active");
		}

		if (visit.status !== "pending") {
			throw new Error("Checkpoint already visited or skipped");
		}

		await ctx.db.patch(args.visitId, {
			status: "completed",
			reachedAt: Date.now(),
		});

		return args.visitId;
	},
});

export const skipCheckpoint = mutation({
	args: {
		visitId: v.id("checkpointVisits"),
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

		const visit = await ctx.db.get(args.visitId);
		if (!visit) {
			throw new Error("Checkpoint visit not found");
		}

		const routeRun = await ctx.db.get(visit.routeRunId);
		if (!routeRun) {
			throw new Error("Route run not found");
		}

		if (routeRun.driverId !== profile._id) {
			throw new Error("Not your route run");
		}

		if (routeRun.status !== "running") {
			throw new Error("Route run is not active");
		}

		if (visit.status !== "pending") {
			throw new Error("Checkpoint already visited or skipped");
		}

		await ctx.db.patch(args.visitId, {
			status: "skipped",
		});

		return args.visitId;
	},
});
