import { Settings, Info, Database } from "lucide-react";
import { MigrateItem, MigrationConfig, MigrationSettings } from "../../types/MigrationConfig";
import Input from "../common/Input";
import Select from "../common/Select";
import ToggleSwitch from "../common/ToggleSwitch";
import Tooltip from "../common/Tooltip";

type Step7SettingsProps = {
    config: MigrationConfig;
    migrateItem: MigrateItem;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
};

const SettingsPanel: React.FC<{ title: string; description: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ title, description, icon, children }) => (
    <div className="dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/60 h-fit">
        <div className="flex items-start gap-4 mb-6">
            <div className="text-slate-500 dark:text-slate-400 mt-1">{icon}</div>
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            </div>
        </div>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

const LabeledControl: React.FC<{ label: string; description: string; children: React.ReactNode; tooltip?: string; }> = ({ label, description, children, tooltip }) => (
    <div className="border-b border-slate-200 dark:border-slate-700/60 py-4 last:border-b-0">
        <div className="flex justify-between items-start">
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <label className="block font-medium text-slate-800 dark:text-slate-100">
                        {label}
                    </label>
                    {tooltip && <Tooltip text={tooltip} />}
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            </div>
            <div className="mt-1 ml-6 flex-shrink-0">
                {children}
            </div>
        </div>
    </div>
);


const Step7_Settings = ({ config, setConfig, migrateItem }: Step7SettingsProps) => {
    const { settings } = migrateItem;

    const updateSetting = <K extends keyof MigrationSettings>(key: K, value: MigrationSettings[K]) => {
        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            if (!newConfig.migration.migrateItems || newConfig.migration.migrateItems.length === 0) {
                return currentConfig;
            }
            newConfig.migration.migrateItems[0].settings[key] = value;
            return newConfig;
        });
    };

    const copyColumnsDescription = settings.copyColumns === 'MapOnly'
        ? "Only columns that have been explicitly mapped will be created."
        : "All source columns (mapped and unmapped) will be created in the destination.";

    return (
        <>
            {/* Section Intro */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Migration Settings</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Specify advanced options for the migration process.
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="pt-8 border-slate-200 dark:border-slate-700/60">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SettingsPanel title="Schema Options" description="Control how schema differences are handled during migration." icon={<Settings size={24} />}>
                        <LabeledControl label="Infer Schema" description="Infer schema with all relations." tooltip="Automatically infers the schema of the source table and all related tables (including recursive relations), generating foreign key relationships where detected.">
                            <ToggleSwitch enabled={settings.inferSchema} setEnabled={(val) => updateSetting('inferSchema', val)} />
                        </LabeledControl>
                        <LabeledControl label="Cascade Schema" description="Cascade schema to related tables." tooltip="Copies data from all related tables detected during schema inference.">
                            <ToggleSwitch enabled={settings.cascadeSchema} setEnabled={(val) => updateSetting('cascadeSchema', val)} />
                        </LabeledControl>
                        <LabeledControl label="Create Missing Tables" description="Create tables if they don't exist." tooltip="If the target table is not found in the destination, it will be created.">
                            <ToggleSwitch enabled={settings.createMissingTables} setEnabled={(val) => updateSetting('createMissingTables', val)} />
                        </LabeledControl>
                        <LabeledControl label="Create Missing Columns" description="Add missing columns automatically." tooltip="If a column from the source doesn't exist in the destination, it will be added.">
                            <ToggleSwitch enabled={settings.createMissingColumns} setEnabled={(val) => updateSetting('createMissingColumns', val)} />
                        </LabeledControl>
                        <LabeledControl label="Ignore Constraints" description="Skip constraint validation." tooltip="Disables foreign key checks during the data loading process. Recommended for initial loads.">
                            <ToggleSwitch enabled={settings.ignoreConstraints} setEnabled={(val) => updateSetting('ignoreConstraints', val)} />
                        </LabeledControl>
                    </SettingsPanel>

                    <SettingsPanel title="Data Options" description="Configure how data is processed and transferred." icon={<Database size={24} />}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <label className="block font-medium text-slate-800 dark:text-slate-100">Copy Columns</label>
                                <Tooltip text="Choose whether to copy all source columns or only those explicitly defined in the mapping step." />
                            </div>
                            <Select
                                value={settings.copyColumns}
                                onChange={(e) => updateSetting('copyColumns', e.target.value)}
                                options={[
                                    { value: 'All', label: 'All Columns' },
                                    { value: 'MapOnly', label: 'Mapped Columns Only' }
                                ]}
                                placeholder="Choose columns to copy"
                            />
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{copyColumnsDescription}</p>
                        </div>
                        <div className="mt-6 pt-6">
                            <div className="flex items-center gap-2 mb-1">
                                <label className="block font-medium text-slate-800 dark:text-slate-100">Batch Size</label>
                                <Tooltip text="Number of records to process in a single batch. Affects memory usage and performance." />
                            </div>
                            <Input
                                type="number"
                                value={settings.batchSize.toString()}
                                onChange={(e) => updateSetting('batchSize', parseInt(e.target.value, 10) || 0)}
                                placeholder="e.g., 1000"
                            />
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Recommended: 1000-5000 records per batch for optimal performance.</p>
                        </div>
                        {/* <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/60">
                            <h4 className="font-semibold text-sm mb-3 text-slate-700 dark:text-slate-200">Performance Tips</h4>
                            <ul className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400 list-disc pl-5">
                                <li>Larger batch sizes improve speed but use more memory.</li>
                                <li>Enable "Ignore Constraints" for faster initial migration.</li>
                                <li>Use "Mapped Columns Only" to reduce data transfer.</li>
                            </ul>
                        </div> */}
                    </SettingsPanel>
                </div>
            </div>
        </>
    );
};

export default Step7_Settings;
