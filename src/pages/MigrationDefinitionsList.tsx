import { useEffect, useMemo, useState, Fragment } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    ArrowRight,
    AlertTriangle,
    Play,
    Info as InfoIcon,
    Eye,
    Edit,
    FileText,
    BarChart3,
    CheckCircle,
    Clock,
    Database,
    Search,
    Grid3X3,
    List,
    XCircle,
    HelpCircle,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { JobDefinition } from "../types/JobDefinition";
import apiClient from "../services/apiClient";
import { getConnectionIcon } from "../components/common/Helper";
import { Button } from "../components/common/v2/Button";
import { Card, CardContent } from "../components/common/v2/Card";
import { Badge } from "../components/common/v2/Badge";
import { formatDistanceToNow } from "date-fns";
import Input from "../components/common/Input";
import { cn } from "../utils/utils";
import { JobDefinitionStat } from "../types/ExecutionStat";

type SortKey = "name";
type SortDir = "asc" | "desc";

const getStatusText = (def: JobDefinitionStat) => {
    switch (def.lastRunStatus) {
        case "succeeded":
            return "Succeeded";
        case "running":
            return "In Progress";
        case "failed":
            return "Failed";
        case "pending":
            return "Pending";
        default:
            return "Unknown";
    }
};

const getStatusIcon = (def: JobDefinitionStat) => {
    switch (def.lastRunStatus) {
        case "succeeded":
            return CheckCircle;
        case "running":
            return Play;
        case "failed":
            return XCircle;
        case "pending":
            return Clock;
        default:
            return HelpCircle;
    }
};

const getTableStatusIcon = (def: JobDefinitionStat) => {
    switch (def.lastRunStatus) {
        case "succeeded":
            return <CheckCircle className="mr-1.5 h-3 w-3" />;
        case "running":
            return <Play className="mr-1.5 h-3 w-3" />;
        case "failed":
            return <XCircle className="mr-1.5 h-3 w-3" />;
        case "pending":
            return <Clock className="mr-1.5 h-3 w-3" />;
        default:
            return <HelpCircle className="mr-1.5 h-3 w-3" />;
    }
};

const getStatusStyles = (def: JobDefinitionStat) => {
    switch (def.lastRunStatus) {
        case "succeeded":
            return "ring-emerald-200 dark:ring-emerald-900 bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
        case "running":
            return "ring-blue-200 dark:ring-blue-900 bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
        case "failed":
            return "ring-red-200 dark:ring-red-900 bg-red-50/80 dark:bg-red-900/30 text-red-700 dark:text-red-300";
        case "pending":
            return "ring-yellow-200 dark:ring-yellow-900 bg-yellow-50/80 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
        default:
            return "ring-gray-200 dark:ring-gray-900 bg-gray-50/80 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
    }
};

const getTableStatusStyles = (def: JobDefinitionStat) => {
    switch (def.lastRunStatus) {
        case "succeeded":
            return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
        case "running":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        case "failed":
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        case "pending":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
};

const formatDuration = (duration_sec: number) => {
    const minutes = Math.floor(duration_sec / 60);
    const seconds = Math.round(duration_sec % 60);
    return `${minutes}m ${seconds}s`;
};

const getBytesTransferredText = (def: JobDefinitionStat) => {
    const bytes = def.totalBytesTransferred ?? 0;
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

const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    definitionName,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    definitionName: string | undefined;
}) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title className="text-lg font-bold leading-6 text-slate-900 dark:text-slate-50 flex items-center">
                                    <AlertTriangle className="text-red-500 mr-2" />
                                    Confirm Deletion
                                </Dialog.Title>
                                <div className="mt-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Are you sure you want to delete the definition {" "}
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">{definitionName}</span>? This action cannot be undone.
                                    </p>
                                </div>
                                <div className="mt-6 flex justify-end gap-2">
                                    <button className="inline-flex justify-center rounded-md bg-slate-100 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-50 hover:bg-slate-200 dark:hover:bg-slate-600" onClick={onClose}>
                                        Cancel
                                    </button>
                                    <button className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700" onClick={onConfirm}>
                                        Delete
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

const RunConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    definitionName,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    definitionName: string | undefined;
}) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title className="text-lg font-bold leading-6 text-slate-900 dark:text-slate-50 flex items-center">
                                    <InfoIcon className="text-blue-500 mr-2" />
                                    Confirm Run
                                </Dialog.Title>
                                <div className="mt-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Are you sure you want to run the migration {" "}
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">{definitionName}</span>?
                                    </p>
                                </div>
                                <div className="mt-6 flex justify-end gap-2">
                                    <button className="inline-flex justify-center rounded-md bg-slate-100 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-50 hover:bg-slate-200 dark:hover:bg-slate-600" onClick={onClose}>
                                        Cancel
                                    </button>
                                    <button className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700" onClick={onConfirm}>
                                        Run
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

