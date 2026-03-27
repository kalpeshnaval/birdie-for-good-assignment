"use client";

import { useActionState } from "react";

import { signupAction } from "@/app/_actions/auth";
import type { Charity } from "@/lib/types";
import { Button } from "@/components/ui";

type AuthState = {
  message?: string;
};

const initialState: AuthState = {};

export function SignupForm({ charities }: { charities: Charity[] }) {
  const [state, action, pending] = useActionState(signupAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-semibold text-[var(--color-ink)]">
            Full name
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-[var(--color-ink)]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-[var(--color-ink)]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="plan" className="text-sm font-semibold text-[var(--color-ink)]">
            Plan
          </label>
          <select
            id="plan"
            name="plan"
            defaultValue="yearly"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
          >
            <option value="monthly">Monthly - $29</option>
            <option value="yearly">Yearly - $290</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="charityPercentage" className="text-sm font-semibold text-[var(--color-ink)]">
            Charity contribution
          </label>
          <input
            id="charityPercentage"
            name="charityPercentage"
            type="number"
            defaultValue={10}
            min={10}
            max={80}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="charityId" className="text-sm font-semibold text-[var(--color-ink)]">
          Choose your charity
        </label>
        <select
          id="charityId"
          name="charityId"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-moss)]"
        >
          {charities.map((charity) => (
            <option key={charity.id} value={charity.id}>
              {charity.name} - {charity.location}
            </option>
          ))}
        </select>
      </div>
      {state.message ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account..." : "Create subscription account"}
      </Button>
    </form>
  );
}
