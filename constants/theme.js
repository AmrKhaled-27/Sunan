const palette = {
  // Warm Manuscript Palette
  parchment: "#F5EFE0",
  parchmentLight: "#FAF7F0",
  parchmentPure: "#FFFCF5",
  warmBrown: "#3D2E1F",
  warmBrownLight: "#5C4A3A",
  warmBrownMuted: "#8A7E6B",
  warmBrownSubtle: "#A89A84",
  warmGold: "#C4A46C",
  warmGoldLight: "#D4BC8E",
  warmGoldMuted: "#E8D5B0",
  goldAccent: "#D4AF37",
  sageGreen: "#8FAF8B",
  sageGreenLight: "#B5CCAA",
  oliveGreen: "#90937A",
  oliveGreenDark: "#787C62",
  warmAmber: "#C9956B",
  warmAmberLight: "#DEB896",
  mutedGold: "#D4B876",
  mutedGoldLight: "#E5D4A0",
  tabInactive: "#B0A89A",
  switchTrackFalse: "#D4C9B8",
  danger: "#DC2626",
  dangerDark: "#B91C1C",
  dangerLight: "#FEE2E2",
  white: "#FFFFFF",
  black: "#000000",
};

const fonts = {
  sans: ["Tajawal_400Regular", "sans-serif"],
  tajawal: ["Tajawal_400Regular", "sans-serif"],
  tajawalBold: ["Tajawal_700Bold", "sans-serif"],
  "tajawal-bold": ["Tajawal_700Bold", "sans-serif"],
  amiri: ["Amiri_400Regular", "serif"],
  amiriBold: ["Amiri_700Bold", "serif"],
  "amiri-bold": ["Amiri_700Bold", "serif"],
};

module.exports = {
  palette,
  fonts,
  theme: {
    colors: palette,
    fonts,
  },
};
