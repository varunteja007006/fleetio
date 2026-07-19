import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Image, Text, View } from "react-native";

type Profile = {
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	phoneNumber?: string | null;
	role?: string | null;
	status?: string | null;
	avatarStorageId?: string | null;
};

type Session = {
	session?: { id?: string | null } | null;
	user?: { id?: string | null; email?: string | null } | null;
} | null;

interface ProfileCardProps {
	profile?: Profile | null;
	session?: Session | null;
}

function ProfileCardSkeleton() {
	return (
		<View className="w-full rounded-2xl border border-gray-500/20 bg-white/5 p-5 shadow-sm">
			<View className="flex-row items-center gap-4">
				<View className="h-20 w-20 rounded-full bg-gray-500/10" />
				<View className="flex-1 gap-2 py-1">
					<View className="h-5 w-40 rounded bg-gray-500/10" />
					<View className="h-4 w-56 rounded bg-gray-500/10" />
					<View className="h-3 w-32 rounded bg-gray-500/10" />
					<View className="mt-1 flex-row gap-2">
						<View className="h-5 w-12 rounded-md bg-gray-500/10" />
						<View className="h-5 w-20 rounded-md bg-gray-500/10" />
					</View>
				</View>
			</View>
		</View>
	);
}

export default function ProfileCard({ profile, session }: ProfileCardProps) {
	const avatarUrl = useQuery(
		api.profile.getStorageUrl,
		profile?.avatarStorageId
			? { storageId: profile.avatarStorageId }
			: "skip",
	);

	if (profile === undefined) {
		return <ProfileCardSkeleton />;
	}

	const firstName = profile?.firstName ?? "";
	const lastName = profile?.lastName ?? "";
	const fullName =
		firstName || lastName ? `${firstName} ${lastName}`.trim() : "";

	const displayName = fullName || session?.user?.email || "User";
	const initial = displayName[0]?.toUpperCase() ?? "?";

	const role =
		profile?.role === "new_user"
			? "NEW"
			: (profile?.role?.toUpperCase() ?? "");
	const profileStatus = profile?.status;

	return (
		<View className="w-full rounded-2xl border border-gray-500/20 bg-white/5 p-5 shadow-sm">
			<View className="flex-row items-center gap-4">
				{avatarUrl ? (
					<Image
						source={{ uri: avatarUrl }}
						className="h-20 w-20 rounded-full"
						resizeMode="cover"
					/>
				) : (
					<View className="h-20 w-20 items-center justify-center rounded-full border border-gray-500/30 bg-gray-500/10">
						<Text className="text-foreground text-3xl font-bold">{initial}</Text>
					</View>
				)}

				<View className="flex-1 gap-0.5">
					<Text className="text-foreground text-lg font-semibold">
						{displayName}
					</Text>

					{profile?.email && (
						<Text className="text-muted-foreground text-sm" numberOfLines={1}>
							{profile.email}
						</Text>
					)}

					{profile?.phoneNumber && (
						<Text className="text-muted-foreground text-xs" numberOfLines={1}>
							{profile.phoneNumber}
						</Text>
					)}

					<View className="mt-1 flex-row items-center gap-2">
						{role ? (
							<View className="rounded-md bg-gray-500/15 px-2 py-0.5">
								<Text className="text-muted-foreground text-xs font-medium">
									{role}
								</Text>
							</View>
						) : null}

						{profileStatus ? (
							<View
								className={`rounded-md px-2 py-0.5 ${
									profileStatus === "approved"
										? "bg-green-500/15"
										: profileStatus === "pending"
											? "bg-amber-500/15"
											: "bg-red-500/15"
								}`}
							>
								<Text
									className={`text-xs font-medium ${
										profileStatus === "approved"
											? "text-green-600"
											: profileStatus === "pending"
												? "text-amber-600"
												: "text-red-600"
									}`}
								>
									{profileStatus.charAt(0).toUpperCase() +
										profileStatus.slice(1)}
								</Text>
							</View>
						) : null}
					</View>
				</View>
			</View>
		</View>
	);
}
