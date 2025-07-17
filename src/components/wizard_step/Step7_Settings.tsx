import { MigrateItem, MigrationConfig, MigrationSettings } from "../../types/MigrationConfig";
import Card from "../common/v2/Card";
import CardHeader from "../common/v2/CardHeader";
import Input from "../common/v2/Input";
import Select from "../common/v2/Select";
import ToggleSwitch from "../common/v2/ToggleSwitch";

type Step6SettingsProps = {
    config: MigrationConfig;
    migrateItem: MigrateItem;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
};

const Step7_Settings = ({ config, setConfig, migrateItem }: Step6SettingsProps) => {
    const { settings } = migrateItem;
    const updateSetting = <K extends keyof MigrationSettings>(key: K, value: MigrationSettings[K]) => {
        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            newConfig.migration.migrateItems[0].settings[key] = value;
            return newConfig;
        });
    };

    return (
        <Card>
            <CardHeader title="Migration Settings" subtitle="Specify advanced options for the migration process." />
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Behavior</h3>
                        <ToggleSwitch label="Infer Schema" enabled={settings.inferSchema} setEnabled={(val) =>
                            updateSetting('inferSchema', val)} />
                        <ToggleSwitch label="Create Missing Tables" enabled={settings.createMissingTables} setEnabled={(val) =>
                            updateSetting('createMissingTables', val)} />
                        <ToggleSwitch label="Ignore Constraints" enabled={settings.ignoreConstraints} setEnabled={(val) =>
                            updateSetting('ignoreConstraints', val)} />
                        <ToggleSwitch label="Create Missing Columns" enabled={settings.createMissingColumns} setEnabled={(val) =>
                            updateSetting('createMissingColumns', val)} />
                    </div>
                    <div className="space-y-6">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Performance</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                Copy Columns
                            </label>
                            <Select
                                value={settings.copyColumns}
                                onChange={(e) => updateSetting('copyColumns', e.target.value)}
                                options={[
                                    { value: 'All', label: 'All Columns' },
                                    { value: 'MapOnly', label: 'Mapped Columns Only' }
                                ]}
                                placeholder="Choose columns to copy"
                            />
                        </div>
                        <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Batch Size</label><Input type="number" value={settings.batchSize.toString()} onChange={(e) => updateSetting('batchSize', parseInt(e.target.value, 10) || 0)} /></div>
                    </div>
                </div>
            </div>
        </Card>

    );
};

export default Step7_Settings;