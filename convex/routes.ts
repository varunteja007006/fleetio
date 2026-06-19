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

export const list = query({
	args: {
		includeDeleted: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const routes = await ctx.db.query("routes").withIndex("byName").collect();

		if (args.includeDeleted) {
			return routes;
		}

		return routes.filter((route) => !route.isDeleted);
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
	},
	handler: async (ctx, args) => {
		const name = normalizeName(args.name);
		const description = normalizeDescription(args.description);

		return ctx.db.insert("routes", {
			name,
			description,
			isDeleted: false,
		});
	},
});

export const update = mutation({
	args: {
		routeId: v.id("routes"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const route = await ctx.db.get(args.routeId);

		if (!route || route.isDeleted) {
			throw new Error("Route not found.");
		}

		const patch: { name?: string; description?: string } = {};

		if (args.name !== undefined) {
			patch.name = normalizeName(args.name);
		}

		if (args.description !== undefined) {
			patch.description = normalizeDescription(args.description);
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
