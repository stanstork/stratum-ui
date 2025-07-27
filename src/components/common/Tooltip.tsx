import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
    text: string;
    children?: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children || <Info size={14} className="text-slate-400 dark:text-slate-500 cursor-help" />}
            {isVisible && (
                <div
                    className="absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 transform rounded-lg bg-slate-800 px-3 py-2 text-center text-sm font-normal text-white shadow-lg transition-opacity"
                    role="tooltip"
                >
                    {text}
                    <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
                </div>
            )}
        </div>
    );
};

export default Tooltip;
