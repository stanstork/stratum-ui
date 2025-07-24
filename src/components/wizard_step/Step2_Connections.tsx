import { ArrowRight, CheckCircle2, DatabaseIcon, Plus } from "lucide-react";
import { emptyMigrationConfig, getConnectionInfo, MigrationConfig } from "../../types/MigrationConfig";
import { useEffect, useState } from "react";
import { Connection, emptyConnection } from "../../types/Connection";
import apiClient from "../../services/apiClient";
import Button from "../common/v2/Button";
import ConnectionCard from "../ConnectionCard";

interface Step2ConnectionsProps {
    config: MigrationConfig;
    setConfig: (config: MigrationConfig) => void;
}

const Step2_Connections = ({ config, setConfig }: Step2ConnectionsProps) => {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);

    const connectionOptions = connections.map(conn => ({
        value: conn.id,
        label: conn.name,
        description: `${conn.dataFormat} - ${conn.host}:${conn.port}`,
    }));

    const onSourceChange = (value: string) => {
        const selectedConn = connections.find(conn => conn.id === value) || emptyConnection();
        setConfig({
            ...config,
            connections: {
                ...config.connections,
                source: getConnectionInfo(selectedConn),
            },
            // Reset subsequent dependent configuration
            migration: {
                ...config.migration,
                migrateItems: [{
                    ...emptyMigrationConfig().migration.migrateItems[0],
                }]
            }
        });
    };

    const onDestinationChange = (value: string) => {
        const selectedConn = connections.find(conn => conn.id === value) || emptyConnection();
        setConfig({
            ...config,
            connections: {
                ...config.connections,
                dest: getConnectionInfo(selectedConn),
            }
        });
    };

    useEffect(() => {
        const fetchConnections = async () => {
            setLoading(true);
            try {
                const fetchedConnections = await apiClient.listConnections();
                setConnections(fetchedConnections);
            } catch (error) {
                console.error("Failed to fetch connections:", error);
                // Optionally set an error state to show in the UI
            }
            finally {
                setLoading(false);
            }
        }

        fetchConnections();
    }, []);

    const sourceSelected = config.connections.source && config.connections.source.id;
    const destinationSelected = config.connections.dest && config.connections.dest.id;

    const destinationOptions = sourceSelected
        ? connections.filter(c => c.id !== config.connections.source.id)
        : connections;

    return (
        <div>
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                    <p className="ml-4 text-slate-500 dark:text-slate-400">Loading connections...</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Source Selection */}
                    <section>
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Source Connection</h2>
                            <Button variant="outline"><Plus size={16} className="mr-2" /> Add New Connection</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {connections.map(conn => (
                                <ConnectionCard
                                    key={`source-${conn.id}`}
                                    connection={conn}
                                    isSelected={config.connections.source.id === conn.id}
                                    status={conn.status}
                                    onSelect={() => onSourceChange(conn.id)}
                                    onTest={(e) => { }}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Destination Selection */}
                    <section className={`transition-opacity duration-500 ${sourceSelected ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Destination Connection</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {destinationOptions.length > 0 ? destinationOptions.map(conn => (
                                <ConnectionCard
                                    key={`dest-${conn.id}`}
                                    connection={conn}
                                    isSelected={config.connections.dest.id === conn.id}
                                    status={conn.status || 'untested'}
                                    onSelect={() => onDestinationChange(conn.id)}
                                    onTest={(e) => { }}
                                />
                            )) : <p className="text-slate-500 dark:text-slate-400 col-span-full">Select a source connection to see available destinations.</p>}
                        </div>
                    </section>

                    {/* Migration Summary */}
                    {sourceSelected && destinationSelected && (
                        <section className="pt-8 border-t border-slate-200 dark:border-slate-700/50">
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-5">Connection Summary</h2>
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <DatabaseIcon type={config.connections.source.dataFormat} className="w-8 h-8 text-slate-700 dark:text-slate-200" />
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{config.connections.source.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{config.connections.source.database}</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={24} className="text-slate-400 dark:text-slate-500" />
                                    <div className="flex items-center gap-3">
                                        <DatabaseIcon type={config.connections.dest.dataFormat} className="w-8 h-8 text-slate-700 dark:text-slate-200" />
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{config.connections.dest.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{config.connections.dest.database}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium">
                                    <CheckCircle2 size={16} />
                                    <span>Connections Verified</span>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};

export default Step2_Connections;
