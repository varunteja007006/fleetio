import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const getOtpByPhone = query({
	args: { phoneNumber: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("otpCodes")
			.withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
			.first();
	},
});

export const storeOtp = internalMutation({
	args: {
		phoneNumber: v.string(),
		code: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("otpCodes")
			.withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
			.first();
		if (existing) {
			await ctx.db.delete(existing._id);
		}
		await ctx.db.insert("otpCodes", {
			phoneNumber: args.phoneNumber,
			code: args.code,
		});
	},
});
