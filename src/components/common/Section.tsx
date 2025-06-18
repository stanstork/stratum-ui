import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import { ReactNode, ReactElement, useState } from "react";

interface SectionProps {
    title: string;
    icon: ReactElement<any>;
    children: ReactNode;
    initialOpen?: boolean;
    topRightContent?: ReactNode;
}

const Section = ({ title, icon, children, initialOpen = true, topRightContent }: SectionProps) => {
    const [isOpen, setIsOpen] = useState(initialOpen);
    return (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-xl shadow-lg shadow-slate-900/5">
            <div className="flex items-center justify-between p-4"><button className="flex items-center font-semibold text-slate-800 dark:text-slate-200" onClick={() => setIsOpen(!isOpen)}>{React.cloneElement(icon, { className: "text-cyan-500" })}<span className="ml-3 text-base">{title}</span></button><div className="flex items-center space-x-4">{topRightContent}<button onClick={() => setIsOpen(!isOpen)}>{isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}</button></div></div>
            {isOpen && <div className="p-4 pt-0">{children}</div>}
        </div>
    );
};

export default Section;