import { ReactNode } from "react";

interface ConfigSectionProps {
    title: ReactNode;
    icon?: ReactNode;
    children: ReactNode;
}

const ConfigSection = ({ title, icon, children }: ConfigSectionProps) => (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4 first:border-t-0 first:mt-0 first:pt-0">
        <h3 className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200 mb-3">{icon}{title}</h3>
        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">{children}</div>
    </div>
);

export default ConfigSection;