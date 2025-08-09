import React from 'react';

interface InputProps {
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
    className?: string;
    type?: string;
    disabled?: boolean;
    step?: string; // Optional for number inputs
    id?: string;
}

const Input: React.FC<InputProps> = ({ value, onChange, placeholder, className = '', type = 'text', disabled = false, step = 'any' }) => (
    <input step={step} disabled={disabled} type={type} value={value} onChange={onChange} placeholder={placeholder} className={`w-full bg-white/80 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg py-2.5 px-3 text-slate-700 dark:text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 ${className}`} />
);

export default Input;