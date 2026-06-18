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
				sendOTP: ({ phoneNumber, code }, ctx) => {
					// Implement sending OTP code via SMS
					// if (process.env.NODE_ENV === "production") {
					// 	twilioClient.messages
					// 		.create({
					// 			body: `Your OTP is ${code}`,
					// 			from: twilioFromPhoneNumber,
					// 			to: phoneNumber,
					// 		})
					// 		.then((res) => {
					// 			console.log("\n-----------OTP Triggered-------------", res);
					// 		})
					// 		.catch((err) => {
					// 			console.error(
					// 				"\nFAILED TO SEND OTP" + " " + "sendOTP function",
					// 				err,
					// 			);
					// 		});
					// 	return;
					// }

					console.log(`\n=======OTP:${code} - ${phoneNumber} =========\n`);
				},
				signUpOnVerification: {
					getTempEmail: (phoneNumber) => {
						return `${phoneNumber}@${process.env.EXPO_PUBLIC_EMAIL_DOMAIN}`;
					},

					//optionally, you can also pass `getTempName` function to generate a temporary name for the user
					getTempName: (phoneNumber) => {
						return phoneNumber; //by default, it will use the phone number as the name
					},
				},
			}),
		],
	});
};
// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return authComponent.getAuthUser(ctx);
	},
});
