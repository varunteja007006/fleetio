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

		pushToken: v.optional(v.string()),

		language: v.optional(v.string()),

		notificationsEnabled: v.optional(v.boolean()),

		avatarStorageId: v.optional(v.string()),

		isDeleted: v.boolean(),
	}).index("by_auth_user", ["authUserId"])
		.index("by_status", ["status"])
		.index("by_status_and_role", ["status", "role"])
		.index("by_isDeleted", ["isDeleted"])
		.index("by_status_and_isDeleted", ["status", "isDeleted"]),

	vehicles: defineTable({
		name: v.string(),

		registrationNumber: v.string(),

		make: v.optional(v.string()),

		model: v.optional(v.string()),

		isActive: v.boolean(),
	}).index("by_isActive", ["isActive"]),

	vehicleIntegrations: defineTable({
		vehicleId: v.id("vehicles"),

		provider: v.union(
			v.literal("wheelseye"),
			v.literal("loconav"),
			v.literal("jiothings"),
			v.literal("onelap"),
		),

		accessToken: v.string(),

		refreshToken: v.optional(v.string()),

		expiresAt: v.optional(v.number()),

		externalVehicleId: v.optional(v.string()),

		lastSyncAt: v.number(),

		status: v.union(
			v.literal("active"),
			v.literal("error"),
			v.literal("disabled"),
		),
	}).index("by_vehicleId", ["vehicleId"])
		.index("by_provider", ["provider"])
		.index("by_status", ["status"]),

	currentLocations: defineTable({
		vehicleId: v.id("vehicles"),

		latitude: v.number(),
		longitude: v.number(),

		speed: v.number(),

		heading: v.number(),

		timestamp: v.number(),

		previousLatitude: v.number(),

		previousLongitude: v.number(),
	}).index("by_vehicleId", ["vehicleId"]),

	routes: defineTable({
		name: v.string(),
		description: v.optional(v.string()),

		estimatedMinutes: v.optional(v.number()),
		graceMinutes: v.optional(v.number()),

		isDeleted: v.boolean(),
	}).index("byName", ["name"])
		.index("by_isDeleted", ["isDeleted"]),

	checkpoints: defineTable({
		routeId: v.optional(v.id("routes")),

		name: v.string(),

		latitude: v.number(),
		longitude: v.number(),

		radius: v.optional(v.number()),

		sequence: v.optional(v.number()),

		expectedTravelMinutes: v.optional(v.number()),

		isDeleted: v.boolean(),
	}).index("by_routeId_and_isDeleted", ["routeId", "isDeleted"]),

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
			v.literal("auto_closed"),
		),

		estimatedDeadlineAt: v.optional(v.number()),
	}).index("by_driverId", ["driverId"])
		.index("by_status", ["status"]),

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
		routeRunId: v.optional(v.id("routeRuns")),

		vehicleId: v.optional(v.id("vehicles")),

		latitude: v.number(),
		longitude: v.number(),

		speed: v.optional(v.number()),

		heading: v.optional(v.number()),

		timestamp: v.number(),

		rawProviderResponse: v.optional(v.string()),
	}).index("by_routeRunId", ["routeRunId"])
		.index("by_vehicleId", ["vehicleId"])
		.index("by_vehicleId_and_timestamp", ["vehicleId", "timestamp"]),

	checkpointState: defineTable({
		vehicleId: v.id("vehicles"),

		checkpointId: v.id("checkpoints"),

		inside: v.boolean(),

		enteredAt: v.optional(v.number()),

		exitedAt: v.optional(v.number()),
	}).index("by_vehicleId_and_checkpointId", ["vehicleId", "checkpointId"]),

	events: defineTable({
		vehicleId: v.id("vehicles"),

		checkpointId: v.id("checkpoints"),

		type: v.union(
			v.literal("entered"),
			v.literal("exited"),
			v.literal("crossed"),
		),

		createdAt: v.number(),
	}).index("by_vehicleId_and_createdAt", ["vehicleId", "createdAt"])
		.index("by_checkpointId", ["checkpointId"]),

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

	requests: defineTable({
		authUserId: v.string(),
		type: v.union(
			v.literal("feedback"),
			v.literal("feature_request"),
			v.literal("bug"),
		),
		description: v.string(),
		imageStorageIds: v.array(v.string()),
		isDeleted: v.boolean(),
		createdAt: v.number(),
	}).index("by_auth_user", ["authUserId"])
		.index("by_auth_user_and_isDeleted", ["authUserId", "isDeleted"])
		.index("by_type", ["type"])
		.index("by_isDeleted", ["isDeleted"]),

	supportMessages: defineTable({
		authUserId: v.string(),
		subject: v.string(),
		message: v.string(),
		createdAt: v.number(),
	}).index("by_auth_user", ["authUserId"]),

	otpCodes: defineTable({
		phoneNumber: v.string(),
		code: v.string(),
	}).index("by_phoneNumber", ["phoneNumber"]),
});
