import type { ReactNode } from "react";
import { Component } from "react";
import { Text, View } from "react-native";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ textAlign: "center", color: "#475569" }}>
            Restart the app or refresh the current screen to restore backend-backed data.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
