"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application boundary error", error.message);
  }, [error]);
  return (
    <div className="empty-state">
      <span className="empty-icon">!</span>
      <h1>We could not load this assessment view</h1>
      <p>No assessment state was changed. Try loading the view again.</p>
      <button className="button primary" type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
