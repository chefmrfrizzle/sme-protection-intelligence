"use client";

import Link from "next/link";
import { LogIn, LogOut, Save } from "lucide-react";
import { useEffect, useState } from "react";

type SessionState =
  | { loading: true; authenticated: false }
  | { loading: false; authenticated: false }
  | { loading: false; authenticated: true; email?: string };

export function AccountControl() {
  const [session, setSession] = useState<SessionState>({
    loading: true,
    authenticated: false,
  });

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((value) => {
        if (active) setSession({ loading: false, ...value });
      })
      .catch(() => {
        if (active) setSession({ loading: false, authenticated: false });
      });
    return () => {
      active = false;
    };
  }, []);

  if (session.loading) return <div className="account-placeholder" />;
  if (!session.authenticated) {
    return (
      <Link className="account-control" href="/sign-in">
        <LogIn size={15} /> Sign in to save
      </Link>
    );
  }
  return (
    <div className="account-signed-in">
      <span title={session.email}>
        <Save size={14} /> Saved workspace
      </span>
      <form action="/auth/sign-out" method="post">
        <button type="submit" aria-label="Sign out">
          <LogOut size={14} />
        </button>
      </form>
    </div>
  );
}
