import { useEffect, useState, Fragment, useRef, useMemo } from 'react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    RefreshCw,
    XCircle,
    Loader,
    Settings,
    Download,
    FileText,
    Database,
    Container,
    Webhook,
    Server,
    X,
    FileCode,
    ArrowRight,
    Timer,
    AlertTriangle,
    Search,
    ArrowDown,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Dialog, Transition } from '@headlessui/react';
import { JobDefinition } from '../types/JobDefinition';
import { JobExecution } from '../types/JobExecution';
import { MigrateItem } from '../types/MigrationConfig';
import { motion } from 'framer-motion';

const cleanAnsi = (text: string) => {
    const ansiRegex = /\u001b\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g;
    return text.replace(ansiRegex, '');
};

const ConnectionIcon = ({ type, className }: { type: string | undefined, className?: string }) => {
    const iconType = type?.toLowerCase() || '';
    switch (iconType) {
        case 'mysql': case 'postgresql': case 'pg': return <Database className={className} />;
        case 'csv': case 'json': case 'file': return <FileText className={className} />;
        case 'api': return <Webhook className={className} />;
        case 'nosql': case 'mongodb': return <Container className={className} />;
        default: return <Server className={className} />;
    }
};

const StatusBadge = ({ status }: { status: string }) => {
    const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold";
    switch (status) {
        case 'succeeded': return <div className={`${baseClasses} bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300`}><CheckCircle2 size={14} /><span>{status}</span></div>;
        case 'failed': return <div className={`${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300`}><XCircle size={14} /><span>{status}</span></div>;
        case 'running': return <div className={`${baseClasses} bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300`}><Loader size={14} className="animate-spin" /><span>Running</span></div>;
        case 'pending': return <div className={`${baseClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300`}><Clock size={14} /><span>{status}</span></div>;
        default: return <div className={`${baseClasses} bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300`}><Clock size={14} /><span>{status}</span></div>;
    }
};

const ConfigurationModal = ({ isOpen, onClose, definition, config }: { isOpen: boolean; onClose: () => void; definition: JobDefinition | null; config: MigrateItem | null }) => (
    <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="fixed inset-0 bg-black/30" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900 dark:text-slate-50 flex justify-between items-center">
                                <span>Run Configuration</span>
                                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X size={18} /></button>
                            </Dialog.Title>
                            <div className="mt-4 space-y-4 text-sm">
                                <p><span className="font-semibold text-slate-500">Job Name:</span> {definition?.name}</p>
                                <p><span className="font-semibold text-slate-500">Batch Size:</span> {config?.settings.batchSize}</p>
                                <p><span className="font-semibold text-slate-500">Primary Table:</span> {config?.source.names[0]}</p>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </Dialog>
    </Transition>
);


const LogPanel = ({ logs }: { logs?: string }) => {
    const [logSearch, setLogSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('All');
    const [autoScroll, setAutoScroll] = useState(true);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const parsedLogs = useMemo(() => {
        if (!logs) return [];
        return logs.split('\n').map((line, index) => {
            const match = line.match(/^(.+?)\s+\[?(INFO|SUCCESS|ERROR|WARN)\]?\s+(.*)/);
            if (match) {
                const timestamp = match[1];
                const level = match[2];
                const message = match[3].trim();
                return { id: index, level, message, timestamp };
            }
            return { id: index, level: '', message: line, timestamp: '' };
        }).filter(log => log.message);
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return parsedLogs.filter(log => {
            const levelMatch = levelFilter === 'All' || log.level === levelFilter;
            const searchMatch = log.message.toLowerCase().includes(logSearch.toLowerCase());
            return levelMatch && searchMatch;
        });
    }, [parsedLogs, levelFilter, logSearch]);

    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [filteredLogs, autoScroll]);

    const handleScroll = () => {
        if (logContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop <= clientHeight + 1;
            setAutoScroll(isAtBottom);
        }
    };

    const jumpToBottom = () => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
            setAutoScroll(true);
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'INFO': return 'text-blue-400';
            case 'SUCCESS': return 'text-green-400';
            case 'ERROR': return 'text-red-400';
            case 'WARN': return 'text-yellow-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm h-[550px] flex flex-col">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><FileCode size={18} />Execution Logs</h2>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search logs..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="pl-9 pr-3 py-1.5 text-sm w-48 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                    <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        <option>All</option>
                        <option>INFO</option>
                        <option>SUCCESS</option>
                        <option>ERROR</option>
                        <option>WARN</option>
                    </select>
                </div>
            </div>
            <div className="relative flex-1 bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg overflow-hidden">
                <div ref={logContainerRef} onScroll={handleScroll} className="h-full overflow-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                        {filteredLogs.map(log => (
                            <div key={log.id} className="flex gap-4">
                                <span className="text-slate-500">{log.timestamp}</span>
                                <span className={`font-bold ${getLevelColor(log.level)}`}>{log.level ? `[${log.level}]` : ''}</span>
                                <span>{log.message}</span>
                            </div>
                        ))}
                    </pre>
                </div>
                {!autoScroll && (
                    <button onClick={jumpToBottom} className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105">
                        <ArrowDown size={14} /> Jump to Bottom
                    </button>
                )}
            </div>
        </div>
    );
};

