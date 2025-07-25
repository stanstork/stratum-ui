import React, { ReactNode, MouseEventHandler } from 'react';

interface ButtonProps {
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    className?: string;
    disabled?: boolean;
    title?: string;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', className = '', disabled = false, title = '' }) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-semibold text-sm inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 transform active:scale-95';
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow-md',
        secondary: 'bg-white/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 focus:ring-indigo-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        ghost: 'bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-indigo-500',
        outline: 'bg-transparent text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-indigo-500'
    };
    return <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} title={title}>{children}</button>;
};

export default Button;