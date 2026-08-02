import Luicide from "@react-native-vector-icons/lucide";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface AdminHeaderProps {
	title: string;
	subtitle?: string;
	right?: ReactNode;
}

export default function AdminHeader({
	title,
	subtitle,
	right,
}: AdminHeaderProps) {
	const router = useRouter();

	return (
		<View>
			<View className="flex-row items-center">
				<Pressable onPress={() => router.back()} className="mr-3 p-1">
					<Luicide name="arrow-left" size={24} color="#9ca3af" />
				</Pressable>
				<Text className="text-foreground flex-1 text-2xl font-bold">
					{title}
				</Text>
				{right !== undefined ? <View className="ml-4">{right}</View> : null}
			</View>
			{subtitle !== undefined ? (
				<Text className="text-muted-foreground mt-1 text-sm">{subtitle}</Text>
			) : null}
		</View>
	);
}