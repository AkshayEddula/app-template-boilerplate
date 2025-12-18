/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "generalsans-extralight": ["GeneralSans-Extralight", "sans-serif"],
        "generalsans-light": ["GeneralSans-Light", "sans-serif"],
        "generalsans-regular": ["GeneralSans-Regular", "sans-serif"],
        "generalsans-medium": ["GeneralSans-Medium", "sans-serif"],
        "generalsans-semibold": ["GeneralSans-Semibold", "sans-serif"],
        "generalsans-bold": ["GeneralSans-Bold", "sans-serif"],

        "clashdisplay-extralight": ["ClashDisplay-Extralight", "sans-serif"],
        "clashdisplay-light": ["ClashDisplay-Light", "sans-serif"],
        "clashdisplay-regular": ["ClashDisplay-Regular", "sans-serif"],
        "clashdisplay-medium": ["ClashDisplay-Medium", "sans-serif"],
        "clashdisplay-semibold": ["ClashDisplay-Semibold", "sans-serif"],
        "clashdisplay-bold": ["ClashDisplay-Bold", "sans-serif"],

        "bricolagegrotesk-extralight": ["BricolageGrotesk-Extralight", "sans-serif"],
        "bricolagegrotesk-light": ["BricolageGrotesk-Light", "sans-serif"],
        "bricolagegrotesk-regular": ["BricolageGrotesk-Regular", "sans-serif"],
        "bricolagegrotesk-medium": ["BricolageGrotesk-Medium", "sans-serif"],
        "bricolagegrotesk-semibold": ["BricolageGrotesk-Semibold", "sans-serif"],
        "bricolagegrotesk-bold": ["BricolageGrotesk-Bold", "sans-serif"],

        "inter-extralight": ["Inter-ExtraLight", "sans-serif"],
        "inter-light": ["Inter-Light", "sans-serif"],
        "inter-regular": ["Inter-Regular", "sans-serif"],
        "inter-medium": ["Inter-Medium", "sans-serif"],
        "inter-semibold": ["Inter-SemiBold", "sans-serif"],
        "inter-bold": ["Inter-Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
}