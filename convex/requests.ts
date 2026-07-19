import { v } from "convex/values";
import { mutation } from "./_generated/server";
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
