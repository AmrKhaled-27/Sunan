export interface Palette {
  readonly parchment: "#F5EFE0";
  readonly parchmentLight: "#FAF7F0";
  readonly parchmentPure: "#FFFCF5";
  readonly warmBrown: "#3D2E1F";
  readonly warmBrownLight: "#5C4A3A";
  readonly warmBrownMuted: "#8A7E6B";
  readonly warmBrownSubtle: "#A89A84";
  readonly warmGold: "#C4A46C";
  readonly warmGoldLight: "#D4BC8E";
  readonly warmGoldMuted: "#E8D5B0";
  readonly goldAccent: "#D4AF37";
  readonly sageGreen: "#8FAF8B";
  readonly sageGreenLight: "#B5CCAA";
  readonly oliveGreen: "#90937A";
  readonly oliveGreenDark: "#787C62";
  readonly warmAmber: "#C9956B";
  readonly warmAmberLight: "#DEB896";
  readonly mutedGold: "#D4B876";
  readonly mutedGoldLight: "#E5D4A0";
  readonly tabInactive: "#B0A89A";
  readonly switchTrackFalse: "#D4C9B8";
  readonly danger: "#DC2626";
  readonly dangerDark: "#B91C1C";
  readonly dangerLight: "#FEE2E2";
  readonly white: "#FFFFFF";
  readonly black: "#000000";
}

export declare const palette: Palette;

export declare const fonts: {
  readonly sans: readonly ["Tajawal_400Regular", "sans-serif"];
  readonly tajawal: readonly ["Tajawal_400Regular", "sans-serif"];
  readonly tajawalBold: readonly ["Tajawal_700Bold", "sans-serif"];
  readonly "tajawal-bold": readonly ["Tajawal_700Bold", "sans-serif"];
  readonly amiri: readonly ["Amiri_400Regular", "serif"];
  readonly amiriBold: readonly ["Amiri_700Bold", "serif"];
  readonly "amiri-bold": readonly ["Amiri_700Bold", "serif"];
};

export declare const theme: {
  readonly colors: Palette;
  readonly fonts: typeof fonts;
};

export type ThemeColors = typeof palette;
export type ThemeFonts = typeof fonts;
