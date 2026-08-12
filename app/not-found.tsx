import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state">
      <span className="empty-icon">?</span>
      <h1>Page not found</h1>
      <p>The requested synthetic assessment page does not exist.</p>
      <Link className="button primary" href="/overview">
        Return to overview
      </Link>
    </div>
  );
}
