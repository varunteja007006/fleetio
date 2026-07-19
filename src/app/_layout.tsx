import "@/global.css";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "~/lib/auth-client";
import { usePushNotifications } from "~/hooks/use-push-notifications";

type SessionLike = { id?: string | null };
type SessionWithNested = { session?: SessionLike | null };

function getNormalizedSession(session: unknown): SessionLike | null {
	if (!session || typeof session !== "object") {
		return null;
	}

	if ("session" in session) {
		const nestedSession = (session as SessionWithNested).session;
		if (nestedSession && typeof nestedSession === "object") {
			return nestedSession;
		}
	}

	return session as SessionLike;
}

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
	// Optionally pause queries until the user is authenticated
	expectAuth: true,
	unsavedChangesWarning: false,
});

function useAuthFromBetterAuth() {
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const normalizedSession = getNormalizedSession(session);
	const sessionId = normalizedSession?.id ?? null;
	const [cachedToken, setCachedToken] = useState<string | null>(null);
	const pendingTokenRef = useRef<Promise<string | null> | null>(null);

	useEffect(() => {
		if (!normalizedSession && !isSessionPending && cachedToken) {
			setCachedToken(null);
		}
	}, [normalizedSession, isSessionPending, cachedToken]);

	const fetchAccessToken = useCallback(
		async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
			if (cachedToken && !forceRefreshToken) {
				return cachedToken;
			}

			if (!forceRefreshToken && pendingTokenRef.current) {
				return pendingTokenRef.current;
			}

			pendingTokenRef.current = authClient.convex
				.token({ fetchOptions: { throw: false } })
				.then(({ data }) => {
					const token = data?.token ?? null;
					setCachedToken(token);
					return token;
				})
				.catch(() => {
					setCachedToken(null);
					return null;
				})
				.finally(() => {
					pendingTokenRef.current = null;
				});

			return pendingTokenRef.current;
		},
		[sessionId, cachedToken],
	);

	return {
		isLoading: isSessionPending && !cachedToken,
		isAuthenticated: Boolean(normalizedSession) || cachedToken !== null,
		fetchAccessToken,
	};
}

function NotificationsSetup() {
	usePushNotifications();
	return null;
}

export default function RootLayout() {
	return (
		<ConvexProviderWithAuth client={convex} useAuth={useAuthFromBetterAuth}>
			<Stack>
				<Stack.Screen name="index" options={{ title: "Home" }} />
			</Stack>
			<NotificationsSetup />
		</ConvexProviderWithAuth>
	);
}
