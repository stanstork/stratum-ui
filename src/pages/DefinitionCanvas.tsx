import { Database, FileJson, FileText } from "lucide-react";
import Section from "../components/common/Section";
import JobDetailsEditor from "../components/JobDetailsEditor";
import { useNavigate } from "react-router-dom";
import ConnectionEditor, { ConnectionPair } from "../components/ConnectionEditor";
import { useCallback, useEffect, useState } from "react"; // Removed unused 'use' import
import { Connection } from "../types/Connection";
import apiClient from "../services/apiClient";
import { Spinner } from "../components/common/Helper";
import MigrationItemEditor from "../components/MigrationItemEditor";
import FloatingActionButton from "../components/common/FloatingActionButton";
import { emptyMigrationConfig, emptyMigrationItem, MigrateItem, MigrationConfig } from "../types/MigrationConfig";
import { TableMetadata } from "../types/Metadata";
import { a } from "framer-motion/dist/types.d-B_QPEvFK";


const DefinitionCanvas = () => {
    const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
    const [config, setConfig] = useState<MigrationConfig>(emptyMigrationConfig());
    const [loading, setLoading] = useState(true);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [metadata, setMetadata] = useState<{ [key: string]: TableMetadata }>({});
    const navigate = useNavigate();

    const handleConnectionsChange = useCallback((newConnections: ConnectionPair) => {
        setConfig(p => ({ ...p, connections: newConnections }));
    }, []);

    const handleDetailChange = useCallback((field: string, value: string): void => {
        setConfig(p => ({ ...p, [field]: value }));
        console.log(`Detail changed: ${field} = ${value}`);
    }, []);

    const handleMigrationItemsChange = useCallback(
        (newItems: MigrateItem[]) =>
            setConfig(p => ({
                ...p,
                migration: { ...p.migration, migrateItems: newItems },
            })),
        []
    );

    const handleSingleMigrationItemChange = useCallback((updatedItem: MigrateItem) => {
        const newItems = config.migration.migrateItems.map(item =>
            item.id === updatedItem.id ? updatedItem : item
        );
        handleMigrationItemsChange(newItems);
    }, [config.migration.migrateItems, handleMigrationItemsChange]);


    const addMigrationItem = async () => {
        if (!metadata || Object.keys(metadata).length === 0) {
            const metadata = await apiClient.getMetadata(config.connections.source.id);
            setMetadata(metadata);
        }

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

    if (loading) {
        return <Spinner />;
    }

    return (
        <>
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
                    <div className="space-y-8 xl:col-span-5">
                        <Section title="Job Details" icon={<FileText size={20} />}>
                            <JobDetailsEditor name={config.name} description={config.description} creation_date={config.creation_date} onDetailChange={handleDetailChange} />
                        </Section>
                        <Section title="Connections" icon={<Database size={20} />} topRightContent={<button onClick={() => navigate('/connections')} className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">Manage</button>}>
                            <ConnectionEditor connections={connections} onConnectionsChange={handleConnectionsChange} />
                        </Section>
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Migration Tasks</h2>
                            {config.migration.migrateItems.length === 0 ? (
                                <div className="text-center py-16 bg-white/30 dark:bg-slate-800/30 backdrop-blur-lg rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                                    <p className="text-slate-500 dark:text-slate-400">No migration tasks defined.</p>
                                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Click the + button to get started.</p>
                                </div>
                            ) : (
                                config.migration.migrateItems.map((item) => (
                                    <MigrationItemEditor
                                        item={item}
                                        metadata={metadata}
                                        key={item.id.toString()}
                                        onItemChange={handleSingleMigrationItemChange}
                                        onRemoveItem={() => handleMigrationItemsChange(config.migration.migrateItems.filter(i => i.id !== item.id))}
                                        isNew={newlyAddedId === item.id.toString()}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                    <div className="sticky top-24 h-fit space-y-8 xl:col-span-5">
                        <Section title="Live Configuration JSON" icon={<FileJson size={20} />}>
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