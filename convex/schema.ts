import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	profiles: defineTable({
		authUserId: v.string(), // Better Auth user id

		email: v.optional(v.string()),
		phoneNumber: v.optional(v.string()),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),

		aadharNumber: v.optional(v.string()),
		panNumber: v.optional(v.string()),
		insurance: v.optional(v.string()),
		hasInsurance: v.optional(v.boolean()),

		role: v.union(
			v.literal("admin"),
			v.literal("manager"),
			v.literal("driver"),
			v.literal("new_user"),
		),

		status: v.union(
			v.literal("pending"),
			v.literal("approved"),
			v.literal("rejected"),
		),

		emergencyPhone: v.optional(v.string()),

		isDeleted: v.boolean(),
	}).index("by_auth_user", ["authUserId"])
		.index("by_status", ["status"])
		.index("by_status_and_role", ["status", "role"]),

	routes: defineTable({
		name: v.string(),
		description: v.optional(v.string()),

		isDeleted: v.boolean(),
	}).index("byName", ["name"]),

	checkpoints: defineTable({
		routeId: v.id("routes"),

		name: v.string(),

		latitude: v.number(),
		longitude: v.number(),

		sequence: v.number(),

		expectedTravelMinutes: v.number(),

		isDeleted: v.boolean(),
	}),

	routeAssignments: defineTable({
		routeId: v.id("routes"),

		driverId: v.id("profiles"),

		assignedBy: v.id("profiles"),

		active: v.boolean(),
	}).index("by_driverId", ["driverId"])
		.index("by_routeId", ["routeId"]),

	routeRuns: defineTable({
		routeId: v.id("routes"),

		driverId: v.id("profiles"),

		startedAt: v.number(),

		completedAt: v.optional(v.number()),

		status: v.union(
			v.literal("running"),
			v.literal("completed"),
			v.literal("delayed"),
			v.literal("cancelled"),
		),
	}).index("by_driverId", ["driverId"]),

	incidents: defineTable({
		routeRunId: v.id("routeRuns"),

		checkpointId: v.optional(v.id("checkpoints")),

		reason: v.union(
			v.literal("traffic"),
			v.literal("breakdown"),
			v.literal("accident"),
			v.literal("weather"),
			v.literal("other"),
		),

		description: v.optional(v.string()),

		photoUrls: v.array(v.string()),

		reportedAt: v.number(),
	}),

	driverLocations: defineTable({
		routeRunId: v.id("routeRuns"),

		latitude: v.number(),
		longitude: v.number(),

		speed: v.optional(v.number()),

		heading: v.optional(v.number()),

		timestamp: v.number(),
	}).index("by_routeRunId", ["routeRunId"]),

	checkpointVisits: defineTable({
		routeRunId: v.id("routeRuns"),

		checkpointId: v.id("checkpoints"),

		status: v.union(
			v.literal("pending"),
			v.literal("completed"),
			v.literal("skipped"),
		),

		reachedAt: v.optional(v.number()),

		createdAt: v.number(),
	}).index("by_routeRunId", ["routeRunId"])
		.index("by_checkpointId", ["checkpointId"]),

	alerts: defineTable({
		routeRunId: v.id("routeRuns"),

		checkpointId: v.id("checkpoints"),

		type: v.union(v.literal("delay"), v.literal("incident")),

		message: v.string(),

		sentToDriver: v.boolean(),

		sentToManager: v.boolean(),

		whatsappSent: v.boolean(),

		createdAt: v.number(),
	}).index("by_routeRunId_and_type", ["routeRunId", "type"]),

	whatsappGroups: defineTable({
		name: v.string(),

		groupId: v.string(), // WhatsApp mapping

		active: v.boolean(),
	}),

	routeWhatsappMappings: defineTable({
		routeId: v.id("routes"),

		whatsappGroupId: v.id("whatsappGroups"),
	}),

	otpCodes: defineTable({
		phoneNumber: v.string(),
		code: v.string(),
	}).index("by_phoneNumber", ["phoneNumber"]),
});
