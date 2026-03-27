"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type FormSubmitButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> & {
  idleLabel: ReactNode;
  pendingLabel?: ReactNode;
};

export function FormSubmitButton({
  idleLabel,
  pendingLabel,
  className,
  disabled,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={pending}
      data-pending={pending ? "true" : "false"}
      className={cn(
        "inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {pending ? pendingLabel ?? idleLabel : idleLabel}
    </button>
  );
}
