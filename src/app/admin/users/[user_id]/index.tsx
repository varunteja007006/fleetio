import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
	approved: { bg: "bg-green-500/10", text: "text-green-600" },
	pending: { bg: "bg-amber-500/10", text: "text-amber-600" },
	rejected: { bg: "bg-red-500/10", text: "text-red-600" },
};

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
	admin: { bg: "bg-primary/10", text: "text-primary" },
	manager: { bg: "bg-secondary", text: "text-secondary-foreground" },
	driver: { bg: "bg-muted", text: "text-muted-foreground" },
	new_user: { bg: "bg-muted", text: "text-muted-foreground" },
};

function InfoRow({
	label,
	value,
}: {
	label: string;
	value?: string | null | boolean;
}) {
	const displayValue =
		value === null || value === undefined
			? "—"
			: typeof value === "boolean"
				? value
					? "Yes"
					: "No"
				: String(value);

	return (
		<View className="flex-row justify-between py-2">
			<Text className="text-muted-foreground flex-1 text-sm">{label}</Text>
			<Text className="text-foreground flex-1 text-right text-sm">
				{displayValue}
			</Text>
		</View>
	);
}

function Divider() {
	return <View className="bg-border my-1 h-px" />;
}

export default function AdminUserDetailScreen() {
	const params = useLocalSearchParams<{ user_id?: string | string[] }>();
	const userId = Array.isArray(params.user_id)
		? params.user_id[0]
		: params.user_id;

	const profile = useQuery(
		api.profile.getUserProfileById,
		userId ? { id: userId as Id<"profiles"> } : "skip",
	);
	const avatarUrl = useQuery(
		api.profile.getStorageUrl,
		profile?.avatarStorageId
			? { storageId: profile.avatarStorageId }
			: "skip",
	);
	const updateUserStatus = useMutation(api.profile.updateUserStatus);
	const updateUserRole = useMutation(api.profile.updateUserRole);

	const [isApproving, setIsApproving] = useState(false);
	const [isRejecting, setIsRejecting] = useState(false);
	const [isUpdatingRole, setIsUpdatingRole] = useState(false);
	const [updatingToRole, setUpdatingToRole] = useState<string | null>(null);

	const handleApprove = async () => {
		if (!profile) return;
		setIsApproving(true);
		try {
			await updateUserStatus({ profileId: profile._id, status: "approved" });
			Alert.alert("Approved", "User has been approved.");
		} catch (error) {
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to approve user.",
			);
		} finally {
			setIsApproving(false);
		}
	};

	const handleReject = async () => {
		if (!profile) return;
		setIsRejecting(true);
		try {
			await updateUserStatus({ profileId: profile._id, status: "rejected" });
			Alert.alert("Rejected", "User has been rejected.");
		} catch (error) {
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to reject user.",
			);
		} finally {
			setIsRejecting(false);
		}
	};

	const handleRoleChange = async (
		role: "admin" | "manager" | "driver" | "new_user",
	) => {
		if (!profile || role === profile.role) return;
		setIsUpdatingRole(true);
		setUpdatingToRole(role);
		try {
			await updateUserRole({ profileId: profile._id, role });
			Alert.alert("Role updated", `User role changed to ${role}.`);
		} catch (error) {
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to update role.",
			);
		} finally {
			setIsUpdatingRole(false);
			setUpdatingToRole(null);
		}
	};

	/* ---------- Loading state ---------- */

	if (profile === undefined) {
		return (
			<SafeAreaView className="flex-1 items-center justify-center">
				<Stack.Screen options={{ title: "User Details" }} />
				<ActivityIndicator />
			</SafeAreaView>
		);
	}

	/* ---------- Not found state ---------- */

	if (!profile) {
		return (
			<SafeAreaView className="flex-1 items-center justify-center px-6">
				<Stack.Screen options={{ title: "User Details" }} />
				<Text className="text-foreground text-center text-base">
					Profile not found.
				</Text>
			</SafeAreaView>
		);
	}

	/* ---------- Derived values ---------- */

	const userName =
		[profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
		"Unnamed User";

	const statusStyle = STATUS_BADGE[profile.status] ?? STATUS_BADGE.pending;
	const roleStyle = ROLE_BADGE[profile.role] ?? ROLE_BADGE.new_user;

	/* ---------- Render ---------- */

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ title: userName, headerShown: false }} />

			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				{/* ---- Header ---- */}
				<View className="flex-row items-start justify-between">
					<View className="flex-1 flex-row items-center gap-3 pr-4">
						{avatarUrl ? (
							<Image
								source={{ uri: avatarUrl }}
								className="h-12 w-12 rounded-full"
								resizeMode="cover"
							/>
						) : (
							<View className="h-12 w-12 items-center justify-center rounded-full border border-gray-500/30 bg-gray-500/10">
								<Text className="text-foreground text-lg font-bold">
									{userName[0]?.toUpperCase() ?? "?"}
								</Text>
							</View>
						)}
						<Text className="text-foreground flex-1 text-2xl font-bold">
							{userName}
						</Text>
					</View>
					<View className="flex-row flex-wrap gap-2">
						<View className={`rounded-full px-3 py-1 ${statusStyle.bg}`}>
							<Text
								className={`text-sm font-medium capitalize ${statusStyle.text}`}
							>
								{profile.status}
							</Text>
						</View>
						<View className={`rounded-full px-3 py-1 ${roleStyle.bg}`}>
							<Text
								className={`text-sm font-medium capitalize ${roleStyle.text}`}
							>
								{profile.role.replace("_", " ")}
							</Text>
						</View>
					</View>
				</View>

				{/* ---- Personal Information ---- */}
				<View className="bg-card border-border mt-6 rounded-xl border p-4">
					<Text className="text-foreground mb-3 text-lg font-semibold">
						Personal Information
					</Text>
					<InfoRow label="First Name" value={profile.firstName} />
					<Divider />
					<InfoRow label="Last Name" value={profile.lastName} />
					<Divider />
					<InfoRow label="Phone" value={profile.phoneNumber} />
					<Divider />
					<InfoRow label="Email" value={profile.email} />
				</View>

				{/* ---- Identity Documents ---- */}
				<View className="bg-card border-border mt-4 rounded-xl border p-4">
					<Text className="text-foreground mb-3 text-lg font-semibold">
						Identity Documents
					</Text>
					<InfoRow label="Aadhar Number" value={profile.aadharNumber} />
					<Divider />
					<InfoRow label="PAN Number" value={profile.panNumber} />
				</View>

				{/* ---- Emergency ---- */}
				<View className="bg-card border-border mt-4 rounded-xl border p-4">
					<Text className="text-foreground mb-3 text-lg font-semibold">
						Emergency
					</Text>
					<InfoRow label="Emergency Phone" value={profile.emergencyPhone} />
					<Divider />
					<InfoRow label="Insurance" value={profile.insurance} />
					<Divider />
					<InfoRow label="Has Insurance" value={profile.hasInsurance} />
				</View>

				{/* ---- Admin Actions ---- */}
				<View className="bg-card border-border mt-6 rounded-xl border p-4">
					<Text className="text-foreground mb-3 text-lg font-semibold">
						Admin Actions
					</Text>

					{profile.status === "pending" ? (
						<>
							<Text className="text-muted-foreground mb-3 text-sm">
								This user is pending approval. Approve or reject their account.
							</Text>

							<View className="flex-row gap-3">
								<Pressable
									onPress={handleApprove}
									disabled={isApproving || isRejecting}
									className={`flex-1 rounded-lg py-3 ${
										isApproving
											? "bg-primary/70"
											: "bg-primary active:opacity-80"
									}`}
								>
									{isApproving ? (
										<ActivityIndicator color="#ffffff" />
									) : (
										<Text className="text-primary-foreground text-center font-semibold">
											Approve
										</Text>
									)}
								</Pressable>

								<Pressable
									onPress={handleReject}
									disabled={isRejecting || isApproving}
									className={`flex-1 rounded-lg py-3 ${
										isRejecting
											? "bg-destructive/70"
											: "bg-destructive active:opacity-80"
									}`}
								>
									{isRejecting ? (
										<ActivityIndicator color="#ffffff" />
									) : (
										<Text className="text-destructive-foreground text-center font-semibold">
											Reject
										</Text>
									)}
								</Pressable>
							</View>
						</>
					) : (
						<Text className="text-muted-foreground mb-3 text-sm">
							This user has been{" "}
							<Text className="capitalize">{profile.status}</Text>. Change their
							role below if needed.
						</Text>
					)}

					{/* ---- Role changer ---- */}
					<View className="mt-4">
						<Text className="text-foreground mb-2 text-sm font-medium">
							Assign Role
						</Text>
						<View className="flex-row flex-wrap gap-2">
							{(["admin", "manager", "driver"] as const).map((role) => {
								const isActive = profile.role === role;
								const isLoading = isUpdatingRole && updatingToRole === role;

								return (
									<Pressable
										key={role}
										onPress={() => handleRoleChange(role)}
										disabled={isUpdatingRole || isActive}
										className={`rounded-lg px-4 py-2 ${
											isActive ? "bg-primary" : "bg-muted active:opacity-80"
										}`}
									>
										{isLoading ? (
											<ActivityIndicator
												size="small"
												color={isActive ? "#ffffff" : undefined}
											/>
										) : (
											<Text
												className={`font-medium capitalize ${
													isActive
														? "text-primary-foreground"
														: "text-foreground"
												}`}
											>
												{role}
											</Text>
										)}
									</Pressable>
								);
							})}
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
