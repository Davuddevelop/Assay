import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
  Active voice, always. Labels read "Connect repo", never "Submit".
  Restraint: the primary action is a gold hairline that fills on hover —
  the only place we lean on the accent.
*/
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border border-gold text-ivory hover:bg-gold-soft hover:text-onyx hover:border-gold-soft",
        ghost:
          "border border-transparent text-ivory-dim hover:text-ivory hover:border-line",
        danger:
          "border border-oxblood text-ivory hover:bg-oxblood hover:text-ivory",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  className?: string;
};

type ButtonAsButton = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = ButtonBaseProps &
  Omit<React.ComponentProps<typeof Link>, "className"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Button renders a real `<button>`, or a Next `<Link>` when given an `href`,
 * so calls-to-action stay semantic without an extra Slot dependency.
 */
export function Button({ className, variant, size, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (typeof props.href === "string") {
    return <Link className={classes} {...(props as ButtonAsLink)} />;
  }

  return <button className={classes} {...(props as ButtonAsButton)} />;
}

export { buttonVariants };
