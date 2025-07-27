import React from 'react';

interface ToggleSwitchProps {
    label?: string;
    description?: string;
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, description, enabled, setEnabled }) => {
    return (
        <div className="flex justify-between items-center">
            <div className="flex-grow">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
                {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
            <button
                type="button"
                className={`${enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-slate-800`}
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled(!enabled)}
            >
                <span
                    aria-hidden="true"
                    className={`${enabled ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
            </button>
        </div>
    );
};

export default ToggleSwitch;
