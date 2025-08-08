import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../../utils/utils";

export const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                // Keep shadcn tokens available, but tune styles to our new UI language
                default:
                    // Token-based default for areas still using CSS variables
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive:
                    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
                outline:
                    // Matches table chrome/borders used in Runs/Definitions
                    "border border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60",
                secondary:
                    // Neutral filled button used in subdued contexts
                    "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
                ghost:
                    // Used for icon-only row actions and subtle CTAs
                    "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60",
                link:
                    "text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400",
                primary:
                    // Primary CTA used across pages (matches view-toggle active styling)
                    "bg-slate-900 text-white hover:bg-slate-900/90 dark:bg-white dark:text-slate-900 hover:dark:bg-white/90 focus-visible:ring-slate-900/40 dark:focus-visible:ring-white/50 shadow-sm hover:shadow-md",
                subtle:
                    // Soft background, great for toolbar buttons
                    "bg-slate-50 text-slate-900 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-700/60",
                success:
                    "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
                warning:
                    "bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
                xs: "h-8 rounded-md px-2.5 text-xs",
            },
            shape: {
                default: "rounded-md",
                pill: "rounded-full",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
            shape: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, shape, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };