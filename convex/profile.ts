import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
		id: v.id("profiles"),
	},
	handler: async (ctx, args) => {
		try {
			const user = await authComponent.getAuthUser(ctx);

			const callerProfile = await ctx.db
				.query("profiles")
				.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
				.first();

			if (!callerProfile) return null;

			const targetProfile = await ctx.db.get(args.id);
			if (!targetProfile) return null;

			// Allow if caller is admin or the target user themselves
			const isAdmin = callerProfile.role === "admin";
			const isSelf = callerProfile.authUserId === targetProfile.authUserId;

			if (!isAdmin && !isSelf) return null;

			return targetProfile;
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

export const updateProfile = mutation({
	args: {
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		aadharNumber: v.optional(v.string()),
		panNumber: v.optional(v.string()),
		emergencyPhone: v.optional(v.string()),
		insurance: v.optional(v.string()),
		hasInsurance: v.optional(v.boolean()),
		language: v.optional(v.string()),
		notificationsEnabled: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!profile) {
			throw new Error("Profile not found");
		}

		const fields: Record<string, unknown> = {};
		if (args.firstName !== undefined) fields.firstName = args.firstName;
		if (args.lastName !== undefined) fields.lastName = args.lastName;
		if (args.aadharNumber !== undefined) fields.aadharNumber = args.aadharNumber;
		if (args.panNumber !== undefined) fields.panNumber = args.panNumber;
		if (args.emergencyPhone !== undefined) fields.emergencyPhone = args.emergencyPhone;
		if (args.insurance !== undefined) fields.insurance = args.insurance;
		if (args.hasInsurance !== undefined) fields.hasInsurance = args.hasInsurance;
		if (args.language !== undefined) fields.language = args.language;
		if (args.notificationsEnabled !== undefined)
			fields.notificationsEnabled = args.notificationsEnabled;

		await ctx.db.patch(profile._id, fields);

		return profile._id;
	},
});

export const updateUserStatus = mutation({
	args: {
		profileId: v.id("profiles"),
		status: v.union(v.literal("approved"), v.literal("rejected")),
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

		const targetProfile = await ctx.db.get(args.profileId);

		if (!targetProfile) {
			throw new Error("Profile not found");
		}

		await ctx.db.patch(args.profileId, { status: args.status });

		return args.profileId;
	},
});

export const updateUserRole = mutation({
	args: {
		profileId: v.id("profiles"),
		role: v.union(
			v.literal("admin"),
			v.literal("manager"),
			v.literal("driver"),
			v.literal("new_user"),
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

		const targetProfile = await ctx.db.get(args.profileId);

		if (!targetProfile) {
			throw new Error("Profile not found");
		}

		await ctx.db.patch(args.profileId, { role: args.role });

		return args.profileId;
	},
});

export const getPendingProfiles = query({
	args: {},
	handler: async (ctx, _args) => {
		const user = await authComponent.getAuthUser(ctx);

		const callerProfile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!callerProfile || callerProfile.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const pendingProfiles = await ctx.db
			.query("profiles")
			.withIndex("by_status", (q) => q.eq("status", "pending"))
			.take(100);

		return pendingProfiles;
	},
});

export const getDrivers = query({
	args: {},
	handler: async (ctx, _args) => {
		const user = await authComponent.getAuthUser(ctx);

		const callerProfile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!callerProfile || callerProfile.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const profiles = await ctx.db
			.query("profiles")
			.withIndex("by_status_and_role", (q) =>
				q.eq("status", "approved").eq("role", "driver"),
			)
			.take(100);

		return profiles;
	},
});

export const getProfilePictureUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});

export const updateProfilePicture = mutation({
	args: {
		storageId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!profile) {
			throw new Error("Profile not found");
		}

		await ctx.db.patch(profile._id, { avatarStorageId: args.storageId });
		return profile._id;
	},
});

export const removeProfilePicture = mutation({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!profile) {
			throw new Error("Profile not found");
		}

		await ctx.db.patch(profile._id, { avatarStorageId: undefined });
		return profile._id;
	},
});

export const getStorageUrl = query({
	args: {
		storageId: v.string(),
	},
	handler: async (ctx, args) => {
		if (!args.storageId) return null;
		return await ctx.storage.getUrl(args.storageId);
	},
});

