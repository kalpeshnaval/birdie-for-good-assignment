"use client";

import { useActionState } from "react";

import { resendConfirmationAction } from "@/app/_actions/auth";
import { Button } from "@/components/ui";

type AuthState = {
  message?: string;
};

const initialState: AuthState = {};

export function ResendConfirmationForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendConfirmationAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="email" value={email} />
      {state.message ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Resending..." : "Resend confirmation"}
      </Button>
    </form>
  );
}
