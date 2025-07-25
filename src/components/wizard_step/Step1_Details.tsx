import { FileText } from "lucide-react";
import { MigrationConfig } from "../../types/MigrationConfig";
import Input from "../common/v2/Input";

type Step1DetailsProps = {
    config: MigrationConfig
    setConfig: (config: MigrationConfig) => void;
};

const Step1_Details = ({ config, setConfig }: Step1DetailsProps) => {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Migration Details</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Provide basic information about your migration project. This helps organize and track your configurations.
                    </p>
                </div>
            </div>

            {/* Section for Migration Name */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <FileText size={18} className="text-slate-500 dark:text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Migration Name <span className="text-red-500">*</span>
                    </h3>
                </div>
                <div>
                    <label htmlFor="migration-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
                    <Input
                        value={config.name}
                        onChange={e => setConfig({ ...config, name: e.target.value })}
                        placeholder="e.g., Production_OrdersDB_Migration"
                        className="w-full"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Choose a descriptive name to identify this migration project.
                    </p>
                </div>
            </div>

            {/* Section for Description */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <FileText size={18} className="text-slate-500 dark:text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Description</h3>
                </div>
                <div>
                    <label htmlFor="migration-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Project Description</label>
                    <textarea
                        id="migration-description"
                        value={config.description}
                        onChange={e => setConfig({ ...config, description: e.target.value })}
                        placeholder="Describe the purpose, scope, and any important details about this migration..."
                        className="w-full bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 rounded-lg py-2.5 px-3 text-slate-700 dark:text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 min-h-[120px]"
                        rows={4}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Provide context about what you're migrating and why.
                    </p>
                </div>
            </div>
            {/* Validation Message */}
            {!config.name && (
                <div className="flex items-center justify-center gap-2 p-3 bg-amber-100/80 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 rounded-lg text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span>Migration name is required to proceed</span>
                </div>
            )}
        </div>
    );
};

export default Step1_Details;
