import { FileText } from "lucide-react";
import { MigrationConfig } from "../../types/MigrationConfig";
import Input from "../common/Input";
import { Label } from "../common/v2/Label";

type Step1DetailsProps = {
    config: MigrationConfig;
    setConfig: (config: MigrationConfig) => void;
};

export default function Step1_Details({ config, setConfig }: Step1DetailsProps) {
    const nameId = "migration-name";
    const descId = "migration-description";
    const nameEmpty = !config.name?.trim();

    return (
        <div className="space-y-8">
            {/* Section header */}
            <div className="flex items-start gap-3">
                <FileText size={18} className="mt-0.5 text-slate-500 dark:text-slate-400" />
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Migration details</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Give your migration a clear name and short description.
                    </p>
                </div>
            </div>

            {/* Fields */}
            <div className="grid gap-6">
                {/* Name */}
                <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                        <Label htmlFor={nameId} className="text-sm font-medium">
                            Name <span className="text-rose-500">*</span>
                        </Label>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Required</span>
                    </div>
                    <Input
                        id={nameId}
                        value={config.name}
                        onChange={(e) => setConfig({ ...config, name: e.target.value })}
                        placeholder="e.g., Orders DB → Warehouse (nightly)"
                        className="w-full"
                        aria-invalid={nameEmpty}
                        aria-describedby={nameEmpty ? `${nameId}-help` : undefined}
                    />
                    <p
                        id={`${nameId}-help`}
                        className={`text-xs ${nameEmpty ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}
                    >
                        {nameEmpty ? "Name is required to continue." : "Use a short, descriptive label."}
                    </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor={descId} className="text-sm font-medium">
                        Description
                    </Label>
                    <textarea
                        id={descId}
                        value={config.description}
                        onChange={(e) => setConfig({ ...config, description: e.target.value })}
                        placeholder="Purpose, scope, and any important context for this migration…"
                        className="w-full bg-white/80 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-slate-700 dark:text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 min-h-[120px]"
                        rows={4}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Optional, but helpful for teammates.</p>
                </div>
            </div>
        </div>
    );
}
