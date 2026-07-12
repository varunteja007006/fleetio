import { Text, View } from "react-native";

type Profile = {
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	phoneNumber?: string | null;
	role?: string | null;
	status?: string | null;
};

type Session = {
	session?: { id?: string | null } | null;
	user?: { id?: string | null; email?: string | null } | null;
} | null;

interface ProfileCardProps {
	/** The Convex profile document (returned from api.profile.getUserProfile) */
	profile?: Profile | null;
	/** The Better Auth session data (returned from authClient.useSession()) */
	session?: Session | null;
}

/**
 * A reusable card that displays details about the currently logged-in user,
 * including their avatar (initials), full name, email, role, and status badge.
 *
 * Use on the home screen to show user info at a glance, or embed it in the
 * profile screen for a compact information header. Does NOT include a sign-out
 * button — pair with `<SignOutButton>` when needed.
 */
export default function ProfileCard({ profile, session }: ProfileCardProps) {
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
			{/* User Info Row */}
			<View className="flex-row items-center gap-4">
				{/* Avatar */}
				<View className="h-14 w-14 items-center justify-center rounded-full border border-gray-500/30 bg-gray-500/10">
					<Text className="text-foreground text-xl font-bold">{initial}</Text>
				</View>

				{/* Details */}
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

					{/* Role + Status row */}
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
