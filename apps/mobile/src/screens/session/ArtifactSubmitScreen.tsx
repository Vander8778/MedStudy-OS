import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { ArtifactType } from "@medstudy/contracts";
import { ARTIFACT_LIMITS } from "../../utils/constants";
import { useNotificationStore } from "../../state/notification-store";
import { useSessionStore } from "../../state/session-store";
import type { SessionStackParamList } from "../../types/navigation";

export function ArtifactSubmitScreen() {
  const route = useRoute<RouteProp<SessionStackParamList, "ArtifactSubmit">>();
  const isOnline = useNotificationStore((state) => state.isOnline);
  const submitArtifact = useSessionStore((state) => state.submitArtifact);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [artifactType, setArtifactType] = useState<ArtifactType>("note");
  const [assetUri, setAssetUri] = useState<string>();
  const [error, setError] = useState<string>();

  async function pickPhoto() {
    try {
      const ImagePicker = await import("expo-image-picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        if (!asset) {
          return;
        }
        if ((asset.fileSize ?? 0) > ARTIFACT_LIMITS.maxFileSizeBytes) {
          setError("Selected file exceeds the MVP mobile size limit.");
          return;
        }
        setAssetUri(asset.uri);
        setArtifactType("screenshot");
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Image picker unavailable.");
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setError(undefined);
    await submitArtifact({
      sessionId: route.params.sessionId,
      isOnline,
      artifact: {
        type: artifactType,
        title,
        description: description || undefined,
        uri: assetUri,
        source: assetUri ? "user_upload" : "manual_entry",
        status: "submitted",
        metadata: assetUri ? { localUri: assetUri } : undefined
      }
    });
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a" }}>
        Submit artifact
      </Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        style={{
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 12,
          padding: 14
        }}
      />
      <TextInput
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        style={{
          minHeight: 100,
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 12,
          padding: 14,
          textAlignVertical: "top"
        }}
      />
      <Pressable onPress={() => void pickPhoto()}>
        <Text style={{ color: "#2563eb", fontWeight: "700" }}>
          {assetUri ? "Replace photo" : "Pick photo"}
        </Text>
      </Pressable>
      {assetUri ? <Text style={{ color: "#475569" }}>Attached: {assetUri}</Text> : null}
      {error ? <Text style={{ color: "#b91c1c" }}>{error}</Text> : null}
      <Pressable
        onPress={() => void handleSubmit()}
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: "#2563eb"
        }}
      >
        <Text style={{ textAlign: "center", color: "#ffffff", fontWeight: "700" }}>
          {isOnline ? "Submit artifact" : "Queue artifact submission"}
        </Text>
      </Pressable>
    </View>
  );
}
