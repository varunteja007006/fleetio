import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface AdminCardProps {
	title: string;
	description: string;
	accent: string;
	onPress: () => void;
	className?: string;
}

export default function AdminCard({
	title,
	description,
	accent,
	onPress,
	className,
}: AdminCardProps) {
	return (
		<Pressable
			onPress={onPress}
			className={`bg-card border-border active:opacity-80 rounded-xl border p-4 ${className}`}
		>
			<View className={`${accent} mb-3 h-1.5 w-8 rounded-full`} />
			<View className="flex-row items-center justify-between">
				<View className="flex-1 pr-4">
					<Text className="text-foreground text-base font-semibold">
						{title}
					</Text>
					<Text className="text-muted-foreground mt-1 text-sm leading-5">
						{description}
					</Text>
				</View>
				<View className="bg-primary rounded-lg px-3 py-1.5">
					<Text className="text-primary-foreground text-sm font-medium">
						Open
					</Text>
				</View>
			</View>
		</Pressable>
	);
}
