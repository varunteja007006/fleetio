import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

const provider = v.union(
	v.literal("wheelseye"),
	v.literal("loconav"),
	v.literal("jiothings"),
	v.literal("onelap"),
);

const status = v.union(v.literal("active"), v.literal("error"), v.literal("disabled"));

export const getForVehicle = query({
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

		const integration = await ctx.db
			.query("vehicleIntegrations")
			.withIndex("by_vehicleId", (q) => q.eq("vehicleId", args.vehicleId))
			.first();

		if (!integration) {
			return null;
		}

		const { accessToken, refreshToken, ...rest } = integration;

		return {
			...rest,
			hasToken: Boolean(accessToken),
			tokenMasked: accessToken ? `wh-****${accessToken.slice(-4)}` : "",
		};
	},
});

export const setForVehicle = mutation({
	args: {
		vehicleId: v.id("vehicles"),
		provider,
		accessToken: v.string(),
		refreshToken: v.optional(v.string()),
		expiresAt: v.optional(v.number()),
		externalVehicleId: v.optional(v.string()),
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

		const existing = await ctx.db
			.query("vehicleIntegrations")
			.withIndex("by_vehicleId", (q) => q.eq("vehicleId", args.vehicleId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				provider: args.provider,
				accessToken: args.accessToken,
				refreshToken: args.refreshToken,
				expiresAt: args.expiresAt,
				externalVehicleId: args.externalVehicleId,
				status: "active",
			});

			return existing._id;
		}

		return await ctx.db.insert("vehicleIntegrations", {
			vehicleId: args.vehicleId,
			provider: args.provider,
			accessToken: args.accessToken,
			refreshToken: args.refreshToken,
			expiresAt: args.expiresAt,
			externalVehicleId: args.externalVehicleId,
			lastSyncAt: 0,
			status: "active",
		});
	},
});

export const updateStatus = mutation({
	args: {
		integrationId: v.id("vehicleIntegrations"),
		status,
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

		const integration = await ctx.db.get(args.integrationId);
		if (!integration) {
			throw new Error("Integration not found");
		}

		await ctx.db.patch(args.integrationId, { status: args.status });

		return args.integrationId;
	},
});

export const remove = mutation({
	args: {
		integrationId: v.id("vehicleIntegrations"),
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

		const integration = await ctx.db.get(args.integrationId);
		if (!integration) {
			throw new Error("Integration not found");
		}

		await ctx.db.delete(args.integrationId);

		return args.integrationId;
	},
});
