import { ActivityIndicator, Text, View } from "react-native";

interface LoadingScreenProps {
	message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
	return (
		<View className=" flex-1 items-center justify-center">
			<ActivityIndicator size="large" color="#f59e0b" />
			{message && (
				<Text className="text-muted-foreground mt-4 text-sm">{message}</Text>
			)}
		</View>
	);
}
