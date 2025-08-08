import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { JobExecution } from "../../types/JobExecution";
import { JobDefinition } from "../../types/JobDefinition";
import apiClient from "../../services/apiClient";
import { format } from "date-fns";
import { Calendar, Eye, Search, Rows, Columns3, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "../../components/common/v2/Card";
import { Link } from "react-router-dom";
import { Badge } from "../../components/common/v2/Badge";
import { Button } from "../../components/common/v2/Button";
import { getConnectionIcon } from "../../components/common/Helper";
import Input from "../../components/common/Input";

const PAGE_SIZE = 10 as const;

type StatusFilter = "all" | "succeeded" | "failed" | "running";

type SortKey = "id" | "definition" | "status" | "started" | "duration";

type SortDir = "asc" | "desc";

function useDebouncedValue<T>(value: T, delay: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

const StatusPill = memo(function StatusPill({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border 
        ${active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white"
                    : "bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
            aria-pressed={active}
        >
            <span>{label}</span>
            <span className="ml-2 text-xs opacity-80">{count}</span>
        </button>
    );
});

export default function MigrationRunsList() {
    const [executions, setExecutions] = useState<JobExecution[]>([]);
    const [definitions, setDefinitions] = useState<Record<string, JobDefinition>>({});
    const [loading, setLoading] = useState(true);

    // search, filters, view, sorting, pagination
    const [rawSearch, setRawSearch] = useState("");
    const searchTerm = useDebouncedValue(rawSearch, 250);

    const [status, setStatus] = useState<StatusFilter>("all");
    const [view, setView] = useState<"list" | "table">("list");

    const [page, setPage] = useState(1);
    const [sortKey, setSortKey] = useState<SortKey>("started");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    useEffect(() => {
        setLoading(true);
        apiClient
            .getJobExecutions()
            .then((data) => {
                setExecutions(data);
            })
            .catch((error) => {
                console.error("Failed to fetch job executions:", error);
            })
            .then(() => apiClient.getJobDefinitions())
            .then((defs) => {
                const map: Record<string, JobDefinition> = {};
                defs.forEach((d: JobDefinition) => (map[d.id] = d));
                setDefinitions(map);
            })
            .catch((error) => {
                console.error("Failed to fetch job definitions:", error);
            })
            .finally(() => setLoading(false));
    }, []);

    // reset to first page whenever the search/filter changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm, status]);

    const getStatusColor = (s: string) => {
        switch (s) {
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
        if (!definitionId || !definitions[definitionId]) return { source: null as any, destination: null as any };
        const def = definitions[definitionId];
        return { source: def?.sourceConnection || null, destination: def?.destinationConnection || null };
    };

    const formatDuration = (start?: Date, end?: Date) => {
        if (!start || !end) return "N/A";
        const diff = end.getTime() - start.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.max(0, Math.round((diff % 60000) / 1000));
        return `${minutes}m ${seconds}s`;
    };

    // --- Advanced search: supports e.g. "id:123", "run:123", "def:orders"; otherwise fuzzy across id + definition name ---
    const matchesQuery = useCallback(
        (run: JobExecution) => {
            const q = searchTerm.trim().toLowerCase();
            if (!q) return true;

            const defName = getDefinitionName(run.jobDefinitionId).toLowerCase();
            const runId = String(run.id).toLowerCase();

            const idMatch = q.match(/^(id|run)\s*:\s*(.+)$/i);
            const defMatch = q.match(/^(def|definition)\s*:\s*(.+)$/i);

            if (idMatch) {
                const val = idMatch[2].toLowerCase();
                return runId.includes(val);
            }
            if (defMatch) {
                const val = defMatch[2].toLowerCase();
                return defName.includes(val);
            }
            return runId.includes(q) || defName.includes(q);
        },
        [searchTerm, definitions]
    );

    const searched = useMemo(() => executions.filter(matchesQuery), [executions, matchesQuery]);

    const statusCounts = useMemo(() => {
        const base = { all: searched.length, succeeded: 0, failed: 0, running: 0 } as Record<StatusFilter, number>;
        for (const r of searched) {
            if (r.status === "succeeded") base.succeeded++;
            else if (r.status === "failed") base.failed++;
            else if (r.status === "running") base.running++;
        }
        return base;
    }, [searched]);

    const filtered = useMemo(
        () => (status === "all" ? searched : searched.filter((r) => r.status === status)),
        [searched, status]
    );

    // sorting for table view
    const sorted = useMemo(() => {
        const arr = [...filtered];
        const cmp = (a: JobExecution, b: JobExecution) => {
            let va: any, vb: any;
            switch (sortKey) {
                case "id":
                    va = String(a.id);
                    vb = String(b.id);
                    break;
                case "definition":
                    va = getDefinitionName(a.jobDefinitionId).toLowerCase();
                    vb = getDefinitionName(b.jobDefinitionId).toLowerCase();
                    break;
                case "status":
                    // custom status order: running > failed > succeeded > others
                    const order = (s: string) => (s === "running" ? 0 : s === "failed" ? 1 : s === "succeeded" ? 2 : 3);
                    va = order(a.status);
                    vb = order(b.status);
                    break;
                case "duration":
                    va = a.runStartedAt && a.runCompletedAt ? new Date(a.runCompletedAt).getTime() - new Date(a.runStartedAt).getTime() : 0;
                    vb = b.runStartedAt && b.runCompletedAt ? new Date(b.runCompletedAt).getTime() - new Date(b.runStartedAt).getTime() : 0;
                    break;
                default:
                case "started":
                    va = a.runStartedAt ? new Date(a.runStartedAt).getTime() : 0;
                    vb = b.runStartedAt ? new Date(b.runStartedAt).getTime() : 0;
            }
            if (va < vb) return sortDir === "asc" ? -1 : 1;
            if (va > vb) return sortDir === "asc" ? 1 : -1;
            return 0;
        };
        return arr.sort(cmp);
    }, [filtered, sortKey, sortDir, definitions]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pageStart = (safePage - 1) * PAGE_SIZE;
    const pageEnd = Math.min(sorted.length, pageStart + PAGE_SIZE);
    const pageItems = sorted.slice(pageStart, pageEnd);

    const pageNumbers = useMemo(() => {
        const maxToShow = 5;
        let start = Math.max(1, safePage - 2);
        let end = Math.min(totalPages, start + maxToShow - 1);
        start = Math.max(1, end - maxToShow + 1);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [safePage, totalPages]);

    const changeSort = (key: SortKey) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(key);
            setSortDir(key === "started" ? "desc" : "asc");
        }
    };

    const groupedForList = useMemo(() => {
        const groups: Record<string, JobExecution[]> = {};
        for (const run of pageItems) {
            const d = run.runStartedAt ? format(new Date(run.runStartedAt), "MMMM d, yyyy") : "Unknown Date";
            groups[d] = groups[d] || [];
            groups[d].push(run);
        }
        return groups;
    }, [pageItems]);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-1/4 mb-2" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/2" />
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6" data-testid="migration-history-page">
            {/* Header + Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-[32px] font-bold leading-tight text-slate-900 dark:text-white" data-testid="migration-history-title">
                        Migration History
                    </h1>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">View and manage your database migration history</p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            type="text"
                            placeholder="Search: id:123 • def:orders • free text"
                            value={rawSearch}
                            onChange={(e) => setRawSearch(e.target.value)}
                            className="pl-10 w-full"
                            data-testid="search-definitions"
                        />
                        {rawSearch && (
                            <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                onClick={() => setRawSearch("")}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {/* View toggle */}
                    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={() => setView("list")}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all ${view === "list" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                            aria-pressed={view === "list"}
                        >
                            <Rows size={16} /> List
                        </button>
                        <button
                            onClick={() => setView("table")}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all ${view === "table" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                            aria-pressed={view === "table"}
                        >
                            <Columns3 size={16} /> Table
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter pills + results summary */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                    <StatusPill active={status === "all"} onClick={() => setStatus("all")} label="All" count={statusCounts.all} />
                    <StatusPill active={status === "succeeded"} onClick={() => setStatus("succeeded")} label="Succeeded" count={statusCounts.succeeded} />
                    <StatusPill active={status === "failed"} onClick={() => setStatus("failed")} label="Failed" count={statusCounts.failed} />
                    <StatusPill active={status === "running"} onClick={() => setStatus("running")} label="Running" count={statusCounts.running} />
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-300">
                    Showing <span className="font-semibold">{sorted.length === 0 ? 0 : pageStart + 1}-{pageEnd}</span> of
                    <span className="font-semibold"> {searched.length}</span> matching runs
                    {status !== "all" && <> • filtered by <span className="capitalize">{status}</span></>}
                    {searchTerm && <> • query: <span className="font-mono">{searchTerm}</span></>}
                </div>
            </div>

            {/* Views */}
            <div className="relative">
                {/* List view */}
                <div className={`${view === "list" ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0"} transition-opacity duration-300`}>
                    <div className="space-y-6" data-testid="migration-history-list">
                        {Object.entries(groupedForList).map(([date, dateRuns]) => (
                            <Card key={date} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                                        <Calendar className="mr-2" size={16} />
                                        <span>{date}</span>
                                    </div>

                                    <div className="space-y-6">
                                        {dateRuns.map((run) => {
                                            const { source, destination } = getSourceAndDestination(run.jobDefinitionId);
                                            return (
                                                <Link key={run.id} to={`/executions/${run.id}`} className="block">
                                                    <div
                                                        className="flex items-start gap-4 group -mx-6 px-6 py-4 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                                        data-testid={`migration-run-${run.id}`}
                                                    >
                                                        {/* timeline rail */}
                                                        <div className="flex-shrink-0 mt-1">
                                                            <div
                                                                className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${run.status === "succeeded"
                                                                    ? "bg-green-500"
                                                                    : run.status === "failed"
                                                                        ? "bg-red-500"
                                                                        : run.status === "running"
                                                                            ? "bg-blue-500 animate-pulse"
                                                                            : "bg-gray-500"
                                                                    }`}
                                                            />
                                                            <div
                                                                className={`w-0.5 h-12 mx-auto mt-2 ${run.status === "succeeded"
                                                                    ? "bg-green-500"
                                                                    : run.status === "failed"
                                                                        ? "bg-red-500"
                                                                        : run.status === "running"
                                                                            ? "bg-blue-500"
                                                                            : "bg-gray-500"
                                                                    }`}
                                                            />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{getDefinitionName(run.jobDefinitionId)}</h4>
                                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Run #{run.id}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <Badge className={`${getStatusColor(run.status)} text-sm font-medium`}>
                                                                        {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                                                                    </Badge>
                                                                    {run.status === "running" && (
                                                                        <div className="w-28 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                                            <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: "65%" }} />
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
                                                                        <span className="text-slate-900 dark:text-white font-medium ml-2">{source?.name || "Unknown Source"}</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500 dark:text-slate-400">Destination:</span>
                                                                    <div className="flex items-center mt-1">
                                                                        {getConnectionIcon(destination?.dataFormat ?? "")}
                                                                        <span className="text-slate-900 dark:text-white font-medium ml-2">{destination?.name || "Unknown Destination"}</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500 dark:text-slate-400">Started:</span>
                                                                    <p className="text-slate-900 dark:text-white font-medium mt-1">
                                                                        {run.runStartedAt ? format(new Date(run.runStartedAt), "M/d/yyyy, h:mm:ss a") : "Unknown"}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                                                                    <p className="text-slate-900 dark:text-white font-medium mt-1">
                                                                        {formatDuration(
                                                                            run.runStartedAt ? new Date(run.runStartedAt) : undefined,
                                                                            run.runCompletedAt ? new Date(run.runCompletedAt) : undefined
                                                                        )}
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

                        {sorted.length === 0 && (
                            <div className="text-center text-slate-500 dark:text-slate-400 py-12">No runs match your filters.</div>
                        )}
                    </div>
                </div>

                {/* Table view */}
                <div className={`${view === "table" ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0"} transition-opacity duration-300`}>
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/50">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                                    <tr>
                                        {(
                                            [
                                                { key: "id", label: "Run ID" },
                                                { key: "definition", label: "Definition" },
                                                { key: "status", label: "Status" },
                                                { key: "started", label: "Started" },
                                                { key: "duration", label: "Duration" },
                                                { key: "progress", label: "Progress" },
                                                { key: "actions", label: "Actions" },
                                            ] as const
                                        ).map((col) => (
                                            <th
                                                key={col.key}
                                                className={`text-left font-semibold px-4 py-3 whitespace-nowrap ${col.key === "actions" || col.key === "progress" ? "" : "cursor-pointer select-none"
                                                    }`}
                                                onClick={() => {
                                                    if (col.key === "actions" || col.key === "progress") return;
                                                    changeSort(col.key as SortKey);
                                                }}
                                            >
                                                <div className="inline-flex items-center gap-1">
                                                    {col.label}
                                                    {col.key === sortKey && (
                                                        <span aria-hidden className="text-xs">{sortDir === "asc" ? "▲" : "▼"}</span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                                    {pageItems.map((run) => {
                                        const { source, destination } = getSourceAndDestination(run.jobDefinitionId);
                                        const started = run.runStartedAt ? new Date(run.runStartedAt) : undefined;
                                        const finished = run.runCompletedAt ? new Date(run.runCompletedAt) : undefined;
                                        return (
                                            <tr key={run.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">{run.id}</td>
                                                <td className="px-4 py-3 text-slate-900 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        {getConnectionIcon(source?.dataFormat ?? "")}
                                                        <span className="font-medium">{getDefinitionName(run.jobDefinitionId)}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {source?.name || "?"} → {destination?.name || "?"}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`inline-block w-2 h-2 rounded-full ${run.status === "succeeded"
                                                                ? "bg-green-500"
                                                                : run.status === "failed"
                                                                    ? "bg-red-500"
                                                                    : run.status === "running"
                                                                        ? "bg-blue-500"
                                                                        : "bg-gray-400"
                                                                }`}
                                                        />
                                                        <Badge className={`${getStatusColor(run.status)} text-xs`}>{run.status}</Badge>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {started ? format(started, "M/d/yyyy, h:mm:ss a") : "Unknown"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {formatDuration(started, finished)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {run.status === "running" ? (
                                                        <div className="w-28 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                            <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: "65%" }} />
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Link to={`/executions/${run.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye size={16} />
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {sorted.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-10 text-center text-slate-500 dark:text-slate-400">
                                                No runs match your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                    Page <span className="font-semibold">{safePage}</span> of <span className="font-semibold">{totalPages}</span>
                </div>
                <div className="inline-flex items-center gap-1">
                    <Button variant="ghost" size="sm" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                        <ChevronLeft size={16} /> Prev
                    </Button>
                    {pageNumbers.map((n) => (
                        <button
                            key={n}
                            onClick={() => setPage(n)}
                            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${n === safePage
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white"
                                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                }`}
                            aria-current={n === safePage ? "page" : undefined}
                        >
                            {n}
                        </button>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={safePage === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                        Next <ChevronRight size={16} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
