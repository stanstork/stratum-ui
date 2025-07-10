import { useState } from "react";
import { TableMetadata } from "../../types/Metadata";
import { MigrateItem, MigrationConfig } from "../../types/MigrationConfig";
import AllAvailableTablesProvider from "./AllAvailableTablesProvider";
import Card from "../common/v2/Card";
import CardHeader from "../common/v2/CardHeader";
import Button from "../common/v2/Button";
import { ArrowRight, Eye, GitFork, Loader, Plus, X } from "lucide-react";
import ColumnSelector from "../common/v2/ColumnSelector";
import Input from "../common/Input";

type Step5_ColumnMappingProps = {
    config: MigrationConfig;
    migrateItem: MigrateItem;
    metadata: Record<string, TableMetadata> | null;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
};

const Step5_ColumnMapping = ({ config, migrateItem, metadata, setConfig }: Step5_ColumnMappingProps) => {
    const { mappings } = migrateItem.map || { mappings: [] };
    const [previewData, setPreviewData] = useState(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [activeTab, setActiveTab] = useState('manual');

    function updateSource(id: any, arg1: string, val: string): void {
        throw new Error("Function not implemented.");
    }

    function removeMapping(id: any): void {
        throw new Error("Function not implemented.");
    }

    function updateMapping(id: any, arg1: string, value: string): void {
        throw new Error("Function not implemented.");
    }

    return (
        <AllAvailableTablesProvider migrateItem={migrateItem} metadata={metadata}>
            {(allAvailableTables) => (
                <>
                    <Card>
                        <CardHeader
                            title="Column Mapping"
                            subtitle="Define the structure of your destination table."
                            actions={
                                <Button onClick={() => { }} variant="secondary" disabled={isLoadingPreview}>{isLoadingPreview ? <Loader size={16} className="animate-spin mr-2" /> : <Eye size={16} className="mr-2" />}Preview Data</Button>
                            }
                        />
                        <div className="px-6 pt-4 border-b border-slate-200/80 dark:border-slate-700/80">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('manual')}
                                    className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'manual'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                                        }`}
                                >
                                    Manual Mapping
                                </button>
                                <button
                                    onClick={() => setActiveTab('visual')}
                                    className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'visual'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                                        }`}
                                >
                                    Visual Builder
                                </button>
                            </nav>
                        </div>

                        {activeTab === 'manual' && (
                            <div className="p-6">
                                <div className="flex justify-end mb-6">
                                    <Button onClick={() => { }} variant="secondary"><Plus size={16} className="mr-2" /> Add Mapping</Button>
                                </div>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                        <div className="col-span-5">Source Column / Expression</div>
                                        <div className="col-span-1 text-center"></div>
                                        <div className="col-span-5">Destination Column</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    {mappings.map((map, index) => <div key={index} className={`grid grid-cols-12 gap-4 items-center p-4 rounded-lg ${index % 2 === 0 ? 'bg-slate-50/80 dark:bg-slate-700/50' : 'bg-white/80 dark:bg-slate-800/40'}`}>
                                        <div className="col-span-5">
                                            <ColumnSelector allTables={allAvailableTables} selectedTable={''} selectedColumn={''} onTableChange={(val) =>
                                                updateSource(index, 'table', val)} onColumnChange={(val) => updateSource(index, 'column', val)} />
                                        </div>
                                        <div className="col-span-1 text-center text-slate-400 dark:text-slate-500">
                                            <ArrowRight size={20} />
                                        </div>
                                        <div className="col-span-5"><Input value={''} onChange={e => updateMapping(index, 'destination', e.target.value)} placeholder="Destination column name" /></div>
                                        <div className="col-span-1 text-right">
                                            <button onClick={() =>
                                                removeMapping(index)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    )}
                                </div>

                            </div>
                        )}
                        {activeTab === 'visual' && (
                            <div className="p-6 flex items-center justify-center min-h-[400px]">
                                <div className="text-center">
                                    <div className="mx-auto bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 p-4 rounded-full w-fit mb-4">
                                        <GitFork size={48} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Visual Builder Coming Soon!</h2>
                                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                                        An interactive, node-based interface to build your transformations is on the way.
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>
                </>
            )}
        </AllAvailableTablesProvider>
    );

}

export default Step5_ColumnMapping;