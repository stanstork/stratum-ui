import { ChevronsUpDown } from 'lucide-react';
import React, { ReactNode } from 'react';

interface SelectProps {
    label: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    children: ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, value, onChange, children }) => {
    return (
        <div className="w-full relative">
            {label && <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>} <select value={value} onChange={onChange} className="w-full p-2 pr-8 bg-slate-50 dark:bg-slate-700/50 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-shadow appearance-none"> {children} </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 pt-5">
                <ChevronsUpDown size={16} />
            </div>
        </div>
    );
}

export default Select;