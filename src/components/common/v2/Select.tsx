import * as React from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import {
    useFloating,
    offset,
    flip,
    shift,
    size as floatingSize,
    autoUpdate,
    FloatingPortal,
} from "@floating-ui/react";
import { cn } from "../../../utils/utils";

type SelectCtx = {
    value: any;
    onChange: (v: any) => void;
    register: (value: any, label: string) => void;
    labelFor: (value: any) => string | undefined;
    setReference: (node: HTMLElement | null) => void;
    setFloating: (node: HTMLElement | null) => void;
    floatingStyles: React.CSSProperties;
    open: boolean;
};

const SelectContext = React.createContext<SelectCtx | null>(null);
const useSelectCtx = () => {
    const ctx = React.useContext(SelectContext);
    if (!ctx) throw new Error("Select subcomponents must be used inside <Select>");
    return ctx;
};

function extractText(node: React.ReactNode): string | undefined {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) {
        for (const child of node) {
            const res = extractText(child);
            if (res) return res;
        }
    }
    if (React.isValidElement(node)) return extractText((node as any).props?.children);
    return undefined;
}

export function Select({ value, onValueChange, disabled, children, className }: {
    value: any;
    onValueChange: (v: any) => void;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    const [registry, setRegistry] = React.useState<Record<string, string>>({});
    const register = React.useCallback((val: any, label: string) => {
        const key = String(val);
        setRegistry((prev) => (prev[key] ? prev : { ...prev, [key]: label }));
    }, []);
    const labelFor = React.useCallback((val: any) => registry[String(val)], [registry]);

    const { refs, floatingStyles, update } = useFloating({
        placement: "bottom-start",
        middleware: [
            offset(6),
            flip(),
            shift({ padding: 8 }),
            floatingSize({
                apply({ elements, availableHeight }) {
                    Object.assign(elements.floating.style, {
                        width: `${elements.reference.getBoundingClientRect().width}px`,
                        maxHeight: `${Math.min(availableHeight, 320)}px`,
                    });
                },
            }),
        ],
    });

    const [open, setOpen] = React.useState(false);

    return (
        <SelectContext.Provider
            value={{
                value,
                onChange: onValueChange,
                register,
                labelFor,
                setReference: refs.setReference,
                setFloating: refs.setFloating,
                floatingStyles,
                open,
            }}
        >
            <div className={cn("relative inline-block w-full", className)}>
                <Listbox value={value} onChange={onValueChange} disabled={disabled}>
                    {({ open: isOpen }) => (
                        <>
                            <SelectOpenEffect isOpen={isOpen} setOpen={setOpen} refs={refs} update={update} />
                            {children}
                        </>
                    )}
                </Listbox>
            </div>
        </SelectContext.Provider>
    );
}

function SelectOpenEffect({ isOpen, setOpen, refs, update }: { isOpen: boolean; setOpen: (v: boolean) => void; refs: any; update: any }) {
    React.useEffect(() => {
        setOpen(isOpen);
        if (!isOpen || !refs.reference.current || !refs.floating.current) return;
        return autoUpdate(refs.reference.current, refs.floating.current, update);
    }, [isOpen, setOpen, refs, update]);
    return null;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Listbox.Button> & { invalid?: boolean }>(
    ({ className, children, invalid, ...props }, ref) => {
        const { setReference } = useSelectCtx();
        return (
            <Listbox.Button
                ref={(node) => {
                    setReference(node as any);
                    if (typeof ref === "function") ref(node as any);
                    else if (ref) (ref as any).current = node;
                }}
                className={cn(
                    "flex w-full items-center justify-between rounded-md h-11 px-3 text-left",
                    "border-2 border-slate-200 dark:border-slate-700 bg-transparent",
                    "hover:border-blue-300 dark:hover:border-blue-600",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                    invalid && "!border-red-400 focus:ring-red-500/20",
                    className
                )}
                {...props}
            >
                <div className="min-w-0 flex-1 truncate">
                    {typeof children === "function" ? children({
                        disabled: false,
                        invalid: false,
                        hover: false,
                        focus: false,
                        autofocus: false,
                        open: false,
                        active: false,
                        value: undefined
                    }) : children}
                </div>
                <ChevronDown className="ml-2 shrink-0" />
            </Listbox.Button>
        );
    }
);
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder = "Select…", className }: { placeholder?: string; className?: string }) {
    const { value, labelFor } = useSelectCtx();
    const label = labelFor?.(value);
    return <span className={cn("truncate", !label && "text-slate-400", className)}>{label ?? placeholder}</span>;
}

export function SelectContent({ className, children }: { className?: string; children: React.ReactNode }) {
    const { setFloating, floatingStyles, open } = useSelectCtx();
    return (
        <FloatingPortal>
            <Transition
                show={open}
                as={React.Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <Listbox.Options
                    ref={setFloating as any}
                    style={floatingStyles}
                    className={cn(
                        "z-50 max-h-64 w-[var(--radix-select-trigger-width,theme(width.full))] overflow-auto",
                        "rounded-md border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800",
                        "shadow-lg focus:outline-none p-1",
                        className
                    )}
                >
                    {children}
                </Listbox.Options>
            </Transition>
        </FloatingPortal>
    );
}

export function SelectItem({ value, label, children, className }: { value: any; label?: string; children?: React.ReactNode; className?: string }) {
    const { register } = useSelectCtx();
    const auto = React.useMemo(() => label ?? extractText(children) ?? String(value), [label, children, value]);
    React.useEffect(() => {
        register(value, auto);
    }, [register, value, auto]);

    return (
        <Listbox.Option
            value={value}
            className={({ active }) =>
                cn(
                    "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2",
                    active ? "bg-slate-100 dark:bg-slate-700/60" : "",
                    className
                )
            }
        >
            {({ selected }) => (
                <>
                    <span className={cn("truncate flex-1", selected && "font-medium")}>{children ?? auto}</span>
                    {selected ? <Check className="h-4 w-4" /> : null}
                </>
            )}
        </Listbox.Option>
    );
}
