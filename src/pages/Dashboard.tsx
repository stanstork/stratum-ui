import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { JobExecution } from "../types/JobExecution";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ExecutionStat } from "../types/ExecutionStat";
import apiClient from "../services/apiClient";
import { CheckCircle, Clock, Database, DatabaseIcon, FileText, Plug, Plus, Server, TrendingUp, XCircle } from "lucide-react";
import { Button } from "../components/common/v2/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/v2/Card";
import { Connection } from "../types/Connection";
import { Badge } from "../components/common/v2/Badge";
import { cn } from "../utils/utils";
import MigrationChart from "../components/MigrationChart";
import { getConnectionIcon } from "../components/common/Helper";

type ChartDataItem = { name: string; Succeeded: number; Failed: number; Running: number };
type Stats = {
    totalExecutions: number;
    successRate: string; // percentage as string
    inProgress: number;
    totalDefs: number;
    chartData: ChartDataItem[];
};

const dataFormatLabels: { [key: string]: string } = {
    mysql: 'MySQL',
    pg: 'PostgreSQL',
    snowflake: 'Snowflake',
    sqlite: 'SQLite',
    mongodb: 'MongoDB',
    oracle: 'Oracle',
    mssql: 'Microsoft SQL Server'
};

export default function Dashboard() {
    const [recentExecutions, setRecentExecutions] = useState<JobExecution[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalExecutions: 0,
        successRate: '0.00',
        inProgress: 0,
        totalDefs: 0,
        chartData: [],
    });
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { theme } = useTheme();

    useEffect(() => {
        const processData = (stat: ExecutionStat) => {
            const chartData = [] as Array<ChartDataItem>;
            for (let offset = stat.perDay.length - 1; offset >= 0; offset--) {
                console.log(`Processing day ${offset} with date ${stat.perDay[offset].day}`);
                const bucket = new Date(stat.perDay[offset].day);

                // Label for the X-axis
                const name = bucket.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                }); // e.g. "Jun 12"

                // Tally statuses
                const succeeded = stat.perDay[offset].succeeded;
                const failed = stat.perDay[offset].failed;
                const running = stat.perDay[offset].running;

                chartData.push({ name, Succeeded: succeeded, Failed: failed, Running: running });
            }

            setStats({
                totalExecutions: stat.total,
                successRate: stat.successRate.toFixed(2),
                inProgress: stat.running,
                totalDefs: stat.totalDefinitions,
                chartData,
            });
        };

        const fetchData = async () => {
            try {
                const [executions, stats, connections] = await Promise.all([apiClient.getJobExecutions(), apiClient.getExecutionStats(), apiClient.listConnections()]);
                setRecentExecutions(executions.slice(0, 10));
                processData(stats);
                setConnections(connections);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const getStatusBadgeClasses = (status: string) => {
        switch (status) {
            case "succeeded":
                return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
            case "failed":
                return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
            case "running":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
            default:
                return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
        }
    };

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case "valid":
                return "connection-indicator-success";
            case "untested":
                return "connection-indicator-warning";
            case "invalid":
            case "disconnected":
                return "connection-indicator-error";
            default:
                return "connection-indicator-error";
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
            <div className="space-y-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8" data-testid="dashboard-page">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[32px] font-bold leading-tight text-slate-900 dark:text-white" data-testid="dashboard-title">
                        Dashboard
                    </h1>
                    <p className="mt-3 text-slate-700 dark:text-slate-300">
                        Overview of your data migration activities
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    {!user?.isViewerOnly && (
                        <Link to="/wizard">
                            <Button className="flex items-center space-x-2" variant="primary">
                                <Plus size={16} />
                                <span>New Migration</span>
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="metrics-cards">
                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-400">Total Definitions</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2" data-testid="metric-total-definitions">
                                    {stats?.totalDefs?.toLocaleString() || "0"}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <FileText className="text-blue-700 dark:text-blue-300" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-400">Success Rate</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2" data-testid="metric-success-rate">
                                    {stats?.successRate || "0.00"}%
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <CheckCircle className="text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-400">Data Processed</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2" data-testid="metric-data-processed">
                                    {"0TB"}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <DatabaseIcon className="text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-400">Active Connections</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2" data-testid="metric-active-connections">
                                    {connections.length || "0"}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                <Plug className="text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-8">
                <MigrationChart isDarkMode={theme === "dark"} chartData={stats.chartData} />
            </div>

            {/* Recent Activity and Connections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Migrations */}
                <div className="lg:col-span-2">
                    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                        <CardHeader className="border-b border-gray-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-[20px] font-semibold">Recent Migrations</CardTitle>
                                <Button variant="link" size="sm" data-testid="link-view-all-migrations">
                                    View all
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4" data-testid="recent-migrations-list">
                                {recentExecutions?.slice(0, 3).map((run) => (
                                    <div key={run.id} className="flex items-center space-x-4">
                                        <StatusIcon status={run.status} />
                                        <div className="flex-1" data-testid={`migration-run-${run.id}`}>
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-slate-900 dark:text-white">
                                                    Migration Run
                                                </h4>
                                                <Badge className={cn("text-xs font-semibold", getStatusBadgeClasses(run.status))}>
                                                    {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Definition ID: {run.jobDefinitionId}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                                Started: {run.runStartedAt ? new Date(run.runStartedAt).toLocaleString() : 'N/A'} •
                                                Duration: {formatDuration(run.runStartedAt ? new Date(run.runStartedAt) : undefined, run.runCompletedAt ? new Date(run.runCompletedAt) : undefined)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Active Connections */}
                    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                        <CardHeader className="border-b border-gray-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-[20px] font-semibold">Active Connections</CardTitle>
                                <Button variant="link" size="sm" data-testid="link-manage-connections">
                                    Manage
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3" data-testid="active-connections-list">
                                {connections?.slice(0, 3).map((connection) => (
                                    <div key={connection.id} className="flex items-center justify-between" data-testid={`connection-${connection.id}`}>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                {getConnectionIcon(connection.dataFormat)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {connection.name}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {connection.host}:{connection.port} ({dataFormatLabels[connection.dataFormat] || connection.dataFormat})
                                                </p>
                                            </div>
                                        </div>
                                        <div className={getStatusIndicator(connection.status)}></div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}

type StatusIconProps = {
    status: string;
};

const StatusIcon = ({ status }: StatusIconProps) => {
    switch (status) {
        case 'succeeded': return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
        case 'running': return <Clock className="w-5 h-5 text-blue-500 animate-spin" style={{ animationDuration: '2s' }} />;
        default: return <Clock className="w-5 h-5 text-slate-500" />;
    }
}
