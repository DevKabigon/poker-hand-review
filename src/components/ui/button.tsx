import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700",
        // Primary = Green
        primary:
          "bg-green-500 text-primary-foreground hover:bg-green-500/90 border-green-700 border-b-4 active:border-b-0",
        primaryOutline:
          "bg-white text-green-500 hover:bg-slate-100 dark:bg-slate-900 dark:text-green-300",
        // Secondary = Purple
        secondary:
          "bg-indigo-500 text-primary-foreground hover:bg-indigo-500/90 border-indigo-700 border-b-4 active:border-b-0",
        secondaryOutline:
          "bg-white text-indigo-500 hover:bg-slate-100 dark:bg-slate-900 dark:text-indigo-300",
        raise:
          "bg-orange-500 text-white hover:bg-orange-500/90 border-orange-700 border-b-4 active:border-b-0",
        danger:
          "bg-rose-500 text-primary-foreground hover:bg-rose-500/90 border-rose-700 border-b-4 active:border-b-0",
        dangerOutline:
          "bg-white text-rose-500 hover:bg-slate-100 dark:bg-slate-900 dark:text-rose-300",
        // Super = Blue
        super:
          "bg-sky-400 text-primary-foreground hover:bg-sky-400/90 border-sky-600 border-b-4 active:border-b-0",
        superOutline:
          "bg-white text-sky-500 hover:bg-slate-100 dark:bg-slate-900 dark:text-sky-300",
        ghost:
          "bg-transparent text-muted-foreground border-transparent border-0 hover:bg-muted/65 hover:text-foreground",
        sidebar:
          "bg-transparent text-muted-foreground border-2 border-transparent hover:bg-muted/65 hover:text-foreground transition-none",
        sidebarOutline:
          "bg-primary/12 text-primary border-primary/35 border-2 hover:bg-primary/18 transition-none",
        // Compatibility aliases for existing paths
        outline:
          "bg-white text-black border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700",
        destructive:
          "bg-rose-500 text-primary-foreground hover:bg-rose-500/90 border-rose-700 border-b-4 active:border-b-0",
        link: "bg-transparent text-primary underline-offset-4 hover:underline border-0",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
        rounded: "rounded-full",
        // Compatibility sizes
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
