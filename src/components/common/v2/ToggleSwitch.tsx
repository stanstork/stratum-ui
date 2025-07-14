type ToggleSwitchProps = {
    label: string;
    enabled: boolean;
    setEnabled: (value: boolean) => void;
};

const ToggleSwitch = ({ label, enabled, setEnabled }: ToggleSwitchProps) => (
    <div onClick={() => setEnabled(!enabled)} className="flex items-center justify-between cursor-pointer p-4 rounded-lg bg-slate-50/70 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 transition-colors">
        <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} /></div>
    </div>
);

export default ToggleSwitch;