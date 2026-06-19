import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import z from "zod";

import { useAppForm } from "~/components/forms/hooks";

const createRouteSchema = z.object({
	name: z.string().min(1, "Route name is required"),
	description: z.string(),
});

export default function RouteAdminListScreen() {
	const router = useRouter();
	const routes = useQuery(api.routes.list, {});
	const createRoute = useMutation(api.routes.create);
	const deleteRoute = useMutation(api.routes.remove);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [deletingRouteId, setDeletingRouteId] = useState<Id<"routes"> | null>(
		null,
	);

	const form = useAppForm({
		defaultValues: {
			name: "",
			description: "",
		},
		validators: { onSubmit: createRouteSchema },
			onSubmit: async ({ value }) => {
			setIsSubmitting(true);
			try {
				const description = value.description.trim();

				await createRoute({
					name: value.name,
					description: description ? description : undefined,
				});

				form.reset();
			} catch (error) {
				Alert.alert(
					"Create route failed",
					error instanceof Error ? error.message : "Please try again.",
				);
			} finally {
				setIsSubmitting(false);
			}
		},
	});

	const handleDeleteRoute = (routeId: Id<"routes">, routeName: string) => {
		Alert.alert(
			"Delete route",
			`This will archive ${routeName}. You can keep historical data, but it won't show in active lists.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						setDeletingRouteId(routeId);
						try {
							await deleteRoute({ routeId });
						} catch (error) {
							Alert.alert(
								"Delete route failed",
								error instanceof Error ? error.message : "Please try again.",
							);
						} finally {
							setDeletingRouteId(null);
						}
					},
				},
			],
		);
	};

	return (
		<SafeAreaView className="bg-background flex-1">
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text className="text-foreground text-2xl font-bold">Routes</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Create, edit, and archive route table entries.
				</Text>

				<View className="bg-card border-border mt-5 rounded-xl border p-4">
					<Text className="text-foreground mb-4 text-lg font-semibold">
						Create route
					</Text>
					<View className="mb-3">
						<form.AppField name="name">
							{(field) => (
								<field.Input
									label="Route name"
									placeholder="Eg: North Campus Loop"
									autoCapitalize="words"
									editable={!isSubmitting}
								/>
							)}
						</form.AppField>
					</View>
					<form.AppField name="description">
						{(field) => (
							<field.Input
								label="Description"
								placeholder="Optional notes"
								autoCapitalize="sentences"
								editable={!isSubmitting}
							/>
						)}
					</form.AppField>

					<Pressable
						onPress={async () => form.handleSubmit()}
						disabled={isSubmitting}
						className={`bg-primary mt-4 rounded-lg py-3 ${
							isSubmitting ? "opacity-60" : "active:opacity-80"
						}`}
					>
						{isSubmitting ? (
							<ActivityIndicator color="#ffffff" />
						) : (
							<Text className="text-primary-foreground text-center font-semibold">
								Create route
							</Text>
						)}
					</Pressable>
				</View>

				<View className="mt-6 gap-3">
					<Text className="text-foreground text-lg font-semibold">
						Existing routes
					</Text>
					{routes === undefined ? (
						<ActivityIndicator />
					) : routes.length === 0 ? (
						<Text className="text-muted-foreground text-sm">
							No routes yet. Add your first route using the form above.
						</Text>
					) : (
						routes.map((route) => (
							<View
								key={route._id}
								className="bg-card border-border rounded-xl border p-4"
							>
								<Text className="text-foreground text-base font-semibold">
									{route.name}
								</Text>
								{route.description ? (
									<Text className="text-muted-foreground mt-1 text-sm">
										{route.description}
									</Text>
								) : null}

								<View className="mt-4 flex-row gap-3">
									<Pressable
										onPress={() => router.push(`/admin/route/${route._id}`)}
										className="bg-secondary rounded-lg px-4 py-2 active:opacity-80"
									>
										<Text className="text-secondary-foreground font-medium">
											Edit
										</Text>
									</Pressable>
									<Pressable
										onPress={() => handleDeleteRoute(route._id, route.name)}
										disabled={deletingRouteId === route._id}
										className={`rounded-lg px-4 py-2 ${
											deletingRouteId === route._id
												? "bg-destructive/70"
												: "bg-destructive active:opacity-80"
										}`}
									>
										<Text className="text-destructive-foreground font-medium">
											{deletingRouteId === route._id ? "Deleting..." : "Delete"}
										</Text>
									</Pressable>
								</View>
							</View>
						))
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
