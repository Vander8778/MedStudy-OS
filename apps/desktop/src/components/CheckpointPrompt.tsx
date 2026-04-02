import type { CheckpointView } from "@medstudy/contracts";

export function CheckpointPrompt({
  checkpoint
}: {
  checkpoint: CheckpointView | null;
}) {
  if (!checkpoint) {
    return null;
  }

  return (
    <section
      style={{
        padding: "1rem",
        borderRadius: "1rem",
        background: "#fff3cd",
        color: "#663c00"
      }}
    >
      <strong>Checkpoint Due</strong>
      <div>{checkpoint.title}</div>
      <div style={{ fontSize: "0.9rem" }}>Due at {checkpoint.dueAt}</div>
    </section>
  );
}
