import { Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { RefreshableScrollView } from "../../components/common/RefreshableScrollView";
import { useContract } from "../../hooks/useContract";
import type { SessionStackParamList } from "../../types/navigation";
import { formatTimeRange } from "../../utils/formatters";

export function ContractDetailScreen() {
  const route = useRoute<RouteProp<SessionStackParamList, "ContractDetail">>();
  const contract = useContract(route.params.contractId);

  if (!contract.contract && contract.isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  return (
    <RefreshableScrollView onRefresh={() => void contract.fetchContract(route.params.contractId)}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: "#0f172a" }}>
        {contract.contract?.name ?? "Contract"}
      </Text>
      <Text style={{ color: "#475569" }}>
        {formatTimeRange(
          contract.contract?.activeRange.startsAt,
          contract.contract?.activeRange.endsAt
        )}
      </Text>
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: "700", color: "#0f172a" }}>Terms</Text>
        <Text style={{ color: "#334155" }}>
          Minimum valid minutes: {contract.contract?.terms.minValidMinutes ?? "N/A"}
        </Text>
        <Text style={{ color: "#334155" }}>
          Max missed checkpoints: {contract.contract?.terms.maxMissedCheckpoints ?? "N/A"}
        </Text>
        <Text style={{ color: "#334155" }}>
          Mandatory artifacts: {contract.contract?.terms.mandatoryArtifactTypes.join(", ") ?? "N/A"}
        </Text>
        <Text style={{ color: "#334155" }}>
          Viva passing score: {contract.contract?.terms.vivaPassingScore ?? "N/A"}
        </Text>
      </View>
    </RefreshableScrollView>
  );
}
