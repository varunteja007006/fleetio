import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

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
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);

		const callerProfile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!callerProfile || callerProfile.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const result = await ctx.db
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
