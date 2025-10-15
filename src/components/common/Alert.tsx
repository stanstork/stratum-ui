import { cva, VariantProps } from "class-variance-authority"
import React from "react"
import { cn } from "../../utils/utils"

const alertVariants = cva(
    // Base styles
    "relative w-full rounded-xl border p-4 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
    {
        variants: {
            variant: {
                default:
                    "bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/60 dark:text-slate-50 [&>svg]:text-slate-500 dark:[&>svg]:text-slate-400",
                info:
                    "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800/50 dark:text-blue-200 [&>svg]:text-blue-500",
                success:
                    "bg-green-50 border-green-200 text-green-900 dark:bg-green-950/40 dark:border-green-800/50 dark:text-green-200 [&>svg]:text-green-500",
                warning:
                    "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800/50 dark:text-amber-200 [&>svg]:text-amber-500",
                destructive:
                    "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-200 [&>svg]:text-red-500",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const Alert = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
    <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
    />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
        {...props}
    />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm opacity-90 [&_p]:leading-relaxed", className)}
        {...props}
    />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }