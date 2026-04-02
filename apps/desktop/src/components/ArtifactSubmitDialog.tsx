import { useState } from "react";
import type { SubmitArtifactRequest } from "@medstudy/contracts";

const baseArtifact: SubmitArtifactRequest = {
  type: "final_submission",
  source: "manual_entry",
  status: "submitted",
  title: "Study artifact",
  description: "",
  uri: "https://example.invalid/artifact"
};

export function ArtifactSubmitDialog({
  disabled,
  onSubmit
}: {
  disabled?: boolean;
  onSubmit: (input: SubmitArtifactRequest) => Promise<void>;
}) {
  const [draft, setDraft] = useState(baseArtifact);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button disabled={disabled} onClick={() => setOpen(true)}>
        Submit Artifact
      </button>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        padding: "1rem",
        borderRadius: "1rem",
        border: "1px solid #d0d5dd",
        background: "#fff"
      }}
    >
      <input
        value={draft.title}
        onChange={(event) =>
          setDraft((current) => ({ ...current, title: event.target.value }))
        }
        placeholder="Artifact title"
      />
      <textarea
        value={draft.description}
        onChange={(event) =>
          setDraft((current) => ({
            ...current,
            description: event.target.value
          }))
        }
        placeholder="Short summary"
      />
      <input
        value={draft.uri}
        onChange={(event) =>
          setDraft((current) => ({ ...current, uri: event.target.value }))
        }
        placeholder="Artifact URL"
      />
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          disabled={disabled}
          onClick={async () => {
            await onSubmit(draft);
            setOpen(false);
          }}
        >
          Send
        </button>
        <button onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
