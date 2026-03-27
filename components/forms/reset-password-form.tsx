"use client";

import { useActionState } from "react";

import { resetPasswordAction } from "@/app/_actions/auth";
import { Button } from "@/components/ui";

type AuthState = {
  message?: string;
};

const initialState: AuthState = {};

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-[var(--color-ink)]">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-semibold text-[var(--color-ink)]">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
        />
      </div>
      {state.message ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Updating password..." : "Save new password"}
      </Button>
    </form>
  );
}
