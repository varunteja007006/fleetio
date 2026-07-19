import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent } from "./auth";

const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";

export const registerPushToken = mutation({
	args: {
		token: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error("Not authenticated");

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
			.first();

		if (!profile) throw new Error("Profile not found");

		await ctx.db.patch(profile._id, { pushToken: args.token });
	},
});

export const sendPushForAlert = internalAction({
	args: {
		alertId: v.id("alerts"),
		routeRunId: v.id("routeRuns"),
	},
	handler: async (ctx, args) => {
		const alert = await ctx.runQuery(internal.pushNotifications.getAlertById, {
			alertId: args.alertId,
		});
		if (!alert) return;

		const routeRun = await ctx.runQuery(
			internal.pushNotifications.getRouteRunById,
			{ routeRunId: args.routeRunId },
		);
		if (!routeRun) return;

		const driverProfile = await ctx.runQuery(
			internal.pushNotifications.getProfileById,
			{ profileId: routeRun.driverId },
		);

		const route = await ctx.runQuery(internal.pushNotifications.getRouteById, {
			routeId: routeRun.routeId,
		});
		const routeName = route?.name ?? "Unknown route";

		const pushTokens: string[] = [];

		if (driverProfile?.pushToken) {
			pushTokens.push(driverProfile.pushToken);
		}

		const managers = await ctx.runQuery(
			internal.pushNotifications.getManagerProfiles,
			{},
		);
		for (const m of managers) {
			if (m.pushToken) {
				pushTokens.push(m.pushToken);
			}
		}

		if (pushTokens.length === 0) return;

		const driverName =
			driverProfile?.firstName
				? `${driverProfile.firstName} ${driverProfile.lastName ?? ""}`
				: "A driver";

		await fetch(EXPO_PUSH_API, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				to: pushTokens,
				title: `Delay Alert: ${routeName}`,
				body: alert.message,
				data: {
					type: "delay",
					routeRunId: args.routeRunId,
					alertId: args.alertId,
					routeName,
				},
			}),
		});

		await ctx.runMutation(internal.pushNotifications.markAlertSent, {
			alertId: args.alertId,
			hasDriverToken: Boolean(driverProfile?.pushToken),
			hasManagerTokens: managers.some((m) => m.pushToken),
		});
	},
});

export const getAlertById = internalQuery({
	args: { alertId: v.id("alerts") },
	handler: async (ctx, args) => {
		return ctx.db.get(args.alertId);
	},
});

export const getRouteRunById = internalQuery({
	args: { routeRunId: v.id("routeRuns") },
	handler: async (ctx, args) => {
		return ctx.db.get(args.routeRunId);
	},
});

export const getProfileById = internalQuery({
	args: { profileId: v.id("profiles") },
	handler: async (ctx, args) => {
		return ctx.db.get(args.profileId);
	},
});

export const getRouteById = internalQuery({
	args: { routeId: v.id("routes") },
	handler: async (ctx, args) => {
		return ctx.db.get(args.routeId);
	},
});

export const getManagerProfiles = internalQuery({
	args: {},
	handler: async (ctx) => {
		const profiles = await ctx.db.query("profiles").take(1000);
		return profiles.filter(
			(p) => (p.role === "admin" || p.role === "manager") && !p.isDeleted,
		);
	},
});

export const markAlertSent = internalMutation({
	args: {
		alertId: v.id("alerts"),
		hasDriverToken: v.boolean(),
		hasManagerTokens: v.boolean(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.alertId, {
			sentToDriver: args.hasDriverToken,
			sentToManager: args.hasManagerTokens,
		});
	},
});
