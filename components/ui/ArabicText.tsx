import React from "react";
import { Platform, Text, TextProps } from "react-native";

interface ArabicTextProps extends TextProps {
  align?: "start" | "center";
}

/** RN 0.81 mirrors left/right text alignment in an RTL Yoga layout.
 * Set both layout and writing direction explicitly, and use logical start on
 * native. CSS on web uses physical right. Centered labels remain centered.
 */
export function ArabicText({
  align = "start",
  style,
  ...props
}: ArabicTextProps) {
  return (
    <Text
      {...props}
      style={[
        style,
        {
          direction: "rtl",
          writingDirection: "rtl",
          textAlign:
            align === "center"
              ? "center"
              : Platform.OS === "web"
                ? "right"
                : "left",
        },
      ]}
    />
  );
}
