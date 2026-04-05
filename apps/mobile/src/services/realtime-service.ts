export function createRealtimeService() {
  return {
    connect() {
      return {
        close() {
          // MVP intentionally uses polling instead of realtime transport.
        }
      };
    }
  };
}
