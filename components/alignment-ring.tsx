export function AlignmentRing({
  value,
  size = "large",
}: {
  value: number;
  size?: "large" | "small";
}) {
  return (
    <div
      className={`alignment-ring ${size}`}
      style={{ "--alignment": `${value * 3.6}deg` } as React.CSSProperties}
      role="img"
      aria-label={`${value}% evidence-aligned`}
    >
      <div className="alignment-ring-inner">
        <strong>{value}%</strong>
        <span>evidence-aligned</span>
      </div>
    </div>
  );
}
