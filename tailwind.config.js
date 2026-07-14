/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Warm Manuscript palette
        parchment: "#F5EFE0",
        parchmentLight: "#FAF7F0",
        warmBrown: "#3D2E1F",
        warmBrownLight: "#5C4A3A",
        warmGold: "#C4A46C",
        warmGoldLight: "#D4BC8E",
        warmGoldMuted: "#E8D5B0",
        sageGreen: "#8FAF8B",
        sageGreenLight: "#B5CCAA",
        warmAmber: "#C9956B",
        warmAmberLight: "#DEB896",
        mutedGold: "#D4B876",
        mutedGoldLight: "#E5D4A0",
      },
      fontFamily: {
        sans: ["Tajawal_400Regular", "sans-serif"],
        tajawal: ["Tajawal_400Regular", "sans-serif"],
        "tajawal-bold": ["Tajawal_700Bold", "sans-serif"],
        amiri: ["Amiri_400Regular", "serif"],
        "amiri-bold": ["Amiri_700Bold", "serif"],
      },
    },
  },
  plugins: [],
};
