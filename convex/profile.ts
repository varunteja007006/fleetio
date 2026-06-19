import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { authComponent } from "./auth";

export const getUserProfile = query({
	args: {},
	handler: async (ctx, _args) => {
		try {
			const x = await authComponent.getAuthUser(ctx);

			const userProfile = await ctx.db
				.query("profiles")
				.withIndex("by_auth_user", (q) => q.eq("authUserId", x._id))
				.order("desc")
				.first();
			return userProfile;
		} catch {
			return null;
		}
	},
});

export const getIsAdminProfile = query({
	args: {},
	handler: async (ctx, _args) => {
		try {
			const x = await authComponent.getAuthUser(ctx);

			const userProfile = await ctx.db
				.query("profiles")
				.withIndex("by_auth_user", (q) => q.eq("authUserId", x._id))
				.order("desc")
				.first();
			return userProfile?.role === "admin";
		} catch {
			return false;
		}
	},
});

export const getUserProfileById = query({
	args: {
		id: v.string(),
	},
	handler: async (ctx, args) => {
		try {
			const userProfile = await ctx.db
				.query("profiles")
				.withIndex("by_auth_user", (q) => q.eq("authUserId", args.id))
				.order("desc")
				.first();
			return userProfile;
		} catch {
			return null;
		}
	},
});

export const allProfiles = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		const profiles = await ctx.db
			.query("profiles")
			.order("desc")
			.paginate(args.paginationOpts);
		return profiles;
	},
});
