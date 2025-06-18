import React from "react";

interface TextareaProps {
    label?: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
    placeholder?: string;
    readOnly?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({
    label,
    value,
    onChange,
    placeholder,
    readOnly = false,
}) => (
    <div className="w-full">
        {label && (
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {label}
            </label>
        )}
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            rows={3}
            className={`w-full p-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-shadow ${readOnly
                ? "text-slate-500 dark:text-slate-400 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                : "dark:text-slate-200"
                }`}
        />
    </div>
);

export default Textarea;