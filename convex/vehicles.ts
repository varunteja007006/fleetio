import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const list = query({
	args: {},
	handler: async (ctx, _args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return [];
		}

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!profile) {
			return [];
		}

		return await ctx.db.query("vehicles").order("desc").take(100);
	},
});

export const listWithCurrentLocations = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return [];
		}

		const vehicles = await ctx.db.query("vehicles").order("desc").take(100);

		const locations = await ctx.db.query("currentLocations").take(1000);

		const locationByVehicle = new Map(
			locations.map((location) => [location.vehicleId, location]),
		);

		return vehicles.map((vehicle) => ({
			vehicle,
			location: locationByVehicle.get(vehicle._id) ?? null,
		}));
	},
});

export const get = query({
	args: {
		vehicleId: v.id("vehicles"),
	},
	handler: async (ctx, args) => {
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

		return await ctx.db.get(args.vehicleId);
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		registrationNumber: v.string(),
		make: v.optional(v.string()),
		model: v.optional(v.string()),
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

		return await ctx.db.insert("vehicles", {
			name: args.name.trim(),
			registrationNumber: args.registrationNumber.trim(),
			make: args.make,
			model: args.model,
			isActive: true,
		});
	},
});

export const update = mutation({
	args: {
		vehicleId: v.id("vehicles"),
		name: v.optional(v.string()),
		registrationNumber: v.optional(v.string()),
		make: v.optional(v.string()),
		model: v.optional(v.string()),
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

		const vehicle = await ctx.db.get(args.vehicleId);
		if (!vehicle) {
			throw new Error("Vehicle not found");
		}

		const patch: { name?: string; registrationNumber?: string; make?: string; model?: string } = {};

		if (args.name !== undefined) {
			patch.name = args.name.trim();
		}

		if (args.registrationNumber !== undefined) {
			patch.registrationNumber = args.registrationNumber.trim();
		}

		if (args.make !== undefined) {
			patch.make = args.make;
		}

		if (args.model !== undefined) {
			patch.model = args.model;
		}

		if (Object.keys(patch).length === 0) {
			return args.vehicleId;
		}

		await ctx.db.patch(args.vehicleId, patch);
		return args.vehicleId;
	},
});

export const deactivate = mutation({
	args: {
		vehicleId: v.id("vehicles"),
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

		const vehicle = await ctx.db.get(args.vehicleId);
		if (!vehicle) {
			throw new Error("Vehicle not found");
		}

		await ctx.db.patch(args.vehicleId, { isActive: false });
		return args.vehicleId;
	},
});
