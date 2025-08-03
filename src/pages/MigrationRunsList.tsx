import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    RefreshCw,
    XCircle,
    Loader,
    Eye,
    Settings,
    Download,
    Search,
    Database,
    FileText,
    Webhook,
    Container,
    Server,
    CalendarDays,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Make sure to install react-router-dom
import apiClient from '../services/apiClient'; // Assuming you have this
import { JobDefinition } from '../types/JobDefinition'; // Using provided interfaces
import { JobExecution } from '../types/JobExecution';


const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'succeeded':
            return <CheckCircle2 size={24} className="text-green-500" />;
        case 'failed':
            return <XCircle size={24} className="text-red-500" />;
        case 'running':
            return <Loader size={24} className="animate-spin text-blue-500" />;
        case 'pending':
            return <Clock size={24} className="text-yellow-500" />;
        default:
            return <Clock size={24} className="text-slate-500" />;
    }
};

const statusStripeColor = (status: string) => {
    switch (status) {
        case 'succeeded': return 'bg-green-500';
        case 'failed': return 'bg-red-500';
        case 'running': return 'bg-blue-500';
        default: return 'bg-slate-500';
    }
};

const StatusBadge = ({ status }: { status: string }) => {
    const baseClasses = "px-2 py-0.5 rounded text-xs font-semibold";
    switch (status) {
        case 'succeeded': return <span className={`${baseClasses} bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300`}>{status}</span>;
        case 'failed': return <span className={`${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300`}>{status}</span>;
        case 'running': return <span className={`${baseClasses} bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300`}>{status}</span>;
        case 'pending': return <span className={`${baseClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300`}>{status}</span>;
        default: return <span className={`${baseClasses} bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300`}>{status}</span>;
    }
};

const ConnectionIcon = ({ type, className }: { type: string | undefined, className?: string }) => {
    const iconType = type?.toLowerCase() || '';

    switch (iconType) {
        case 'mysql':
        case 'postgresql':
        case 'pg':
            return <Database className={className} />;
        case 'csv':
        case 'json':
        case 'file':
            return <FileText className={className} />;
        case 'api':
            return <Webhook className={className} />;
        case 'nosql':
        case 'mongodb':
            return <Container className={className} />;
        default:
            return <Server className={className} />;
    }
};

const MigrationRunCard = ({ run, definition }: { run: JobExecution; definition?: JobDefinition }) => {
    const navigate = useNavigate();
    // const progress = run.recordsTotal ? (run.recordsProcessed / run.recordsTotal) * 100 : 0;

    const formatDuration = (start?: Date, end?: Date) => {
        if (!start) return 'N/A';
        const endDate = end || new Date();
        const diff = endDate.getTime() - start.getTime();
        const minutes = Math.floor(diff / 60000);
        return `${minutes} min`;
    };

    return (
        <motion.div
            variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
            className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative"
        >
            {/* Status Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusStripeColor(run.status)}`}></div>

            {/* Header Zone */}
            <div className="pl-8 pr-6 py-6 border-b border-slate-200 dark:border-slate-700/60">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <StatusIcon status={run.status} />
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{definition?.name || 'Unknown Definition'}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Run #{run.id}</p>
                        </div>
                        <StatusBadge status={run.status} />

                    </div>
                    <div className="flex justify-end items-center gap-2">
                        <button onClick={() => navigate(`/executions/${run.id}`)} className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-md transition-colors" aria-label="View run details"><Eye size={16} /></button>
                        {/* <button className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-md transition-colors" aria-label="Configuration"><Settings size={16} /></button>
                        <button className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-md transition-colors" aria-label="Download logs"><Download size={16} /></button> */}
                    </div>
                </div>
            </div>

            {/* Details Zone */}
            <div className="pl-8 pr-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300 truncate">
                    <span className="font-medium text-slate-500 dark:text-slate-400 w-24 inline-block flex-shrink-0">Source:</span>
                    <ConnectionIcon type={definition?.sourceConnection?.dataFormat} className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{definition?.sourceConnection?.name}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300"><span className="font-medium text-slate-500 dark:text-slate-400 w-24 inline-block">Started:</span> {run.runStartedAt?.toLocaleString()}</p>
                <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300 truncate">
                    <span className="font-medium text-slate-500 dark:text-slate-400 w-24 inline-block flex-shrink-0">Destination:</span>
                    <ConnectionIcon type={definition?.destinationConnection?.dataFormat} className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{definition?.destinationConnection?.name}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300"><span className="font-medium text-slate-500 dark:text-slate-400 w-24 inline-block">Duration:</span> {formatDuration(run.runStartedAt, run.runCompletedAt)}</p>
            </div>

            {/* Progress Zone */}
            {/* <div className="pl-8 pr-6 pb-6">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>{run.recordsProcessed?.toLocaleString()} / {run.recordsTotal?.toLocaleString()} records</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                        className={`h-2.5 rounded-full ${run.status === 'Failed' ? 'bg-red-500' : 'bg-green-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                    >
                    </motion.div>
                </div>
            </div> */}
        </motion.div>
    );
};