const MigrationRunDetails = () => {
    const { runId } = useParams<{ runId: string }>();
    const [execution, setExecution] = useState<JobExecution | null>(null);
    const [definition, setDefinition] = useState<JobDefinition | null>(null);
    const [migrationConfig, setMigrationConfig] = useState<MigrateItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        setTimeout(async () => {
            if (!runId) {
                setLoading(false);
                return;
            }
            const execData = await apiClient.getJobExecution(runId);
            const defData = await apiClient.getJobDefinition(execData.jobDefinitionId);
            const migrationItem = JSON.parse(defData.ast)['migration']['migrate_items'][0] as MigrateItem;

            console.log('Migration Item:', migrationItem);

            setExecution(execData);
            setDefinition(defData);
            setMigrationConfig(migrationItem);
            setLoading(false);
        }, 500);
    }, []);

    const formatDuration = (start?: Date, end?: Date) => {
        if (!start || !end) return 'N/A';
        const diff = end.getTime() - start.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = ((diff % 60000) / 1000).toFixed(0);
        return `${minutes}m ${seconds}s`;
    };

    if (loading) {
        return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-indigo-500" size={32} /></div>;
    }

    // const progress = execution?.recordsTotal ? (execution.recordsProcessed / execution.recordsTotal) * 100 : 0;

    return (
        <>
            <ConfigurationModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} definition={definition} config={null} />
            <div className="space-y-6">
                {/* --- UNIFIED HEADER --- */}
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                    <div className="flex flex-wrap gap-4 justify-between items-center pb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/executions')} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{definition?.name}</h1>
                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    <StatusBadge status={execution?.status || 'Unknown'} />
                                    <span>Run #{execution?.id}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 border border-slate-300 dark:border-slate-600 rounded-lg p-1">
                            <button onClick={() => setIsConfigOpen(true)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" aria-label="View Configuration">
                                <Settings size={18} />
                            </button>
                            <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" aria-label="Download Logs">
                                <Download size={18} />
                            </button>
                        </div>
                    </div>

                    {/* --- METRICS GRID --- */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700/60">
                        <div className="col-span-2 md:col-span-2">
                            <div className="text-sm text-slate-500 dark:text-slate-400">Connections</div>
                            <div className="flex items-center gap-2 mt-1 text-md font-semibold text-slate-700 dark:text-slate-200">
                                <ConnectionIcon type={definition?.sourceConnection.dataFormat} className="w-5 h-5" />
                                <span className="truncate">{definition?.sourceConnection.name}</span>
                                <ArrowRight size={16} className="text-slate-400 flex-shrink-0" />
                                <ConnectionIcon type={definition?.destinationConnection.dataFormat} className="w-5 h-5" />
                                <span className="truncate">{definition?.destinationConnection.name}</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Duration</div>
                            <div className="flex items-center gap-2 mt-1 text-xl font-bold text-slate-800 dark:text-slate-100">
                                <Timer size={18} />
                                {formatDuration(execution?.runStartedAt, execution?.runCompletedAt)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Records Copied</div>
                            <div className="flex items-center gap-2 mt-1 text-xl font-bold text-slate-800 dark:text-slate-100">
                                <CheckCircle2 size={18} />
                                {"N/A" /* execution?.recordsProcessed.toLocaleString() || 'N/A' */}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Errors</div>
                            <div className="flex items-center gap-2 mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                                <AlertTriangle size={18} />
                                {"N/A" /* execution?.recordsFailed.toLocaleString() || 'N/A' */}
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400 mb-1">
                                <span>Progress</span>
                                <span>{Math.floor(100)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                <motion.div className="bg-green-500 h-2.5" initial={{ width: 0 }} animate={{ width: `${100}%` }} transition={{ duration: 1, ease: 'easeInOut' }}></motion.div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <LogPanel logs={cleanAnsi(execution?.logs ?? '')} />
            </div>
        </>
    );
};

export default MigrationRunDetails;
