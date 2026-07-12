import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const listByRoute = query({
	args: {
		routeId: v.id("routes"),
	},
	handler: async (ctx, args) => {
		const checkpoints = await ctx.db.query("checkpoints").take(10000);

		return checkpoints
			.filter((cp) => cp.routeId === args.routeId && !cp.isDeleted)
			.sort((a, b) => a.sequence - b.sequence);
	},
});

export const getById = query({
	args: {
		checkpointId: v.id("checkpoints"),
	},
	handler: async (ctx, args) => {
		return ctx.db.get(args.checkpointId);
	},
});

export const create = mutation({
	args: {
		routeId: v.id("routes"),
		name: v.string(),
		latitude: v.number(),
		longitude: v.number(),
		expectedTravelMinutes: v.number(),
	},
	handler: async (ctx, args) => {
		const route = await ctx.db.get(args.routeId);

		if (!route || route.isDeleted) {
			throw new Error("Route not found.");
		}

		const allCheckpoints = await ctx.db.query("checkpoints").take(10000);

		const routeCheckpoints = allCheckpoints.filter(
			(cp) => cp.routeId === args.routeId && !cp.isDeleted,
		);

		const maxSequence = routeCheckpoints.reduce(
			(max, cp) => Math.max(max, cp.sequence),
			-1,
		);

		const sequence = maxSequence + 1;

		return ctx.db.insert("checkpoints", {
			routeId: args.routeId,
			name: args.name.trim(),
			latitude: args.latitude,
			longitude: args.longitude,
			sequence,
			expectedTravelMinutes: args.expectedTravelMinutes,
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
		expectedTravelMinutes: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const checkpoint = await ctx.db.get(args.checkpointId);

		if (!checkpoint || checkpoint.isDeleted) {
			throw new Error("Checkpoint not found.");
		}

		const patch: {
			name?: string;
			latitude?: number;
			longitude?: number;
			expectedTravelMinutes?: number;
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

		if (args.expectedTravelMinutes !== undefined) {
			patch.expectedTravelMinutes = args.expectedTravelMinutes;
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
		const checkpoint = await ctx.db.get(args.checkpointId);

		if (!checkpoint || checkpoint.isDeleted) {
			throw new Error("Checkpoint not found.");
		}

		await ctx.db.patch(args.checkpointId, {
			isDeleted: true,
		});

		return args.checkpointId;
	},
});

export const reorder = mutation({
	args: {
		checkpointId: v.id("checkpoints"),
		newSequence: v.number(),
	},
	handler: async (ctx, args) => {
		const checkpoint = await ctx.db.get(args.checkpointId);

		if (!checkpoint || checkpoint.isDeleted) {
			throw new Error("Checkpoint not found.");
		}

		const allCheckpoints = await ctx.db.query("checkpoints").take(10000);

		const routeCheckpoints = allCheckpoints
			.filter(
				(cp) =>
					cp.routeId === checkpoint.routeId && !cp.isDeleted && cp._id !== args.checkpointId,
			)
			.sort((a, b) => a.sequence - b.sequence);

		const clampedSequence = Math.max(
			0,
			Math.min(args.newSequence, routeCheckpoints.length),
		);

		routeCheckpoints.splice(clampedSequence, 0, checkpoint);

		await Promise.all(
			routeCheckpoints.map((cp, index) =>
				ctx.db.patch(cp._id, { sequence: index }),
			),
		);

		return args.checkpointId;
	},
});
