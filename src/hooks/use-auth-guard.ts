import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { authClient } from "~/lib/auth-client";

export function useAuthGuard(options: { requireAdmin?: boolean; requireApproved?: boolean } = {}) {
	const { data: session, isPending } = authClient.useSession();
	const userProfile = useQuery(api.profile.getUserProfile);
	const router = useRouter();

	const isAuthenticated = !!session?.session;
	const isLoading = isPending || userProfile === undefined;
	const role = userProfile?.role;
	const status = userProfile?.status;
	const isAdmin = role === "admin";
	const isApproved = status === "approved";

	useEffect(() => {
		if (isPending) return;

		if (!session?.session) {
			router.replace("/");
			return;
		}

		if (userProfile === undefined) return;

		if (options.requireAdmin && !isAdmin) {
			router.replace("/dashboard");
			return;
		}

		if (options.requireApproved && (status === "pending" || status === "rejected")) {
			router.replace("/dashboard");
			return;
		}
	}, [isPending, session, userProfile, options.requireAdmin, options.requireApproved]);

	return { isAuthenticated, isLoading, userProfile, role, status, isAdmin, isApproved };
}
