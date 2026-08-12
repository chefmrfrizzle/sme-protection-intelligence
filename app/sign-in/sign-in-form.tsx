"use client";

import { useState, type FormEvent } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignInForm({
  confirmationError,
}: {
  confirmationError: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    confirmationError ? "error" : "idle",
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ email });
      setStatus(error ? "error" : "sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form className="sign-in-card" onSubmit={submit}>
      <span className="sign-in-icon" aria-hidden="true">
        <ShieldCheck size={24} />
      </span>
      <p className="eyebrow">Optional saved workspace</p>
      <h1>Sign in to save review activity</h1>
      <p>
        The public synthetic demo works without an account. Sign in only when
        you want review and report receipts saved to the protected database.
      </p>
      <label htmlFor="workspace-email">Email address</label>
      <input
        id="workspace-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
      />
      <button className="button primary full" disabled={status === "sending"}>
        <Mail size={16} />
        {status === "sending"
          ? "Sending secure link…"
          : "Email me a sign-in link"}
      </button>
      {status === "sent" ? (
        <p className="form-success" role="status">
          Check your inbox and open the secure link in this browser.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="form-error" role="alert">
          The sign-in link could not be completed. Use the email connected to
          the Supabase project or try again.
        </p>
      ) : null}
      <small>No password is stored by this application.</small>
    </form>
  );
}
