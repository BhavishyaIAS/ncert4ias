"use client";

import { Button } from "@/components/ui/button";

/**
 * Submit button that asks for confirmation before submitting its form.
 * Used for destructive actions (delete) inside server-action forms.
 */
export function ConfirmSubmit({
  children,
  message = "Are you sure?",
  variant = "destructive",
  size = "sm",
}: {
  children: React.ReactNode;
  message?: string;
  variant?: "destructive" | "outline" | "ghost";
  size?: "sm" | "xs" | "default";
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
