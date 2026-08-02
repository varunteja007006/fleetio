import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const list = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return [];
		}

		return ctx.db
			.query("checkpoints")
			.withIndex("by_routeId_and_isDeleted", (q) =>
				q.eq("routeId", null as never).eq("isDeleted", false),
			)
			.take(1000);
	},
});

export const getById = query({
	args: {
		checkpointId: v.id("checkpoints"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return null;
		}

		return ctx.db.get(args.checkpointId);
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		latitude: v.number(),
		longitude: v.number(),
		radius: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
			throw new Error("Not authorized");
		}

		return ctx.db.insert("checkpoints", {
			name: args.name.trim(),
			latitude: args.latitude,
			longitude: args.longitude,
			radius: args.radius ?? 100,
			isDeleted: false,
		});
	},
});

export const update = mutation({
	args: {
		checkpointId: v.id("checkpoints"),
		name: v.optional(v.string()),
		latitude: v.optional(v.number()),
		longitude: v.optional(v.number()),
		radius: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
			throw new Error("Not authorized");
		}

		const checkpoint = await ctx.db.get(args.checkpointId);

		if (!checkpoint || checkpoint.isDeleted) {
			throw new Error("Geofence not found");
		}

		if (checkpoint.routeId) {
			throw new Error("Cannot modify a route checkpoint");
		}

		const patch: {
			name?: string;
			latitude?: number;
			longitude?: number;
			radius?: number;
		} = {};

		if (args.name !== undefined) {
			patch.name = args.name.trim();
		}

		if (args.latitude !== undefined) {
			patch.latitude = args.latitude;
		}

		if (args.longitude !== undefined) {
			patch.longitude = args.longitude;
		}

		if (args.radius !== undefined) {
			patch.radius = args.radius;
		}

		if (Object.keys(patch).length === 0) {
			return args.checkpointId;
		}

		await ctx.db.patch(args.checkpointId, patch);
		return args.checkpointId;
	},
});

export const remove = mutation({
	args: {
		checkpointId: v.id("checkpoints"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
			throw new Error("Not authorized");
		}

		const checkpoint = await ctx.db.get(args.checkpointId);

		if (!checkpoint || checkpoint.isDeleted) {
			throw new Error("Geofence not found");
		}

		if (checkpoint.routeId) {
			throw new Error("Cannot delete a route checkpoint");
		}

		await ctx.db.patch(args.checkpointId, {
			isDeleted: true,
		});

		return args.checkpointId;
	},
});
