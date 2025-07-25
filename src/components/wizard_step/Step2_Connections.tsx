import { AlertCircle, ArrowRight, CheckCircle2, Plus, RefreshCw, XCircle } from "lucide-react";
import { emptyMigrationConfig, getConnectionInfo, MigrationConfig } from "../../types/MigrationConfig";
import { useEffect, useState } from "react";
import { Connection, emptyConnection, StatusType } from "../../types/Connection";
import apiClient from "../../services/apiClient";
import Button from "../common/v2/Button";
import ConnectionCard from "../ConnectionCard";
import { DatabaseIcon } from "../common/Helper";

const colorStyles: { [key: string]: { bg: string, icon: string } } = {
    mysql: { bg: 'bg-green-100 dark:bg-green-900/50', icon: 'text-green-600 dark:text-green-400' },
    pg: { bg: 'bg-blue-100 dark:bg-blue-900/50', icon: 'text-blue-600 dark:text-blue-400' },
    snowflake: { bg: 'bg-cyan-100 dark:bg-cyan-900/50', icon: 'text-cyan-600 dark:text-cyan-400' },
    default: { bg: 'bg-slate-200 dark:bg-slate-700', icon: 'text-slate-600 dark:text-slate-200' }
};

const MigrationSummaryStatus = ({ sourceStatus, destStatus }: { sourceStatus: StatusType, destStatus: StatusType }) => {
    let text, Icon, colorClasses;
    if (sourceStatus === 'invalid' || destStatus === 'invalid') {
        text = 'Connection Failed'; Icon = XCircle; colorClasses = 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10';
    } else if (sourceStatus === 'testing' || destStatus === 'testing') {
        text = 'Verifying...'; Icon = RefreshCw; colorClasses = 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/10 animate-spin';
    } else if (sourceStatus === 'untested' || destStatus === 'untested') {
        text = 'Verification Needed'; Icon = AlertCircle; colorClasses = 'text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700/50';
    } else {
        text = 'Connections Verified'; Icon = CheckCircle2; colorClasses = 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10';
    }
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${colorClasses}`}>
            <Icon size={16} className={text === 'Verifying...' ? 'animate-spin' : ''} />
            <span>{text}</span>
        </div>
    );
};

const SummaryConnectionLabel = ({ label, type, connectionName }: { label: string, type: string | null, connectionName: string }) => {
    const styles = colorStyles[type?.toLowerCase() || 'default'] || colorStyles.default;
    return (
        <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg ${styles.bg}`}>
                <DatabaseIcon type={type} className={`w-6 h-6 ${styles.icon}`} />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                <p className="font-bold text-slate-800 dark:text-slate-100">{connectionName}</p>
            </div>
        </div>
    );
};


interface Step2ConnectionsProps {
    config: MigrationConfig;
    setConfig: (config: MigrationConfig) => void;
}

const Step2_Connections = ({ config, setConfig }: Step2ConnectionsProps) => {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);

    const onSourceChange = (value: string) => {
        const selectedConn = connections.find(conn => conn.id === value) || emptyConnection();
        setConfig({
            ...config,
            connections: { ...config.connections, source: getConnectionInfo(selectedConn) },
            migration: { ...config.migration, migrateItems: [{ ...emptyMigrationConfig().migration.migrateItems[0] }] }
        });
    };

    const onDestinationChange = (value: string) => {
        const selectedConn = connections.find(conn => conn.id === value) || emptyConnection();
        setConfig({ ...config, connections: { ...config.connections, dest: getConnectionInfo(selectedConn) } });
    };

    useEffect(() => {
        const fetchConnections = async () => {
            setLoading(true);
            try {
                const fetchedConnections = await apiClient.listConnections();
                setConnections(fetchedConnections);
            } catch (error) {
                console.error("Failed to fetch connections:", error);
            } finally {
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

    const renderConnectionList = (type: 'source' | 'destination') => {
        const isSource = type === 'source';
        const title = isSource ? "Source Database" : "Destination Database";
        const connectionList = isSource ? connections : destinationOptions;
        const selectedId = isSource ? config.connections.source.id : config.connections.dest.id;
        const handleChange = isSource ? onSourceChange : onDestinationChange;
        const iconColor = isSource ? "text-green-500" : "text-blue-500";

        return (
            <div className="p-6 rounded-xl w-full border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-3 mb-5">
                    <DatabaseIcon type={isSource ? "mysql" : "pg"} className={`w-6 h-6 ${iconColor}`} />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                </div>
                <div className="space-y-4 min-h-[150px]">
                    {connectionList.length > 0 ? connectionList.map(conn => (
                        <ConnectionCard
                            key={`${type}-${conn.id}`}
                            connection={conn}
                            isSelected={selectedId === conn.id}
                            status={conn.status || 'untested'}
                            onSelect={() => handleChange(conn.id)}
                            onTest={(e) => { e.stopPropagation(); console.log(`Testing ${conn.name}`) }}
                        />
                    )) : <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-10">No available connections.</p>
                    }
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                <p className="ml-4 text-slate-500 dark:text-slate-400">Loading connections...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Connections</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Select the source and destination databases for the migration.
                    </p>
                </div>
                <Button variant="outline">
                    <Plus size={16} className="mr-2" /> Add New Connection
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderConnectionList('source')}
                <div className={`transition-opacity duration-500 ${sourceSelected ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    {renderConnectionList('destination')}
                </div>
            </div>

            {sourceSelected && destinationSelected && (
                <section>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Connection Summary</h2>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <SummaryConnectionLabel label="Source" type={config.connections.source.dataFormat} connectionName={config.connections.source.name} />
                            <ArrowRight size={20} className="text-slate-400 dark:text-slate-500" />
                            <SummaryConnectionLabel label="Destination" type={config.connections.dest.dataFormat} connectionName={config.connections.dest.name} />
                        </div>
                        <MigrationSummaryStatus sourceStatus={config.connections.source.status} destStatus={config.connections.dest.status} />
                    </div>
                </section>
            )}
        </div>
    );
};

export default Step2_Connections;
