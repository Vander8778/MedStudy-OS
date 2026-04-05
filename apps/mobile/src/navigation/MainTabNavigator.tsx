import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ProgressScreen } from "../screens/progress/ProgressScreen";
import { ResultHistoryScreen } from "../screens/results/ResultHistoryScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import type { MainTabParamList } from "../types/navigation";
import { SessionStackNavigator } from "./SessionStackNavigator";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="SessionTab" component={SessionStackNavigator} options={{ title: "Home" }} />
      <Tab.Screen name="ResultHistory" component={ResultHistoryScreen} options={{ title: "Results" }} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
