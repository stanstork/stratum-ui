import * as React from "react"
import {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
} from "../common/Toast"
import { useToast } from "../hooks/use-toast"

export function Toaster({ className }: { className?: string }) {
    const { toasts } = useToast()

    return (
        <ToastProvider swipeDirection="right">
            {toasts.map(({ id, title, description, action, ...props }) => (
                <Toast key={id} {...props}>
                    <div className="grid gap-1">
                        {title ? <ToastTitle>{title}</ToastTitle> : null}
                        {description ? <ToastDescription>{description}</ToastDescription> : null}
                    </div>
                    {action}
                    <ToastClose />
                </Toast>
            ))}
            {/* Keep this above dialogs */}
            <ToastViewport className={`z-[9999] ${className ?? ""}`} />
        </ToastProvider>
    )
}
