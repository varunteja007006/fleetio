import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const crons = cronJobs();

crons.interval("check for delays", { minutes: 5 }, internal.crons.checkForDelays, {});

export default crons;

export const checkForDelays = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const gracePeriodMs = 15 * 60 * 1000;

		const allRuns = await ctx.db.query("routeRuns").take(1000);
		const activeRuns = allRuns.filter((r) => r.status === "running");

		for (const run of activeRuns) {
			const visits = await ctx.db
				.query("checkpointVisits")
				.withIndex("by_routeRunId", (q) => q.eq("routeRunId", run._id))
				.take(1000);

			const pendingVisits = visits.filter((v) => v.status === "pending");
			if (pendingVisits.length === 0) continue;

			const allCheckpoints = await ctx.db.query("checkpoints").take(10000);
			const routeCheckpoints = allCheckpoints
				.filter((cp) => cp.routeId === run.routeId && !cp.isDeleted)
				.sort((a, b) => a.sequence - b.sequence);

			let cumulativeMinutes = 0;
			const expectedMinutesByCheckpoint: Record<string, number> = {};
			for (const cp of routeCheckpoints) {
				cumulativeMinutes += cp.expectedTravelMinutes;
				expectedMinutesByCheckpoint[cp._id] = cumulativeMinutes;
			}

			for (const visit of pendingVisits) {
				const cumMinutes = expectedMinutesByCheckpoint[visit.checkpointId];
				if (cumMinutes === undefined) continue;

				const expectedArrivalMs = run.startedAt + cumMinutes * 60 * 1000;
				const deadlineMs = expectedArrivalMs + gracePeriodMs;

				if (now <= deadlineMs) continue;

				const existingAlerts = await ctx.db
					.query("alerts")
					.withIndex("by_routeRunId_and_type", (q) =>
						q.eq("routeRunId", run._id).eq("type", "delay"),
					)
					.take(1000);

				const alreadyAlerted = existingAlerts.some(
					(a) => a.checkpointId === visit.checkpointId,
				);
				if (alreadyAlerted) continue;

				const checkpoint = await ctx.db.get(visit.checkpointId);
				const checkpointName = checkpoint?.name ?? "Unknown";

				const delayMs = now - deadlineMs;
				const delayMinutes = Math.ceil(delayMs / 60000);

				await ctx.db.insert("alerts", {
					routeRunId: run._id,
					checkpointId: visit.checkpointId,
					type: "delay",
					message: `Driver is ${delayMinutes} min delayed at "${checkpointName}"`,
					sentToDriver: false,
					sentToManager: false,
					whatsappSent: false,
					createdAt: now,
				});
			}
		}
	},
});
