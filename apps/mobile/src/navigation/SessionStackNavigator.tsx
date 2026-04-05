import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ContractDetailScreen } from "../screens/contract/ContractDetailScreen";
import { HomeScreen } from "../screens/home/HomeScreen";
import { AvatarScreen } from "../screens/progress/AvatarScreen";
import { ArtifactSubmitScreen } from "../screens/session/ArtifactSubmitScreen";
import { CheckpointScreen } from "../screens/session/CheckpointScreen";
import { SessionDetailScreen } from "../screens/session/SessionDetailScreen";
import { VivaScreen } from "../screens/session/VivaScreen";
import { SessionResultScreen } from "../screens/results/SessionResultScreen";
import type { SessionStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<SessionStackParamList>();

export function SessionStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: "Session" }} />
      <Stack.Screen name="Checkpoint" component={CheckpointScreen} options={{ title: "Checkpoint" }} />
      <Stack.Screen name="ArtifactSubmit" component={ArtifactSubmitScreen} options={{ title: "Submit Artifact" }} />
      <Stack.Screen name="Viva" component={VivaScreen} options={{ title: "Viva" }} />
      <Stack.Screen name="ContractDetail" component={ContractDetailScreen} options={{ title: "Contract" }} />
      <Stack.Screen name="SessionResult" component={SessionResultScreen} options={{ title: "Result" }} />
      <Stack.Screen name="Avatar" component={AvatarScreen} options={{ title: "Avatar" }} />
    </Stack.Navigator>
  );
}
