import { ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

type SelectProps = {
    options: Option[];
    value: string;
    onChange: React.ChangeEventHandler<HTMLSelectElement>;
    placeholder: string;
    disabled?: boolean;
    className?: string;
};

const Select: React.FC<SelectProps> = ({ options, value, onChange, placeholder, disabled = false, className = '' }) => (
    <div className="relative w-full">
        <select value={value} onChange={onChange} disabled={disabled} className={`w-full appearance-none bg-white/80 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg py-2.5 px-3 text-slate-700 dark:text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 ${disabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed' : ''} ${className}`}>
            <option value="" disabled>{placeholder}</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400"><ChevronDown size={18} /></div>
    </div>
);

export default Select;