export default function Loading() {
  return (
    <div className="page-stack" aria-live="polite" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="metric-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="skeleton skeleton-card" key={index} />
        ))}
      </div>
    </div>
  );
}
