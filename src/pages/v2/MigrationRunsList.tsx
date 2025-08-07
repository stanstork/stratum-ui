import { useEffect, useState } from "react";
import { JobExecution } from "../../types/JobExecution";
import { JobDefinition } from "../../types/JobDefinition";
import apiClient from "../../services/apiClient";
import { format } from "date-fns";
import { Calendar, Eye, Search } from "lucide-react";
import { Card, CardContent } from "../../components/common/v2/Card";
import { Link } from "react-router-dom";
import { Badge } from "../../components/common/v2/Badge";
import { Button } from "../../components/common/v2/Button";
import { getConnectionIcon } from "../../components/common/Helper";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";

export default function MigrationRunsList() {
    const [executions, setExecutions] = useState<JobExecution[]>([]);
    const [definitions, setDefinitions] = useState<{ [key: string]: JobDefinition }>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "succeeded":
                return "status-success";
            case "failed":
                return "status-failed";
            case "running":
                return "status-running";
            default:
                return "status-paused";
        }
    };

    const getDefinitionName = (definitionId: string | null) => {
        if (!definitionId || !definitions[definitionId]) return "Unknown Definition";
        return definitions[definitionId].name || "Unnamed Definition";
    };

    const getSourceAndDestination = (definitionId: string | null) => {
        if (!definitionId || !definitions[definitionId]) return { source: null, destination: null };
        const definition = definitions[definitionId];
        return {
            source: definition?.sourceConnection || null,
            destination: definition?.destinationConnection || null
        };
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

    // Group runs by date
    const groupedRuns = executions?.reduce((groups: Record<string, JobExecution[]>, run) => {
        const date = run.runStartedAt ? format(new Date(run.runStartedAt), 'MMMM d, yyyy') : 'Unknown Date';
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(run);
        return groups;
    }, {}) || {};

    return (
        <div className="space-y-8" data-testid="migration-history-page">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[32px] font-bold leading-tight text-slate-900 dark:text-white" data-testid="migration-history-title">
                        Migration History
                    </h1>
                    <p className="mt-3 text-slate-700 dark:text-slate-300">
                        View and manage your database migration history
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            type="text"
                            placeholder="Search migrations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full md:w-80"
                            data-testid="search-definitions"
                        />
                    </div>

                    <Select
                        options={[
                            { label: "All", value: "all" },
                            { label: "Succeeded", value: "succeeded" },
                            { label: "Failed", value: "failed" },
                            { label: "Running", value: "running" }
                        ]}
                        value="all"
                        onChange={(value) => {
                            // Handle filter change
                        }} placeholder={""} />
                </div>
            </div>

            {/* Migration History */}
            <div className="space-y-8" data-testid="migration-history-list">
                {Object.entries(groupedRuns).map(([date, dateRuns]) => (
                    <Card key={date} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                        <CardContent className="p-6">
                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                                <Calendar className="mr-2" size={16} />
                                <span>{date}</span>
                            </div>

                            <div className="space-y-6">
                                {dateRuns.map((run) => {
                                    const { source, destination } = getSourceAndDestination(run.jobDefinitionId);

                                    return (
                                        <Link
                                            key={run.id}
                                            to={`/executions/${run.id}`}
                                            className="block"
                                        >
                                            <div
                                                className="flex items-start space-x-4 group hover:bg-slate-50 dark:hover:bg-slate-700/30 -mx-6 px-6 py-4 transition-colors cursor-pointer"
                                                data-testid={`migration-run-${run.id}`}
                                            >
                                                <div className="flex-shrink-0 mt-1">
                                                    <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${run.status === "succeeded" ? "bg-green-500" :
                                                        run.status === "failed" ? "bg-red-500" :
                                                            run.status === "running" ? "bg-blue-500 animate-pulse" : "bg-gray-500"
                                                        }`}></div>
                                                    <div className={`w-0.5 h-12 mx-auto mt-2 ${run.status === "succeeded" ? "bg-green-500" :
                                                        run.status === "failed" ? "bg-red-500" :
                                                            run.status === "running" ? "bg-blue-500" : "bg-gray-500"
                                                        }`}></div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                                {getDefinitionName(run.jobDefinitionId)}
                                                            </h4>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                Run #{run.id}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center space-x-3">
                                                            <Badge className={`${getStatusColor(run.status)} text-sm font-medium`}>
                                                                {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                                                            </Badge>
                                                            {run.status === "running" && (
                                                                <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                                    <div
                                                                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                                                        style={{ width: "65%" }}
                                                                    ></div>
                                                                </div>
                                                            )}
                                                            <Button variant="ghost" size="sm" data-testid={`button-view-run-${run.id}`}>
                                                                <Eye size={16} />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                                                        <div>
                                                            <span className="text-slate-500 dark:text-slate-400">Source:</span>
                                                            <div className="flex items-center mt-1">
                                                                {getConnectionIcon(source?.dataFormat ?? "")}
                                                                <span className="text-slate-900 dark:text-white font-medium ml-2">
                                                                    {source?.name || "Unknown Source"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 dark:text-slate-400">Destination:</span>
                                                            <div className="flex items-center mt-1">
                                                                {getConnectionIcon(destination?.dataFormat ?? "")}
                                                                <span className="text-slate-900 dark:text-white font-medium ml-2">
                                                                    {destination?.name || "Unknown Destination"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 dark:text-slate-400">Started:</span>
                                                            <p className="text-slate-900 dark:text-white font-medium mt-1">
                                                                {run.runCompletedAt && run.runStartedAt ? format(new Date(run.runStartedAt), 'M/d/yyyy, h:mm:ss a') : "Unknown"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                                                            <p className="text-slate-900 dark:text-white font-medium mt-1">
                                                                {formatDuration(run.runStartedAt ? new Date(run.runStartedAt) : undefined, run.runCompletedAt ? new Date(run.runCompletedAt) : undefined)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
