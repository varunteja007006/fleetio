import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Keyboard,
	Platform,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";

type SearchResult = {
	lat: string;
	lon: string;
	display_name: string;
};

type LocationPickerProps = {
	latitude: number | null;
	longitude: number | null;
	onLocationChange: (lat: number, lng: number) => void;
};

function highlightMatch(text: string, query: string) {
	if (!query.trim()) {
		return text;
	}
	const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
	if (parts.length === 1) {
		return text;
	}
	return parts.map((part, i) =>
		part.toLowerCase() === query.toLowerCase() ? (
			<Text key={i} className="text-foreground font-semibold">
				{part}
			</Text>
		) : (
			<Text key={i}>{part}</Text>
		),
	);
}

export function LocationPicker({
	latitude,
	longitude,
	onLocationChange,
}: LocationPickerProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [searching, setSearching] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [gettingLocation, setGettingLocation] = useState(false);
	const [inputFocused, setInputFocused] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const mapRef = useRef<any>(null);
	const shouldAnimateRef = useRef(false);
	const geocodeSearch = useAction(api.geocode.search);
	const geocodeReverse = useAction(api.geocode.reverse);

	const handleSearch = useCallback(
		(query: string) => {
			setSearchQuery(query);
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
			if (query.trim().length < 2) {
				setSearchResults([]);
				setShowResults(false);
				return;
			}
			debounceRef.current = setTimeout(async () => {
				setSearching(true);
				try {
					const results = await geocodeSearch({ query: query.trim() });
					setSearchResults(results as SearchResult[]);
					setShowResults(results.length > 0);
				} catch {
					setSearchResults([]);
					setShowResults(false);
				} finally {
					setSearching(false);
				}
			}, 300);
		},
		[geocodeSearch],
	);

	const selectResult = useCallback(
		(result: SearchResult) => {
			shouldAnimateRef.current = true;
			onLocationChange(parseFloat(result.lat), parseFloat(result.lon));
			setSearchQuery(result.display_name.split(",")[0]);
			setShowResults(false);
			Keyboard.dismiss();
		},
		[onLocationChange],
	);

	const clearSearch = useCallback(() => {
		setSearchQuery("");
		setSearchResults([]);
		setShowResults(false);
	}, []);

	const handleUseCurrentLocation = useCallback(async () => {
		if (Platform.OS === "web") {
			return;
		}
		setGettingLocation(true);
		try {
			const { Location } = await import("expo-location");
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				return;
			}
			const pos = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
			});
			shouldAnimateRef.current = true;
			onLocationChange(pos.coords.latitude, pos.coords.longitude);
			try {
				const addr = (await geocodeReverse({
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
				})) as { display_name: string } | null;
				if (addr) {
					setSearchQuery(addr.display_name.split(",")[0]);
				}
			} catch {
				// reverse geocode is a nice-to-have
			}
		} catch {
			// silently fail
		} finally {
			setGettingLocation(false);
		}
	}, [onLocationChange, geocodeReverse]);

	const handleMapPress = useCallback(
		(e: any) => {
			const { latitude, longitude } = e.nativeEvent.coordinate;
			onLocationChange(latitude, longitude);
		},
		[onLocationChange],
	);

	const handleDragEnd = useCallback(
		(e: any) => {
			const { latitude, longitude } = e.nativeEvent.coordinate;
			onLocationChange(latitude, longitude);
		},
		[onLocationChange],
	);

	const recenterMap = useCallback(() => {
		if (mapRef.current && latitude !== null && longitude !== null) {
			mapRef.current.animateToRegion(
				{
					latitude,
					longitude,
					latitudeDelta: 0.05,
					longitudeDelta: 0.05,
				},
				500,
			);
		}
	}, [latitude, longitude]);

	const dismissResults = useCallback(() => {
		setShowResults(false);
	}, []);

	useEffect(() => {
		if (
			shouldAnimateRef.current &&
			mapRef.current &&
			latitude !== null &&
			longitude !== null
		) {
			shouldAnimateRef.current = false;
			mapRef.current.animateToRegion(
				{
					latitude,
					longitude,
					latitudeDelta: 0.01,
					longitudeDelta: 0.01,
				},
				600,
			);
		}
	}, [latitude, longitude]);

	const renderMap = () => {
		if (Platform.OS === "web") {
			return null;
		}
		try {
			const MapView = require("react-native-maps").default;
			const { Marker } = require("react-native-maps");

			return (
				<View className="h-52 overflow-hidden rounded-xl">
					<MapView
						ref={mapRef}
						style={{ flex: 1 }}
						onPress={handleMapPress}
						initialRegion={
							latitude !== null && longitude !== null
								? {
										latitude,
										longitude,
										latitudeDelta: 0.05,
										longitudeDelta: 0.05,
									}
								: {
										latitude: 20.5937,
										longitude: 78.9629,
										latitudeDelta: 30,
										longitudeDelta: 30,
									}
						}
					>
						{latitude !== null && longitude !== null && (
							<Marker
								coordinate={{ latitude, longitude }}
								draggable
								onDragEnd={handleDragEnd}
							/>
						)}
					</MapView>
					{latitude !== null && longitude !== null && (
						<Pressable
							onPress={recenterMap}
							className="bg-background/90 absolute bottom-3 right-3 rounded-full px-3 py-1.5 shadow-sm"
						>
							<Text className="text-foreground text-sm font-medium">
								Recenter
							</Text>
						</Pressable>
					)}
				</View>
			);
		} catch {
			return (
				<View className="h-48 items-center justify-center rounded-xl bg-muted">
					<Text className="text-muted-foreground text-sm">
						Map unavailable
					</Text>
				</View>
			);
		}
	};

	return (
		<View className="gap-3">
			{/* Search bar row */}
			<View className="flex-row gap-2">
				<View className="relative z-10 flex-1">
					<View className="flex-row items-center rounded-lg border border-border bg-background px-3">
						<Text className="text-muted-foreground mr-2 text-base">🔍</Text>
						<TextInput
							value={searchQuery}
							onChangeText={handleSearch}
							onFocus={() => {
								setInputFocused(true);
								if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
									setShowResults(true);
								}
							}}
							onBlur={() => setInputFocused(false)}
							placeholder="Search address or place..."
							placeholderTextColor="#9ca3af"
							className="text-foreground flex-1 py-3 text-base"
						/>
						{searching ? (
							<ActivityIndicator size="small" />
						) : searchQuery.length > 0 ? (
							<Pressable onPress={clearSearch} className="ml-1 p-1">
								<Text className="text-muted-foreground text-lg leading-none">
									✕
								</Text>
							</Pressable>
						) : null}
					</View>

					{/* Floating suggestions dropdown */}
					{showResults && searchResults.length > 0 && (
						<View className="absolute left-0 right-0 top-full z-20 mt-1">
							<Pressable onPress={dismissResults}>
								<View className="bg-card border-border rounded-xl border shadow-xl">
									{searchResults.slice(0, 5).map((result, index) => (
										<Pressable
											key={`${result.lat}-${result.lon}-${index}`}
											onPress={() => selectResult(result)}
											className={`flex-row items-start gap-3 px-4 py-3 ${
												index < Math.min(searchResults.length, 5) - 1
													? "border-border border-b"
													: ""
											}`}
										>
											<Text className="text-muted-foreground mt-0.5 text-base">
												📍
											</Text>
											<View className="flex-1">
												<Text
													className="text-foreground text-sm leading-5"
													numberOfLines={2}
												>
													{highlightMatch(result.display_name, searchQuery)}
												</Text>
												<Text className="text-muted-foreground mt-0.5 text-xs">
													{result.lat}, {result.lon}
												</Text>
											</View>
										</Pressable>
									))}
								</View>
							</Pressable>
						</View>
					)}
				</View>

				{Platform.OS !== "web" && (
					<Pressable
						onPress={handleUseCurrentLocation}
						disabled={gettingLocation}
						className="bg-secondary rounded-lg px-3 justify-center active:opacity-80"
					>
						{gettingLocation ? (
							<ActivityIndicator size="small" />
						) : (
							<Text className="text-foreground text-lg">📍</Text>
						)}
					</Pressable>
				)}
			</View>

			{/* Map (native only) */}
			{renderMap()}

			{/* Coordinates summary */}
			{latitude !== null && longitude !== null && (
				<View className="flex-row gap-2">
					<View className="bg-muted flex-1 rounded-lg px-3 py-2">
						<Text className="text-muted-foreground text-xs font-medium">
							Latitude
						</Text>
						<Text className="text-foreground font-mono text-sm">
							{latitude.toFixed(6)}
						</Text>
					</View>
					<View className="bg-muted flex-1 rounded-lg px-3 py-2">
						<Text className="text-muted-foreground text-xs font-medium">
							Longitude
						</Text>
						<Text className="text-foreground font-mono text-sm">
							{longitude.toFixed(6)}
						</Text>
					</View>
				</View>
			)}
		</View>
	);
}