const DefinitionCard = ({
    def,
    onDelete,
    onRun,
}: {
    def: JobDefinitionStat;
    onDelete: (id: string) => void;
    onRun: (id: string) => void;
}) => {
    const navigate = useNavigate();

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    const updatedLabel = def.updatedAt ? `Updated ${formatDistanceToNow(new Date(def.updatedAt), { addSuffix: true })}` : "Unknown";

    const Stat = ({
        icon: Icon,
        value,
        label,
        ring,
    }: {
        icon: any;
        value: string;
        label: string;
        ring: string;
    }) => (
        <div className="flex items-center gap-3 p-3 rounded-xl">
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center ring-1", ring)}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
            </div>
        </div>
    );

    return (
        <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} transition={{ duration: 0.2 }} onClick={() => navigate(`/definitions/${def.id}`)} className="cursor-pointer">
            <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-all">
                <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/30 flex items-center justify-center ring-1 ring-blue-200/60 dark:ring-blue-800/40">
                                <FileText className="text-blue-700 dark:text-blue-300" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                    {def.name}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{def.description || "No description provided"}</p>
                            </div>
                        </div>

                        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{updatedLabel}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                        <Stat icon={BarChart3} value={`${def.totalRuns}`} label="Total Runs" ring="ring-blue-200 dark:ring-blue-800 bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" />
                        <Stat icon={getStatusIcon(def)} value={getStatusText(def)} label="Last Run" ring={getStatusStyles(def)} />
                        <Stat icon={Database} value={getBytesTransferredText(def)} label="Processed" ring="ring-purple-200 dark:ring-purple-900 bg-purple-50/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" />
                        <Stat icon={Clock} value={formatDuration(def.avgDurationSeconds)} label="Avg Duration" ring="ring-amber-200 dark:ring-amber-900 bg-amber-50/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" />
                    </div>

                    {/* Connections & Actions */}
                    <div className="mt-6 pt-4 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-4">
                        {/* Connection flow */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/70 ring-1 ring-slate-200 dark:ring-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100">
                                {getConnectionIcon(def.sourceConnection.dataFormat)}
                                <span className="truncate max-w-[180px]" title={def.sourceConnection.name}>
                                    {def.sourceConnection.name}
                                </span>
                            </span>
                            <ArrowRight className="text-slate-400" />
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/70 ring-1 ring-slate-200 dark:ring-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100">
                                {getConnectionIcon(def.destinationConnection.dataFormat)}
                                <span className="truncate max-w-[180px]" title={def.destinationConnection.name}>
                                    {def.destinationConnection.name}
                                </span>
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            <Link to={`/definitions/${def.id}`}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    title="View"
                                    className="h-9 w-9 p-0 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
                                    onClick={(e) => handleActionClick(e, () => navigate(`/definitions/${def.id}`))}
                                >
                                    <Eye size={16} />
                                </Button>
                            </Link>

                            <Button
                                variant="ghost"
                                size="sm"
                                title="Run"
                                className="h-9 w-9 p-0 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                onClick={(e) => handleActionClick(e, () => onRun(def.id))}
                            >
                                <Play size={16} />
                            </Button>

                            <Link to={`/wizard/${def.id}`}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Edit"
                                    className="h-9 w-9 p-0 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
                                    onClick={(e) => handleActionClick(e, () => navigate(`/wizard/${def.id}`))}
                                >
                                    <Edit size={16} />
                                </Button>
                            </Link>

                            <Button
                                variant="ghost"
                                size="sm"
                                title="Delete"
                                className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                onClick={(e) => handleActionClick(e, () => onDelete(def.id))}
                            >
                                <AlertTriangle size={16} />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const DefinitionRow = ({ def, onDelete, onRun }: { def: JobDefinitionStat; onDelete: (id: string) => void; onRun: (id: string) => void }) => {
    const stats = {
        lastRun: getStatusText(def),
        totalRuns: def.totalRuns,
        dataProcessed: getBytesTransferredText(def),
        avgDuration: formatDuration(def.avgDurationSeconds),
    };

    return (
        <tr className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors group">
            <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                        <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <div className="ml-4 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{def.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 truncate">{def.description || "No description"}</div>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTableStatusStyles(def)}`}>
                        {getTableStatusIcon(def)} {stats.lastRun}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{def.totalRuns}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{stats.dataProcessed}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{stats.avgDuration}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                {def.createdAt ? new Date(def.createdAt).toLocaleDateString() : "Unknown"}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-left text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                    <Button asChild variant="ghost" size="icon" title="View">
                        <Link to={`/definitions/${def.id}`}>
                            <Eye size={16} />
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon" title="Edit">
                        <Link to={`/wizard/${def.id}`}>
                            <Edit size={16} />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40" onClick={() => onRun(def.id)} title="Run">
                        <Play size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40" onClick={() => onDelete(def.id)} title="Delete">
                        <AlertTriangle size={16} />
                    </Button>
                </div>
            </td>
        </tr>
    );
};

const DefinitionTable = ({
    definitions,
    onDelete,
    onRun,
    sortKey,
    sortDir,
    onSort,
}: {
    definitions: JobDefinitionStat[];
    onDelete: (id: string) => void;
    onRun: (id: string) => void;
    sortKey: "name";
    sortDir: "asc" | "desc";
    onSort: (key: "name") => void;
}) => (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/50">
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                    <tr>
                        {(
                            [
                                { key: "name", label: "Name" },
                                { key: "last", label: "Last Run" },
                                { key: "total", label: "Total Runs" },
                                { key: "processed", label: "Data Processed" },
                                { key: "avg", label: "Avg Duration" },
                                { key: "created", label: "Created" },
                                { key: "actions", label: "" },
                            ] as const
                        ).map((col) => (
                            <th
                                key={col.key}
                                className={`text-left font-semibold px-4 py-3 whitespace-nowrap ${col.key === "name" ? "cursor-pointer select-none" : ""
                                    }`}
                                onClick={() => {
                                    if (col.key !== "name") return;
                                    onSort("name");
                                }}
                            >
                                <div className="inline-flex items-center gap-1">
                                    {col.label}
                                    {col.key === "name" && (
                                        <span aria-hidden className="text-xs">
                                            {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                    {definitions.map((def) => (
                        <DefinitionRow key={def.id} def={def} onDelete={onDelete} onRun={onRun} />
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const MigrationDefinitionsList = () => {
    const [definitions, setDefinitions] = useState<JobDefinitionStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [definitionToDelete, setDefinitionToDelete] = useState<JobDefinitionStat | null>(null);
    const [definitionToRun, setDefinitionToRun] = useState<JobDefinitionStat | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"list" | "table">("list");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    useEffect(() => {
        setLoading(true);
        apiClient
            .listJobDefinitionsWithStats()
            .then((data) => {
                setDefinitions(data);
            })
            .catch((err) => {
                console.error("Failed to load definitions", err);
            })
            .finally(() => setLoading(false));
    }, []);

    const openDeleteModal = (id: string) => {
        const definition = definitions.find((d) => d.id === id);
        if (definition) setDefinitionToDelete(definition);
    };

    const openRunModal = (id: string) => {
        const definition = definitions.find((d) => d.id === id);
        if (definition) setDefinitionToRun(definition);
    };

    const closeDeleteModal = () => setDefinitionToDelete(null);

    const handleDeleteDefinition = async () => {
        if (!definitionToDelete) return;
        try {
            await apiClient.deleteJobDefinition(definitionToDelete.id);
            setDefinitions((prev) => prev.filter((d) => d.id !== definitionToDelete.id));
        } catch (error) {
            console.error("Failed to delete definition:", error);
            alert("Error: Could not delete the definition.");
        } finally {
            closeDeleteModal();
        }
    };

    const filtered = useMemo(
        () => definitions.filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [definitions, searchTerm]
    );

    const sorted = useMemo(() => {
        const arr = [...filtered];
        arr.sort((a, b) => {
            const va = a.name.toLowerCase();
            const vb = b.name.toLowerCase();
            if (va < vb) return sortDir === "asc" ? -1 : 1;
            if (va > vb) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
        return arr;
    }, [filtered, sortDir]);

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
        <>
            <DeleteConfirmationModal isOpen={!!definitionToDelete} onClose={closeDeleteModal} onConfirm={handleDeleteDefinition} definitionName={definitionToDelete?.name} />

            <RunConfirmationModal
                isOpen={!!definitionToRun}
                onClose={() => setDefinitionToRun(null)}
                onConfirm={() => {
                    if (definitionToRun) {
                        apiClient
                            .runJob(definitionToRun.id)
                            .then(() => alert("Migration started successfully!"))
                            .catch((err) => {
                                console.error("Failed to run migration:", err);
                                alert("Error: Could not start the migration.");
                            });
                    }
                    setDefinitionToRun(null);
                }}
                definitionName={definitionToRun?.name}
            />

            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-[32px] font-bold leading-tight text-slate-900 dark:text-white">Migration Definitions</h1>
                        <p className="mt-1 text-slate-700 dark:text-slate-300">Create and manage reusable migration templates</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <Link to="/wizard">
                            <Button className="flex items-center space-x-2" variant="primary">
                                <Plus size={16} />
                                <span>New Definition</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search & View toggle (unified with Runs page) */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            type="text"
                            placeholder="Search definitions by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                            data-testid="search-definitions"
                        />
                        {searchTerm && (
                            <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                onClick={() => setSearchTerm("")}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all",
                                viewMode === "list" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                            aria-pressed={viewMode === "list"}
                            title="Card view"
                        >
                            <Grid3X3 size={16} /> Cards
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all",
                                viewMode === "table" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                            aria-pressed={viewMode === "table"}
                            title="Table view"
                        >
                            <List size={16} /> Table
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {sorted.length > 0 ? (
                        viewMode === "list" ? (
                            sorted.map((def) => <DefinitionCard key={def.id} def={def} onDelete={openDeleteModal} onRun={openRunModal} />)
                        ) : (
                            <DefinitionTable
                                definitions={sorted}
                                onDelete={openDeleteModal}
                                onRun={openRunModal}
                                sortKey={sortKey}
                                sortDir={sortDir}
                                onSort={() => {
                                    setSortKey("name");
                                    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                                }}
                            />
                        )
                    ) : (
                        <div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400">
                            <p className="font-semibold text-lg">No definitions found.</p>
                            <p className="mt-2">Click "New Definition" to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MigrationDefinitionsList;
