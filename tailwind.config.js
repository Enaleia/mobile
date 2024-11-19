/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
			"./App.{js,jsx,ts,tsx}",
			"./app/**/*.{js,jsx,ts,tsx}", // Include all JS, JSX, TS, and TSX files in the app folder
			"./components/**/*.{js,jsx,ts,tsx}", // Include all JS, JSX, TS, and TSX files in the components folder]
	],
	theme: {
			extend: {
					fontFamily: {
							sans: ['DMSans-Regular', 'system-ui', 'sans-serif'],
							medium: ['DMSans-Medium', 'system-ui', 'sans-serif'],
							semibold: ['DMSans-SemiBold', 'system-ui', 'sans-serif'],
							bold: ['DMSans-Bold', 'system-ui', 'sans-serif'],
					},
			},
	},
	future: {
    hoverOnlyWhenSupported: true,
  },
	plugins: [],
};