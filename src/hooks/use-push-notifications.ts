import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export function usePushNotifications() {
	const router = useRouter();
	const registerPushToken = useMutation(api.pushNotifications.registerPushToken);
	const responseHandledRef = useRef(false);

	useEffect(() => {
		if (Platform.OS === "web") return;

		let mounted = true;

		const setup = async () => {
			try {
				const { status: existingStatus } =
					await Notifications.getPermissionsAsync();
				let finalStatus = existingStatus;

				if (existingStatus !== "granted") {
					const { status } = await Notifications.requestPermissionsAsync();
					finalStatus = status;
				}

				if (finalStatus !== "granted") {
					return;
				}

				const projectId =
					Constants.expoConfig?.extra?.eas?.projectId;

				const tokenData = await Notifications.getExpoPushTokenAsync({
					projectId,
				});

				if (!mounted) return;

				await registerPushToken({ token: tokenData.data });

				Notifications.setNotificationHandler({
					handleNotification: async () => ({
						shouldShowAlert: true,
						shouldPlaySound: true,
						shouldSetBadge: false,
					}),
				});

				const responseSubscription =
					Notifications.addNotificationResponseReceivedListener(
						(response) => {
							const data = response.notification.request.content.data;
							if (data?.type === "delay" && data?.routeRunId) {
								router.push(`/dashboard/active-run?runId=${data.routeRunId}`);
							}
						},
					);

				return () => {
					responseSubscription.remove();
				};
			} catch {
				// Silently fail — notifications are non-critical
			}
		};

		const cleanupPromise = setup();

		return () => {
			mounted = false;
			cleanupPromise.then((cleanup) => cleanup?.());
		};
	}, [registerPushToken, router]);
}
