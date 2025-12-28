import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        ssr: "border-transparent bg-ssr text-ssr-foreground hover:bg-ssr/80",
        sr: "border-transparent bg-sr text-sr-foreground hover:bg-sr/80",
        r: "border-transparent bg-r text-r-foreground hover:bg-r/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
