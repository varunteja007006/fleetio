import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

const updateRouteSchema = z.object({
	name: z.string().min(1, "Route name is required"),
	description: z.string(),
});

export default function RouteAdminDetailScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ route_id?: string | string[] }>();
	const routeIdParam = Array.isArray(params.route_id)
		? params.route_id[0]
		: params.route_id;
	const routeId = routeIdParam as Id<"routes"> | undefined;

	const route = useQuery(
		api.routes.getById,
		routeId ? { routeId } : "skip",
	);
	const updateRoute = useMutation(api.routes.update);
	const deleteRoute = useMutation(api.routes.remove);

	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const form = useAppForm({
		defaultValues: {
			name: "",
			description: "",
		},
		validators: { onSubmit: updateRouteSchema },
		onSubmit: async ({ value }) => {
			if (!routeId) {
				return;
			}

			setIsSaving(true);
			try {
				const description = value.description.trim();

				await updateRoute({
					routeId,
					name: value.name,
					description: description ? description : undefined,
				});

				Alert.alert("Route updated", "Route details were saved.");
			} catch (error) {
				Alert.alert(
					"Update failed",
					error instanceof Error ? error.message : "Please try again.",
				);
			} finally {
				setIsSaving(false);
			}
		},
	});

	useEffect(() => {
		if (!route) {
			return;
		}

		form.setFieldValue("name", route.name);
		form.setFieldValue("description", route.description ?? "");
	}, [form, route]);

	const handleDelete = () => {
		if (!routeId || !route) {
			return;
		}

		Alert.alert("Delete route", `Archive ${route.name}?`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					setIsDeleting(true);
					try {
						await deleteRoute({ routeId });
						router.back();
					} catch (error) {
						Alert.alert(
							"Delete failed",
							error instanceof Error ? error.message : "Please try again.",
						);
					} finally {
						setIsDeleting(false);
					}
				},
			},
		]);
	};

	if (!routeId) {
		return (
			<SafeAreaView className="bg-background flex-1 items-center justify-center px-6">
				<Text className="text-foreground text-center text-base">
					Invalid route id.
				</Text>
			</SafeAreaView>
		);
	}

	if (route === undefined) {
		return (
			<SafeAreaView className="bg-background flex-1 items-center justify-center">
				<ActivityIndicator />
			</SafeAreaView>
		);
	}

	if (!route || route.isDeleted) {
		return (
			<SafeAreaView className="bg-background flex-1 items-center justify-center px-6">
				<Text className="text-foreground text-center text-base">
					Route not found.
				</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="bg-background flex-1">
			<Stack.Screen options={{ title: "Edit Route" }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text className="text-foreground text-2xl font-bold">Edit route</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Update route table values and save changes.
				</Text>

				<View className="bg-card border-border mt-5 rounded-xl border p-4">
					<View className="mb-3">
						<form.AppField name="name">
							{(field) => (
								<field.Input
									label="Route name"
									placeholder="Eg: North Campus Loop"
									autoCapitalize="words"
									editable={!isSaving && !isDeleting}
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
								editable={!isSaving && !isDeleting}
							/>
						)}
					</form.AppField>

					<Pressable
						onPress={async () => form.handleSubmit()}
						disabled={isSaving || isDeleting}
						className={`bg-primary mt-4 rounded-lg py-3 ${
							isSaving || isDeleting ? "opacity-60" : "active:opacity-80"
						}`}
					>
						{isSaving ? (
							<ActivityIndicator color="#ffffff" />
						) : (
							<Text className="text-primary-foreground text-center font-semibold">
								Save changes
							</Text>
						)}
					</Pressable>

					<Pressable
						onPress={handleDelete}
						disabled={isSaving || isDeleting}
						className={`bg-destructive mt-3 rounded-lg py-3 ${
							isSaving || isDeleting ? "opacity-60" : "active:opacity-80"
						}`}
					>
						{isDeleting ? (
							<ActivityIndicator color="#ffffff" />
						) : (
							<Text className="text-destructive-foreground text-center font-semibold">
								Delete route
							</Text>
						)}
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
