import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

function normalizeName(name: string) {
	const normalizedName = name.trim();

	if (!normalizedName) {
		throw new Error("Route name is required.");
	}

	return normalizedName;
}

function normalizeDescription(description?: string) {
	if (description === undefined) {
		return undefined;
	}

	const normalizedDescription = description.trim();
	return normalizedDescription || undefined;
}

function normalizeMinutes(minutes?: number) {
	if (minutes === undefined || isNaN(minutes) || minutes < 0) {
		return undefined;
	}

	return minutes;
}

export const list = query({
	args: {
		includeDeleted: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		if (args.includeDeleted) {
			return await ctx.db
				.query("routes")
				.withIndex("byName")
				.take(10000);
		}

		return await ctx.db
			.query("routes")
			.withIndex("by_isDeleted", (q) => q.eq("isDeleted", false))
			.order("desc")
			.take(10000);
	},
});

export const getById = query({
	args: {
		routeId: v.id("routes"),
	},
	handler: async (ctx, args) => {
		return ctx.db.get(args.routeId);
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		estimatedMinutes: v.optional(v.number()),
		graceMinutes: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const name = normalizeName(args.name);
		const description = normalizeDescription(args.description);
		const estimatedMinutes = normalizeMinutes(args.estimatedMinutes);
		const graceMinutes = normalizeMinutes(args.graceMinutes);

		const patch: {
			name: string;
			description?: string;
			estimatedMinutes?: number;
			graceMinutes?: number;
			isDeleted: boolean;
		} = {
			name,
			description,
			estimatedMinutes,
			graceMinutes,
			isDeleted: false,
		};

		return ctx.db.insert("routes", patch);
	},
});

export const update = mutation({
	args: {
		routeId: v.id("routes"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		estimatedMinutes: v.optional(v.number()),
		graceMinutes: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const route = await ctx.db.get(args.routeId);

		if (!route || route.isDeleted) {
			throw new Error("Route not found.");
		}

		const patch: {
			name?: string;
			description?: string;
			estimatedMinutes?: number;
			graceMinutes?: number;
		} = {};

		if (args.name !== undefined) {
			patch.name = normalizeName(args.name);
		}

		if (args.description !== undefined) {
			patch.description = normalizeDescription(args.description);
		}

		if (args.estimatedMinutes !== undefined) {
			patch.estimatedMinutes = normalizeMinutes(args.estimatedMinutes);
		}

		if (args.graceMinutes !== undefined) {
			patch.graceMinutes = normalizeMinutes(args.graceMinutes);
		}

		if (Object.keys(patch).length === 0) {
			return args.routeId;
		}

		await ctx.db.patch(args.routeId, patch);
		return args.routeId;
	},
});

export const remove = mutation({
	args: {
		routeId: v.id("routes"),
	},
	handler: async (ctx, args) => {
		const route = await ctx.db.get(args.routeId);

		if (!route || route.isDeleted) {
			throw new Error("Route not found.");
		}

		await ctx.db.patch(args.routeId, {
			isDeleted: true,
		});

		return args.routeId;
	},
});

export const routesStats = query({
	args: {},
	handler: async (ctx, _args) => {
		const activeRoutes = await ctx.db
			.query("routes")
			.withIndex("by_isDeleted", (q) => q.eq("isDeleted", false))
			.take(10000);
		return { totalRoutes: activeRoutes.length };
	},
});
