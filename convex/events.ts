import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { authComponent } from "./auth";

const eventValidator = v.object({
	vehicleId: v.id("vehicles"),
	checkpointId: v.id("checkpoints"),
	type: v.union(
		v.literal("entered"),
		v.literal("exited"),
		v.literal("crossed"),
	),
	createdAt: v.number(),
});

const eventPageValidator = paginationResultValidator(eventValidator);

export const listByVehicle = query({
	args: {
		vehicleId: v.id("vehicles"),
		paginationOpts: paginationOptsValidator,
	},
	returns: eventPageValidator,
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return { page: [], isDone: true, continueCursor: "" };
		}
		return await ctx.db
			.query("events")
			.withIndex("by_vehicleId_and_createdAt", (q) =>
				q.eq("vehicleId", args.vehicleId),
			)
			.order("desc")
			.paginate(args.paginationOpts);
	},
});

export const listByCheckpoint = query({
	args: {
		checkpointId: v.id("checkpoints"),
		paginationOpts: paginationOptsValidator,
	},
	returns: eventPageValidator,
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return { page: [], isDone: true, continueCursor: "" };
		}
		return await ctx.db
			.query("events")
			.withIndex("by_checkpointId", (q) =>
				q.eq("checkpointId", args.checkpointId),
			)
			.order("desc")
			.paginate(args.paginationOpts);
	},
});

export const listRecent = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	returns: eventPageValidator,
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return { page: [], isDone: true, continueCursor: "" };
		}
		return await ctx.db
			.query("events")
			.order("desc")
			.paginate(args.paginationOpts);
	},
});
