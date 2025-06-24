import { Database, FileJson, FileText } from "lucide-react";
import Section from "../components/common/Section";
import JobDetailsEditor from "../components/JobDetailsEditor";
import { useNavigate } from "react-router-dom";
import ConnectionEditor from "../components/ConnectionEditor";
import { use, useCallback, useEffect, useState } from "react";
import { Connection } from "../types/Connection";
import apiClient from "../services/apiClient";
import { Spinner } from "../components/common/Helper";
import MigrationItemEditor from "../components/MigrationItemEditor";
import FloatingActionButton from "../components/common/FloatingActionButton";
import { emptyMigrationConfig, emptyMigrationItem, MigrateItem, MigrationConfig } from "../types/MigrationConfig";


const DefinitionCanvas = () => {
    const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
    const [config, setConfig] = useState<MigrationConfig>(emptyMigrationConfig());
    const [loading, setLoading] = useState(true);
    const [connections, setConnections] = useState<Connection[]>([]);
    const handleConnectionsChange = (newConnections: any) => setConfig(p => ({ ...p, connections: newConnections }));
    // const handleMigrationItemsChange = (newItems: MigrateItem[]) => setConfig(p => ({ ...p, migration: { ...p.migration, migrate_items: newItems } }));
    const navigate = useNavigate();

    function handleDetailChange(field: string, value: string): void {
        // This function should handle changes to the job details
        // For example, you might want to update the state or send it to an API
        console.log(`Detail changed: ${field} = ${value}`);
    }

    const addMigrationItem = () => {
        const newItem = emptyMigrationItem();
        handleMigrationItemsChange([...config.migration.migrateItems, newItem]);
        setNewlyAddedId(newItem.id.toString());
    };

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const connections = await apiClient.listConnections();
                setConnections(connections);
            } finally {
                setLoading(false);
            }
        }

        fetchConnections();
    }, []);


    const handleMigrationItemsChange = useCallback(
        (newItems: MigrateItem[]) =>
            setConfig(p => ({
                ...p,
                migration: { ...p.migration, migrate_items: newItems },
            })),
        [setConfig]
    );

    if (loading) {
        return <Spinner />;
    }

    return (
        <>
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
                    <div className="space-y-8 xl:col-span-5">
                        <Section title="Job Details" icon={
                            <FileText size={20} />
                        }>
                            <JobDetailsEditor name={config.name} description={config.description} creation_date={config.creation_date} onDetailChange={handleDetailChange} />
                        </Section>
                        <Section title="Connections" icon={
                            <Database size={20} />
                        } topRightContent={<button onClick={() => navigate('/connections')} className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">Manage</button>}>
                            <ConnectionEditor connections={connections} onConnectionsChange={handleConnectionsChange} />
                        </Section>
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Migration Tasks</h2>
                            {config.migration.migrateItems.length === 0 ? (
                                <div className="text-center py-16 bg-white/30 dark:bg-slate-800/30 backdrop-blur-lg rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                                    <p className="text-slate-500 dark:text-slate-400">No migration tasks defined.</p>
                                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Click the + button to get started.</p>
                                </div>
                            ) : (config.migration.migrateItems.map((item, index) => (<MigrationItemEditor />)))}
                        </div>
                    </div>
                    <div className="sticky top-24 h-fit space-y-8 xl:col-span-5">
                        <Section title="Live Configuration JSON" icon={
                            <FileJson size={20} />
                        }>
                            <pre className="font-mono bg-slate-800 text-slate-200 text-xs p-4 rounded-lg overflow-x-auto max-h-[75vh]"><code>{JSON.stringify(config, null, 2)}</code></pre>
                        </Section>
                    </div>
                </div>
            </main>
            <FloatingActionButton onClick={addMigrationItem} />
        </>
    );
}

export default DefinitionCanvas;



