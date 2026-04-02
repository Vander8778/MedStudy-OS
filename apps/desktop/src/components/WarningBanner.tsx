export function WarningBanner({
  title,
  message
}: {
  title: string;
  message: string;
}) {
  return (
    <section
      style={{
        padding: "1rem",
        borderRadius: "1rem",
        background: "#fef3f2",
        border: "1px solid #fecdca",
        color: "#b42318"
      }}
    >
      <strong>{title}</strong>
      <p style={{ marginBottom: 0 }}>{message}</p>
    </section>
  );
}
