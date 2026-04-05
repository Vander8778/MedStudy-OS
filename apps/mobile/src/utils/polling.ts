export function shouldRunPolling(input: {
  enabled: boolean;
  isFocused: boolean;
  appState: string;
}) {
  return input.enabled && input.isFocused && input.appState === "active";
}
