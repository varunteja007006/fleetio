import { expo } from "@better-auth/expo";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { phoneNumber } from "better-auth/plugins";
import type { GenericActionCtx } from "convex/server";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent: ReturnType<typeof createClient<DataModel>> =
	createClient<DataModel>(components.betterAuth, {
		authFunctions: {
			onCreate: internal.auth.onCreate,
		},
		triggers: {
			user: {
				onCreate: async (ctx, user) => {
					console.log(user._id, "USER");
					const existingProfile = await ctx.db
						.query("profiles")
						.withIndex("by_auth_user", (q) => q.eq("authUserId", user._id))
						.first();

					if (existingProfile) {
						return;
					}

					await ctx.db.insert("profiles", {
						authUserId: user._id,
						phoneNumber: user.phoneNumber ?? undefined,
						email: user.email,
						role: "new_user",
						status: "pending",
						isDeleted: false,
					});
				},
			},
		},
	});

export const { onCreate } = authComponent.triggersApi();

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth({
		trustedOrigins: ["your-scheme://"],
		baseURL: {
			allowedHosts: ["exp://*.*.*.*:8081", "*.*.convex.site"],
		},
		database: authComponent.adapter(ctx),
		// Configure simple, non-verified email/password to get started
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		plugins: [
			// The Expo and Convex plugins are required
			expo(),
			convex({ authConfig }),
			phoneNumber({
				sendOTP: async ({ phoneNumber, code }, _request) => {
					const actionCtx = ctx as GenericActionCtx<DataModel>;
					await actionCtx.runMutation(internal.otp.storeOtp, {
						phoneNumber,
						code,
					});

					console.log(`SENT OTP: ${code} to ${phoneNumber}`);
				},
				signUpOnVerification: {
					getTempEmail: (phoneNumber) => {
						return `${phoneNumber}@${process.env.EMAIL_DOMAIN}`;
					},

					getTempName: (phoneNumber) => {
						return phoneNumber;
					},
				},
				callbackOnVerification: async () => {
					return;
				},
			}),
		],
	});
};

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return authComponent.getAuthUser(ctx);
	},
});
