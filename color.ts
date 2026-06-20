import { Platform } from "react-native";

const IOS_SYSTEM_COLORS = {
	white: "rgb(255, 255, 255)",
	black: "rgb(0, 0, 0)",
	light: {
		background: "rgb(248,245,245)",
		foreground: "rgb(17,17,17)",

		card: "rgb(255,255,255)",

		primary: "rgb(212,30,30)",
		secondary: "rgb(245,239,236)",
		accent: "rgb(255,240,230)",

		muted: "rgb(238,237,237)",
		destructive: "rgb(255,56,43)",

		border: "rgb(228,226,226)",
	},

	dark: {
		background: "rgb(5,1,1)",
		foreground: "rgb(248,248,248)",

		card: "rgb(18,14,14)",

		primary: "rgb(227,57,57)",
		secondary: "rgb(46,43,43)",
		accent: "rgb(65,48,43)",

		muted: "rgb(28,26,26)",
		destructive: "rgb(254,67,54)",

		border: "rgb(60,55,55)",
	},
} as const;

const ANDROID_COLORS = {
	white: "rgb(255, 255, 255)",
	black: "rgb(0, 0, 0)",
	light: {
		background: "rgb(248,245,245)",
		foreground: "rgb(17,17,17)",

		card: "rgb(255,255,255)",

		primary: "rgb(212,30,30)",
		secondary: "rgb(245,239,236)",
		accent: "rgb(255,240,230)",

		muted: "rgb(238,237,237)",
		destructive: "rgb(255,56,43)",

		border: "rgb(228,226,226)",
	},

	dark: {
		background: "rgb(5,1,1)",
		foreground: "rgb(248,248,248)",

		card: "rgb(18,14,14)",

		primary: "rgb(227,57,57)",
		secondary: "rgb(46,43,43)",
		accent: "rgb(65,48,43)",

		muted: "rgb(28,26,26)",
		destructive: "rgb(254,67,54)",

		border: "rgb(60,55,55)",
	},
} as const;

const WEB_COLORS = {
	white: "rgb(255, 255, 255)",
	black: "rgb(0, 0, 0)",
	light: {
		background: "rgb(248,245,245)",
		foreground: "rgb(17,17,17)",

		card: "rgb(255,255,255)",

		primary: "rgb(212,30,30)",
		secondary: "rgb(245,239,236)",
		accent: "rgb(255,240,230)",

		muted: "rgb(238,237,237)",
		destructive: "rgb(255,56,43)",

		border: "rgb(228,226,226)",
	},

	dark: {
		background: "rgb(5,1,1)",
		foreground: "rgb(248,248,248)",

		card: "rgb(18,14,14)",

		primary: "rgb(227,57,57)",
		secondary: "rgb(46,43,43)",
		accent: "rgb(65,48,43)",

		muted: "rgb(28,26,26)",
		destructive: "rgb(254,67,54)",

		border: "rgb(60,55,55)",
	},
} as const;

const COLORS =
	Platform.OS === "ios"
		? IOS_SYSTEM_COLORS
		: Platform.OS === "android"
			? ANDROID_COLORS
			: WEB_COLORS;

export { COLORS };
