import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useRef, useEffect } from "react";
import {
    ArrowLeft,
    Play,
    Pause,
    Square,
    RefreshCw,
    Download,
    Database,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Activity,
    BarChart3,
    FileText,
    Zap,
    Search,
    ArrowDown,
    FileCode,
    Webhook,
    Server,
    Container,
    CheckCircle2,
    Loader,
    ArrowRight,
    Timer
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { JobExecution } from "../../types/JobExecution";
import { JobDefinition } from "../../types/JobDefinition";
import apiClient from "../../services/apiClient";
import { MigrateItem } from "../../types/MigrationConfig";
import { Button } from "../../components/common/v2/Button";
import { Badge } from "../../components/common/v2/Badge";
import { cn } from "../../utils/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/common/v2/Card";
import { Progress } from "../../components/common/v2/Progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/common/v2/Tabs";
import { motion } from "framer-motion";

interface ExecutionMetrics {
    recordsProcessed: number;
    recordsTotal: number;
    tablesProcessed: number;
    tablesTotal: number;
    dataTransferred: string;
    throughput: string;
    errorCount: number;
    warningCount: number;
}

const cleanAnsi = (text: string) => {
    const ansiRegex = /\u001b\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g;
    return text.replace(ansiRegex, '');
};

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

    const highlightSearch = (text: string) => {
        if (!logSearch.trim()) return text;
        const regex = new RegExp(`(${logSearch})`, 'gi');
        return text.split(regex).map((part, i) =>
            regex.test(part)
                ? <mark key={i} className="bg-yellow-300 dark:bg-yellow-500/50 text-black dark:text-white">{part}</mark>
                : part
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm h-[550px] flex flex-col">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><FileCode size={18} />Execution Logs</h2>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search logs..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="pl-9 pr-3 py-1.5 text-sm w-48 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none">
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
                                <span>{highlightSearch(log.message)}</span>
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

export default function ExecutionDetails() {
    const { runId } = useParams<{ runId: string }>();
    const [execution, setExecution] = useState<JobExecution | null>(null);
    const [definition, setDefinition] = useState<JobDefinition | null>(null);
    const [migrationConfig, setMigrationConfig] = useState<MigrateItem | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!runId) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const execData = await apiClient.getJobExecution(runId);
                if (cancelled) return;
                const defData = await apiClient.getJobDefinition(execData.jobDefinitionId);
                if (cancelled) return;
                const migrationItem = JSON.parse(defData.ast).migration.migrate_items[0];
                setExecution(execData);
                setDefinition(defData);
                setMigrationConfig(migrationItem);
            } catch (e) {
                console.error(e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [runId]);


    // Interactive logs state
    const [logFilter, setLogFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const getBytesTransferredText = () => {
        const bytes = execution?.bytesTransferred ?? 0;
        if (bytes >= 1024 ** 3) {
            return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
        } else if (bytes >= 1024 ** 2) {
            return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
        } else if (bytes >= 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        } else {
            return `${bytes} bytes`;
        }
    };

    const mockMetrics: ExecutionMetrics = {
        recordsProcessed: execution?.recordsProcessed ?? 0,
        recordsTotal: 5095149,
        tablesProcessed: 2,
        tablesTotal: 2,
        dataTransferred: getBytesTransferredText(),
        throughput: "N/A",
        errorCount: 0,
        warningCount: 0
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "succeeded":
                return <CheckCircle className="text-green-600 dark:text-green-400" size={20} />;
            case "failed":
                return <XCircle className="text-red-600 dark:text-red-400" size={20} />;
            case "running":
                return <Activity className="text-blue-600 dark:text-blue-400 animate-pulse" size={20} />;
            default:
                return <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "succeeded":
                return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
            case "failed":
                return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
            case "running":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
            default:
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
        }
    };

    const formatDuration = (start?: Date, end?: Date) => {
        if (!start || !end) return 'N/A';
        const diff = end.getTime() - start.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = ((diff % 60000) / 1000).toFixed(0);
        return `${minutes}m ${seconds}s`;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!execution) {
        return (
            <div className="text-center py-12">
                <XCircle className="mx-auto text-slate-400 mb-4" size={48} />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Execution Not Found
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    The requested migration execution could not be found.
                </p>
                <Link to="/executions">
                    <Button>
                        <ArrowLeft className="mr-2" size={16} />
                        Back to Executions
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="execution-details">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/executions">
                        <Button variant="ghost" size="sm" data-testid="button-back">
                            <ArrowLeft className="mr-2" size={16} />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center space-x-3 mb-1">
                            {getStatusIcon(execution.status)}
                            <h1 className="text-[24px] font-bold leading-tight text-slate-900 dark:text-white">
                                {execution.id}
                            </h1>
                            <Badge className={cn("text-xs", getStatusColor(execution.status))}>
                                {execution.status.toUpperCase()}
                            </Badge>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
                            Started {execution.runStartedAt ? formatDistanceToNow(new Date(execution.runStartedAt), { addSuffix: true }) : 'Unknown'}
                            {execution.runCompletedAt && (
                                <span> • Completed {formatDistanceToNow(new Date(execution.runCompletedAt), { addSuffix: true })}</span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm" data-testid="button-download-logs">
                        <Download className="mr-2" size={16} />
                        Download Logs
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-refresh">
                        <RefreshCw className="mr-2" size={16} />
                        Refresh
                    </Button>
                    {execution.status === "running" && (
                        <>
                            <Button variant="outline" size="sm" data-testid="button-pause">
                                <Pause className="mr-2" size={16} />
                                Pause
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600" data-testid="button-stop">
                                <Square className="mr-2" size={16} />
                                Stop
                            </Button>
                        </>
                    )}
                    {execution.status === "paused" && (
                        <Button size="sm" data-testid="button-resume">
                            <Play className="mr-2" size={16} />
                            Resume
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Records Processed</CardTitle>
                        <BarChart3 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {mockMetrics.recordsProcessed.toLocaleString()}
                        </div>
                        {/* <p className="text-xs text-slate-600 dark:text-slate-400">
                            of N/A total
                        </p>
                        <Progress
                            value={(mockMetrics.recordsProcessed / mockMetrics.recordsTotal) * 100}
                            className="mt-2"
                        /> */}
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Data Transferred</CardTitle>
                        <Database className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {mockMetrics.dataTransferred}
                        </div>
                        {/* <p className="text-xs text-slate-600 dark:text-slate-400">
                            Throughput: {mockMetrics.throughput}
                        </p> */}
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Duration</CardTitle>
                        <Timer className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatDuration(execution?.runStartedAt, execution?.runCompletedAt)}
                        </div>
                        {/* <p className="text-xs text-slate-600 dark:text-slate-400">
                            Time taken for this run
                        </p> */}
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Issues</CardTitle>
                        <Zap className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {mockMetrics.errorCount + mockMetrics.warningCount}
                        </div>
                        {/* <p className="text-xs text-slate-600 dark:text-slate-400">
                            {mockMetrics.errorCount} errors, {mockMetrics.warningCount} warnings
                        </p> */}
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Information */}
            <Tabs defaultValue="logs" className="space-y-6">
                <TabsList
                    className={cn(
                        "w-fit rounded-xl bg-slate-100 dark:bg-slate-800 p-1",
                        "border border-slate-200 dark:border-slate-700"
                    )}
                >
                    {[
                        { value: "logs", label: "Execution Logs" },
                        { value: "metrics", label: "Metrics" },
                        // { value: "config", label: "Configuration" },
                    ].map(({ value, label }) => (
                        <TabsTrigger
                            key={value}
                            value={value}
                            data-testid={`tab-${value}`}
                            className={cn(
                                "px-3.5 text-sm font-medium rounded-xl transition-all",
                                "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
                                "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900",
                                "data-[state=active]:text-slate-900 dark:data-[state=active]:text-white",
                                "data-[state=active]:shadow-sm"
                            )}
                        >
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="logs">
                    <LogPanel logs={cleanAnsi(execution.logs ?? "")} />
                </TabsContent>

                <TabsContent value="metrics">
                    <div>
                        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                            <CardHeader>
                                <CardTitle>Performance Metrics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Average Throughput</span>
                                    <span className="font-medium">N/A</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Data Transferred</span>
                                    <span className="font-medium">N/A</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Records per Second</span>
                                    <span className="font-medium">N/A</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Peak Memory Usage</span>
                                    <span className="font-medium">N/A</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                            <CardHeader>
                                <CardTitle>Table Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">orders</p>
                                            <p className="text-xs text-slate-500">1,847,293 records</p>
                                        </div>
                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                            Completed
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">order_items</p>
                                            <p className="text-xs text-slate-500">3,247,856 records</p>
                                        </div>
                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                            Completed
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card> */}
                    </div>
                </TabsContent>

                {/* <TabsContent value="config">
                </TabsContent> */}
            </Tabs>
        </div>
    );
}