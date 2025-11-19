import { Colors } from "@/constants/theme";

export function useThemeColor(colorName: keyof typeof Colors) {
  // Always return the "light mode" color
  return Colors[colorName];
}
