/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
			"./App.{js,jsx,ts,tsx}",
			"./app/**/*.{js,jsx,ts,tsx}", // Include all JS, JSX, TS, and TSX files in the app folder
			"./components/**/*.{js,jsx,ts,tsx}", // Include all JS, JSX, TS, and TSX files in the components folder]
	],
	theme: {
			extend: {
				colors: {
					"primary-dark-blue": "#183F92",
					"white-sand": "#F6F4F2",
					"grey-6": "#8E8E93",
					"grey-8": "#5C5C61",
					"primary-light-blue": "#2563EB",
					"blue-ocean": "#2985D0",
				},
				fontFamily: {
					"dm-light": ["DMSans-Light", "system-ui", "sans-serif"],
					"dm-regular": ["DMSans-Regular", "system-ui", "sans-serif"],
					"dm-medium": ["DMSans-Medium", "system-ui", "sans-serif"],
					"dm-bold": ["DMSans-Bold", "system-ui", "sans-serif"],
				},
			},
	},
	future: {
    hoverOnlyWhenSupported: true,
  },
	plugins: [],
};