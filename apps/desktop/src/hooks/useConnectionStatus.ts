import { useEffect } from "react";
import { useConnectionStore } from "../state/connection-store";

export function useConnectionStatus() {
  const connection = useConnectionStore();

  useEffect(() => {
    function handleOnline() {
      connection.setOnline();
    }

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [connection]);

  return connection;
}
