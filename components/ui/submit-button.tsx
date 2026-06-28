"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

/**
 * A form submit button that reflects the server action's pending state — shows
 * a spinner and disables itself while submitting, so the user always sees that
 * something is happening (no dead clicks). Must live inside a <form>.
 */
export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  size = "md",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending}
      aria-busy={pending}
      className={cn("relative", className)}
    >
      {pending ? (
        <>
          <Spinner />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
