export type AuthStackParamList = {
  Login: undefined;
};

export type SessionStackParamList = {
  Home: undefined;
  SessionDetail: { sessionId: string };
  Checkpoint: { sessionId: string; checkpointId: string };
  ArtifactSubmit: { sessionId: string };
  Viva: { sessionId: string };
  ContractDetail: { contractId: string };
  SessionResult: { sessionId: string };
  Avatar: undefined;
};

export type MainTabParamList = {
  SessionTab: undefined;
  ResultHistory: undefined;
  Progress: undefined;
  Settings: undefined;
};
