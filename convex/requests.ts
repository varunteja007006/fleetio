import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import type { Id } from "./_generated/dataModel";

export const submitRequest = mutation({
	args: {
		type: v.union(
			v.literal("feedback"),
			v.literal("feature_request"),
			v.literal("bug"),
		),
		description: v.string(),
		imageStorageIds: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);

		await ctx.db.insert("requests", {
			authUserId: user._id,
			type: args.type,
			description: args.description,
			imageStorageIds: args.imageStorageIds,
			isDeleted: false,
			createdAt: Date.now(),
		});
	},
});

export const getUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});

export const listMyRequests = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);

		const result = await ctx.db
			.query("requests")
			.withIndex("by_auth_user_and_isDeleted", (q) =>
				q.eq("authUserId", user._id).eq("isDeleted", false),
			)
			.order("desc")
			.paginate(args.paginationOpts);

		return {
			...result,
			page: await Promise.all(
				result.page.map(async (r) => ({
					...r,
					imageUrls: await Promise.all(
						r.imageStorageIds.map((id) => ctx.storage.getUrl(id)),
					),
				})),
			),
		};
	},
});

export const softDeleteRequest = mutation({
	args: {
		requestId: v.id("requests"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);

		const request = await ctx.db.get(args.requestId);
		if (!request) throw new Error("Request not found");
		if (request.authUserId !== user._id) throw new Error("Unauthorized");

		await ctx.db.patch(args.requestId, { isDeleted: true });
	},
});

export const listAllRequests = query({
	args: {
		paginationOpts: paginationOptsValidator,
		typeFilter: v.optional(
			v.union(
				v.literal("feedback"),
				v.literal("feature_request"),
				v.literal("bug"),
			),
		),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);

		const callerProfile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!callerProfile || callerProfile.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const typeFilter = args.typeFilter;

		const result = typeFilter
			? await ctx.db
					.query("requests")
					.withIndex("by_type", (q) => q.eq("type", typeFilter))
					.order("desc")
					.paginate(args.paginationOpts)
			: await ctx.db
					.query("requests")
					.order("desc")
					.paginate(args.paginationOpts);

		return {
			...result,
			page: await Promise.all(
				result.page.map(async (r) => {
					const profile = await ctx.db
						.query("profiles")
						.withIndex("by_auth_user", (q) =>
							q.eq("authUserId", r.authUserId),
						)
						.first();

					return {
						...r,
						user: profile
							? {
									firstName: profile.firstName ?? null,
									lastName: profile.lastName ?? null,
									phoneNumber: profile.phoneNumber ?? null,
									email: profile.email ?? null,
								}
							: null,
						imageUrls: await Promise.all(
							r.imageStorageIds.map((id) => ctx.storage.getUrl(id)),
						),
					};
				}),
			),
		};
	},
});

export const adminDeleteImageFromRequest = mutation({
	args: {
		requestId: v.id("requests"),
		storageId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);

		const callerProfile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!callerProfile || callerProfile.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const request = await ctx.db.get(args.requestId);
		if (!request) throw new Error("Request not found");

		await ctx.storage.delete(args.storageId as Id<"_storage">);

		const updatedIds = request.imageStorageIds.filter(
			(id) => id !== args.storageId,
		);

		await ctx.db.patch(args.requestId, { imageStorageIds: updatedIds });
	},
});

export const adminHardDeleteRequest = mutation({
	args: {
		requestId: v.id("requests"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);

		const callerProfile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!callerProfile || callerProfile.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const request = await ctx.db.get(args.requestId);
		if (!request) throw new Error("Request not found");

		for (const storageId of request.imageStorageIds) {
			await ctx.storage.delete(storageId as Id<"_storage">);
		}

		await ctx.db.delete(args.requestId);
	},
});

export const getRequestsReport = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);

		const callerProfile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!callerProfile || callerProfile.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const all = await ctx.db.query("requests").order("desc").take(5000);

		let feedbackCount = 0;
		let featureRequestCount = 0;
		let bugCount = 0;

		for (const r of all) {
			if (r.type === "feedback") feedbackCount++;
			else if (r.type === "feature_request") featureRequestCount++;
			else if (r.type === "bug") bugCount++;
		}

		return {
			total: all.length,
			feedback: feedbackCount,
			featureRequest: featureRequestCount,
			bug: bugCount,
		};
	},
});
