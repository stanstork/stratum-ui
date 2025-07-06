import { MigrationConfig } from "../../types/MigrationConfig";
import Card from "../common/v2/Card";
import CardHeader from "../common/v2/CardHeader";
import Input from "../common/v2/Input";

type Step1DetailsProps = {
    config: MigrationConfig
    setConfig: (config: MigrationConfig) => void;
};

const Step1_Details = ({ config, setConfig }: Step1DetailsProps) => {
    return (
        <Card>
            <CardHeader title="Migration Details" subtitle="Give your migration a unique name and a description." />
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Migration Name</label>
                    <Input
                        value={config.name}
                        onChange={e => setConfig({ ...config, name: e.target.value })}
                        placeholder="e.g., Nightly User Sync"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Description</label>
                    <textarea
                        value={config.description}
                        onChange={e => setConfig({ ...config, description: e.target.value })}
                        placeholder="A brief description of what this migration does."
                        className="w-full bg-white/80 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg py-2.5 px-3 text-slate-700 dark:text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 min-h-[100px]"
                    />
                </div>
            </div>
        </Card>
    );
};

export default Step1_Details;