import { ArrowRight, CheckCircle2, DatabaseIcon, Plus } from "lucide-react";
import { emptyMigrationConfig, getConnectionInfo, MigrationConfig } from "../../types/MigrationConfig";
import Card from "../common/v2/Card";
import CardHeader from "../common/v2/CardHeader";
import Select from "../common/v2/Select";
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
        <Card>
            <CardHeader title="Connections" subtitle="Select the source and destination databases for the migration." />
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        <p className="ml-3 text-slate-500 dark:text-slate-400">Loading connections...</p>
                    </div>
                ) : (
                    // <div className="flex flex-col md:flex-row items-center gap-6">
                    //     <div className="w-full md:w-1/2">
                    //         <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Source Connection</label>
                    //         <Select
                    //             value={config.connections.source.id}
                    //             onChange={e => onSourceChange(e.target.value)}
                    //             options={connectionOptions}
                    //             placeholder="Select a source..."
                    //         />
                    //     </div>
                    //     <div className="hidden md:flex items-center pt-8 text-slate-400 dark:text-slate-500"><ArrowRight size={24} /></div>
                    //     <div className="w-full md:w-1/2">
                    //         <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Destination Connection</label>
                    //         <Select
                    //             value={config.connections.dest.id}
                    //             onChange={e => onDestinationChange(e.target.value)}
                    //             options={connectionOptions}
                    //             placeholder="Select a destination..."
                    //             disabled={!config.connections.source.id}
                    //         />
                    //     </div>
                    // </div>
                    <div className="space-y-12 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl">
                        {/* Source Selection */}
                        <section>
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Source Connection</h2>
                                <Button variant="outline"><Plus size={16} className="mr-2" /> Add Connection</Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {connections.map(conn => (
                                    <ConnectionCard
                                        key={`source-${conn.id}`}
                                        connection={conn}
                                        isSelected={config.connections.source.id === conn.id}
                                        onClick={() => onSourceChange(conn.id)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Destination Selection */}
                        <section className={`transition-opacity duration-500 ${sourceSelected ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Destination Connection</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {destinationOptions.map(conn => (
                                    <ConnectionCard
                                        key={`dest-${conn.id}`}
                                        connection={conn}
                                        isSelected={config.connections.dest.id === conn.id}
                                        onClick={() => onDestinationChange(conn.id)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Migration Summary */}
                        {sourceSelected && destinationSelected && (
                            <section className="pt-6 border-t border-slate-200 dark:border-slate-700/50">
                                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-5">Migration Summary</h2>
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
                                                <DatabaseIcon type={config.connections.source.dataFormat} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-100">{config.connections.source.name}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{config.connections.source.database}</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={24} className="text-slate-400 dark:text-slate-500" />
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
                                                <DatabaseIcon type={config.connections.dest.dataFormat} />
                                            </div>
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
        </Card>
    );
};

export default Step2_Connections;
