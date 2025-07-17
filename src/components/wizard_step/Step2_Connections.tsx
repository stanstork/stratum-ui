import { ArrowRight } from "lucide-react";
import { emptyMigrationConfig, getConnectionInfo, MigrationConfig } from "../../types/MigrationConfig";
import Card from "../common/v2/Card";
import CardHeader from "../common/v2/CardHeader";
import Select from "../common/v2/Select";
import { useEffect, useState } from "react";
import { Connection, emptyConnection } from "../../types/Connection";
import apiClient from "../../services/apiClient";

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
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-full md:w-1/2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Source Connection</label>
                            <Select
                                value={config.connections.source.id}
                                onChange={e => onSourceChange(e.target.value)}
                                options={connectionOptions}
                                placeholder="Select a source..."
                            />
                        </div>
                        <div className="hidden md:flex items-center pt-8 text-slate-400 dark:text-slate-500"><ArrowRight size={24} /></div>
                        <div className="w-full md:w-1/2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Destination Connection</label>
                            <Select
                                value={config.connections.dest.id}
                                onChange={e => onDestinationChange(e.target.value)}
                                options={connectionOptions}
                                placeholder="Select a destination..."
                                disabled={!config.connections.source.id}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default Step2_Connections;
