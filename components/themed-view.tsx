import { Colors } from "@/constants/theme";
import React from "react";
import { View, ViewProps } from "react-native";

type ThemedViewProps = ViewProps & {
  // add any custom props if needed
};

export function ThemedView({ style, ...props }: ThemedViewProps) {
  return <View style={[{ backgroundColor: Colors.background }, style]} {...props} />;
}
