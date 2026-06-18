import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AuthRequired() {
  const router = useRouter();

  return (
    <SafeAreaView className="bg-background flex-1 items-center justify-center px-6">
      <View className="items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Ionicons name="lock-closed" size={32} color="#f59e0b" />
        </View>
        <Text className="text-foreground text-center text-2xl font-bold">
          Authentication Required
        </Text>
        <Text className="text-muted-foreground mt-2 text-center text-base">
          Please sign in to access the dashboard
        </Text>
        <Pressable
          onPress={() => router.push("/auth")}
          className="bg-primary mt-6 w-full items-center rounded-lg px-6 py-3"
        >
          <Text className="text-primary-foreground font-semibold">
            Go to Sign In
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
