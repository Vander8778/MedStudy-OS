import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { RootNavigator } from "./navigation/RootNavigator";

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <RootNavigator />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
