import { View } from "react-native";

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View style={{ gap: 12, padding: 16 }}>
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          style={{
            height: index === 0 ? 28 : 88,
            borderRadius: 12,
            backgroundColor: "#e2e8f0"
          }}
        />
      ))}
    </View>
  );
}