const MigrationRunsList = () => {
    const [executions, setExecutions] = useState<JobExecution[]>([]);
    const [definitions, setDefinitions] = useState<{ [key: string]: JobDefinition }>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        setLoading(true);
        apiClient.getJobExecutions().then((data) => {
            setExecutions(data);
            setLoading(false);
        }).catch((error) => {
            console.error('Failed to fetch job executions:', error);
            setLoading(false);
        }).then(() => {
            // Fetch definitions after executions are loaded
            return apiClient.getJobDefinitions();
        }).then((defs) => {
            const defsMap: { [key: string]: JobDefinition } = {};
            defs.forEach(def => {
                defsMap[def.id] = def;
            });
            setDefinitions(defsMap);
        }).catch((error) => {
            console.error('Failed to fetch job definitions:', error);
        });
    }, []);

    const groupedExecutions = useMemo(() => {
        const filtered = executions
            .filter(run => {
                const definition = definitions[run.jobDefinitionId];
                if (!definition) return false;
                return definition.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .filter(run => {
                if (statusFilter === 'All') return true;
                if (statusFilter === 'Running') return run.status === 'running';
                return run.status === statusFilter;
            });

        return filtered.reduce((acc, run) => {
            const date = run.runStartedAt?.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }) || 'Unknown Date';
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(run);
            return acc;
        }, {} as Record<string, JobExecution[]>);
    }, [executions, definitions, searchTerm, statusFilter]);

    if (loading) {
        return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-indigo-500" size={32} /></div>;
    }

    return (
        <div className="space-y-8">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">Migration History</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">View and manage your database migration history</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search migrations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        <option>All</option>
                        <option>Completed</option>
                        <option>Running</option>
                        <option>Failed</option>
                    </select>
                </div>
            </div>

            {/* Runs List */}
            <div className="space-y-8">
                {Object.keys(groupedExecutions).length > 0 ? (
                    Object.entries(groupedExecutions).map(([date, runs]) => (
                        <div key={date}>
                            <div className="sticky top-0 z-10 py-3 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 shadow-sm">
                                    <CalendarDays size={16} className="text-slate-400" />
                                    <span>{date}</span>
                                </div>
                            </div>
                            <motion.div
                                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                                initial="hidden"
                                animate="visible"
                                className="space-y-6 pt-4"
                            >
                                {runs.map((run) => (
                                    <MigrationRunCard key={run.id} run={run} definition={definitions[run.jobDefinitionId]} />
                                ))}
                            </motion.div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                        <h3 className="text-lg font-semibold">No Matching Runs Found</h3>
                        <p className="mt-2 text-sm">Adjust your search or filter criteria to find what you're looking for.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MigrationRunsList;
