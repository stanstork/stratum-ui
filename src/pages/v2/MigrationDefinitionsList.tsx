import { ArrowRight, Plus } from "lucide-react";
import Button from "../../components/common/v2/Button";
import Card from "../../components/common/v2/Card";
import CardHeader from "../../components/common/v2/CardHeader";
import { JobDefinition } from "../../types/JobDefinition";
import { useEffect, useState } from "react";
import apiClient from "../../services/apiClient";
import { Spinner } from "../../components/common/Helper";

type MigrationDefinitionsListProps = {
    setView: (view: string, options?: Record<string, any>) => void;
};

const MigrationDefinitionsList = ({ setView }: MigrationDefinitionsListProps) => {
    const [definitions, setDefinitions] = useState<JobDefinition[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.getJobDefinitions().then((data) => {
            setDefinitions(data);
            setLoading(false);
        });
    }, []);

    return (
        loading ? <Spinner /> : (
            <>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Migration Definitions</h1>
                    </div>
                    <Button onClick={() => setView('wizard')}><Plus size={16} className="mr-2" />Create New Definition</Button>
                </div>
                <Card>
                    <CardHeader title="All Definitions" subtitle="Manage and view your saved migration configurations." />
                    <div className="p-2">
                        <table className="w-full text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase"><tr><th className="p-4">Name</th><th className="p-4">Source & Destination</th><th className="p-4">Descrition</th></tr></thead>
                            <tbody className="text-sm">
                                {definitions.map(def => {
                                    const sourceConn = def.sourceConnection;
                                    const destConn = def.destinationConnection;
                                    return (
                                        <tr key={def.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => setView('definitionDetails', { defId: def.id })}>
                                            <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{def.name}</td>
                                            <td className="p-4"><div className="flex items-center gap-2"><span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{sourceConn?.name}</span><ArrowRight size={14} className="text-slate-400 dark:text-slate-500" /><span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{destConn?.name}</span></div></td>
                                            <td className="p-4"><code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{def.description}</code></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </>
        )
    );
};

export default MigrationDefinitionsList;