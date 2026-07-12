import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const listByDriver = query({
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

		const assignments = await ctx.db
			.query("routeAssignments")
			.withIndex("by_driverId", (q) => q.eq("driverId", profile._id))
			.take(100);

		const enriched = await Promise.all(
			assignments.map(async (a) => {
				const route = await ctx.db.get(a.routeId);
				return { ...a, route };
			}),
		);

		return enriched.filter((a) => a.route && !a.route.isDeleted);
	},
});

export const listAll = query({
	args: {},
	handler: async (ctx, _args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const callerProfile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!callerProfile || (callerProfile.role !== "admin" && callerProfile.role !== "manager")) {
			throw new Error("Unauthorized");
		}

		const assignments = await ctx.db
			.query("routeAssignments")
			.order("desc")
			.take(1000);

		const enriched = await Promise.all(
			assignments.map(async (a) => {
				const route = await ctx.db.get(a.routeId);
				const driverProfile = await ctx.db.get(a.driverId);
				const assignerProfile = await ctx.db.get(a.assignedBy);
				return { ...a, route, driverProfile, assignerProfile };
			}),
		);

		return enriched;
	},
});

export const create = mutation({
	args: {
		profileId: v.id("profiles"),
		routeId: v.id("routes"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const callerProfile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!callerProfile || callerProfile.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const driverProfile = await ctx.db.get(args.profileId);
		if (!driverProfile) {
			throw new Error("Driver profile not found");
		}

		if (driverProfile.role !== "driver") {
			throw new Error("Selected profile is not a driver");
		}

		const route = await ctx.db.get(args.routeId);
		if (!route || route.isDeleted) {
			throw new Error("Route not found");
		}

		return ctx.db.insert("routeAssignments", {
			routeId: args.routeId,
			driverId: args.profileId,
			assignedBy: callerProfile._id,
			active: true,
		});
	},
});

export const remove = mutation({
	args: {
		assignmentId: v.id("routeAssignments"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const callerProfile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!callerProfile || callerProfile.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const assignment = await ctx.db.get(args.assignmentId);
		if (!assignment) {
			throw new Error("Assignment not found");
		}

		await ctx.db.delete(args.assignmentId);
		return args.assignmentId;
	},
});

export const getActiveAssignmentForRoute = query({
	args: {
		routeId: v.id("routes"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			return null;
		}

		const assignments = await ctx.db
			.query("routeAssignments")
			.withIndex("by_routeId", (q) => q.eq("routeId", args.routeId))
			.take(10);

		const active = assignments.find((a) => a.active);
		if (!active) {
			return null;
		}

		const driverProfile = await ctx.db.get(active.driverId);

		return { ...active, driverProfile };
	},
});
