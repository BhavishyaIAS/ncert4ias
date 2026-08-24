"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";

/**
 * Sign in / sign up, bhavishya theme. Uses the same server actions as the
 * classic forms — no auth logic is touched here, only the presentation.
 */
export function BhavishyaAuthForm({
  mode,
  next,
}: {
  mode: "signin" | "signup";
  next: string;
}) {
  const signingIn = mode === "signin";
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signingIn ? signIn : signUp,
    {},
  );

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="bh-eyebrow">
          {signingIn ? "Welcome back" : "Get started"}
        </p>
        <hr className="bh-rule mt-4 w-12" />
        <h1 className="bh-h2 mt-5">
          {signingIn ? "Sign in" : "Create an account"}
        </h1>
        <p className="bh-note mt-2">
          {signingIn
            ? "Pick up where you left off."
            : "Free, and takes a moment."}
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

        <div className="bh-field">
          <label className="bh-label" htmlFor="email">
            Email
          </label>
          <input
            className="bh-input"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>

        <div className="bh-field">
          <label className="bh-label" htmlFor="password">
            Password
          </label>
          <input
            className="bh-input"
            id="password"
            name="password"
            type="password"
            required
            autoComplete={signingIn ? "current-password" : "new-password"}
          />
        </div>

        {state.error && (
          <p className="bh-formerror" role="alert">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="bh-formerror" role="status">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bh-btn bh-btn-primary mt-1 w-full"
        >
          {pending
            ? signingIn
              ? "Signing in…"
              : "Creating your account…"
            : signingIn
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <p className="bh-note">
        {signingIn ? "No account yet? " : "Already have an account? "}
        <Link
          href={signingIn ? "/signup" : "/login"}
          className="font-medium underline underline-offset-4"
        >
          {signingIn ? "Create one" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
