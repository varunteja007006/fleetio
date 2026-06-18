import { expo } from "@better-auth/expo";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { phoneNumber } from "better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

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
				sendOTP: async ({ phoneNumber, code }, ctx) => {
					// Implement sending OTP code via SMS
					if (process.env.NODE_ENV === "production") {
						const accessToken = "";

						if (!accessToken) {
							throw new Error(
								"Missing SMS API configuration in Convex environment variables.",
							);
						}

						// Clean phone number (Meta requires digits only, no '+' or spaces)
						const cleanedPhone = phoneNumber.replace(/\D/g, "");

						const url = `https://www.fast2sms.com/dev/bulkV2`;

						try {
							const response = await fetch(url, {
								method: "POST",
								headers: {
									Authorization: `${accessToken}`,
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									route: "q",
									message: `Your OTP code is: ${code}`,
									schedule_time: null,
									numbers: cleanedPhone,
								}),
							});

							const data = await response.json();

							if (!response.ok) {
								console.error("Error sending SMS _1: ", data);
								throw new Error(data.error?.message || "Error sending SMS _2");
							}
						} catch (error) {
							console.error("Error sending SMS _3:", error);
						}
					}

					console.log(`SENT OTP: ${code} to ${phoneNumber}`);
				},
				signUpOnVerification: {
					getTempEmail: (phoneNumber) => {
						return `${phoneNumber}@${process.env.EXPO_PUBLIC_EMAIL_DOMAIN}`;
					},

					getTempName: (phoneNumber) => {
						return phoneNumber;
					},
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
