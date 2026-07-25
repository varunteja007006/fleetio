import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { authComponent } from "./auth";

export const submitContactMessage = mutation({
	args: {
		subject: v.string(),
		message: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		await ctx.db.insert("supportMessages", {
			authUserId: user._id,
			subject: args.subject,
			message: args.message,
			createdAt: Date.now(),
		});
	},
});
