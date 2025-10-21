import { useEffect, useMemo, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    Database as DatabaseIconLucide,
    Globe,
    Plus,
    Settings,
    Trash2,
    User,
    Zap,
    Search,
    Grid3X3,
    List as ListIcon,
    Eye,
    Trash,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

import { Connection, StatusType } from "../types/Connection";
import apiClient from "../services/apiClient";
import { DatabaseIcon, getConnectionIcon } from "../components/common/Helper";
import { Card, CardContent, CardFooter, CardHeader } from "../components/common/v2/Card";
import { Badge } from "../components/common/v2/Badge";
import { Button } from "../components/common/v2/Button";
import Input from "../components/common/Input";
import { useAuth } from "../context/AuthContext";

export const dataFormatLabels: { [key: string]: string } = {
    mysql: "MySQL",
    pg: "PostgreSQL",
    snowflake: "Snowflake",
    sqlite: "SQLite",
    mongodb: "MongoDB",
    oracle: "Oracle",
    mssql: "Microsoft SQL Server",
};

type SortKey = "name" | "type" | "host" | "status" | "updated";
type SortDir = "asc" | "desc";

const getStatusBadge = (status: StatusType) => {
    switch (status) {
        case "valid":
            return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
        case "invalid":
            return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
        case "testing":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
        case "untested":
            return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
};

const statusText = (status: StatusType) =>
    status === "valid"
        ? "Valid"
        : status === "invalid"
            ? "Invalid"
            : status === "testing"
                ? "Testing"
                : status === "untested"
                    ? "Untested"
                    : "Unknown";

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    connectionName,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    connectionName: string | undefined;
}) => (
    <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="fixed inset-0 bg-black/60" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900 dark:text-slate-50 flex items-center">
                                <AlertTriangle className="text-red-500 mr-2" /> Confirm Deletion
                            </Dialog.Title>
                            <div className="mt-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Are you sure you want to delete the connection
                                    {" "}
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{connectionName}</span>? This can't be undone.
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

const ConnectionCard = ({
    connection,
    onEdit,
    onDelete,
    onTest,
    canManage,
}: {
    connection: Connection;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onTest: (id: string) => void;
    canManage: boolean;
}) => {
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-all">
                <CardHeader className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl ring-blue-200/60 dark:ring-blue-800/40 flex items-center justify-center">
                                {getConnectionIcon(connection.dataFormat, 28) || (
                                    <DatabaseIconLucide className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{connection.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {dataFormatLabels[connection.dataFormat] || connection.dataFormat.toUpperCase()}
                                </p>
                            </div>
                        </div>
                        <Badge className={`${getStatusBadge(connection.status)} text-xs font-medium`}>{statusText(connection.status)}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="px-6 pb-4">
                    <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Globe size={12} /> <span>Host</span>
                            </div>
                            <span className="text-sm text-slate-900 dark:text-white font-medium">
                                {connection.host || "localhost"}:{connection.port || "3306"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <DatabaseIconLucide size={12} /> <span>Database</span>
                            </div>
                            <span className="text-sm text-slate-900 dark:text-white font-medium">{connection.dbName || "default"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <User size={12} /> <span>User</span>
                            </div>
                            <span className="text-sm text-slate-900 dark:text-white font-medium">{connection.username || "root"}</span>
                        </div>
                    </div>

                    <div className="text-sm flex items-start justify-between gap-4">
                        <div>
                            <span className="text-slate-500 dark:text-slate-400">Type</span>
                            <p className="text-slate-900 dark:text-white font-medium">
                                {dataFormatLabels[connection.dataFormat] || connection.dataFormat.toUpperCase()}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400">Last Checked</span>
                            <p className="text-slate-900 dark:text-white font-medium">
                                {connection.updatedAt ? formatDistanceToNow(new Date(connection.updatedAt), { addSuffix: true }) : "Never"}
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                    {canManage ? (
                        <div className="flex gap-2 w-full">
                            <Button variant="ghost" className="flex-1" onClick={(e) => handleActionClick(e as any, () => onTest(connection.id))}>
                                <Zap size={16} /> <span className="ml-2">Test</span>
                            </Button>
                            <Button variant="ghost" className="flex-1" onClick={(e) => handleActionClick(e as any, () => onEdit(connection.id))}>
                                <Settings size={16} /> <span className="ml-2">Configure</span>
                            </Button>
                            <Button variant="ghost" className="flex-1" onClick={(e) => handleActionClick(e as any, () => onDelete(connection.id))}>
                                <Trash size={16} /> <span className="ml-2">Delete</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="w-full text-center text-sm text-slate-500 dark:text-slate-400">
                            Actions unavailable for viewer role
                        </div>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    );
};

const ConnectionRow = ({
    conn,
    onEdit,
    onDelete,
    onTest,
    canManage,
}: {
    conn: Connection;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onTest: (id: string) => void;
    canManage: boolean;
}) => {
    return (
        <tr className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
            <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    {getConnectionIcon(conn.dataFormat) || <DatabaseIcon type={conn.dataFormat} className="h-5 w-5" />}
                    <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{conn.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{conn.host}:{conn.port}</div>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                {dataFormatLabels[conn.dataFormat] || conn.dataFormat.toUpperCase()}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">{conn.host}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">{conn.dbName}</td>
            <td className="px-4 py-3 whitespace-nowrap">
                <div className="inline-flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${conn.status === "valid" ? "bg-green-500" : conn.status === "invalid" ? "bg-red-500" : conn.status === "testing" ? "bg-blue-500" : "bg-gray-400"
                        }`} />
                    <Badge className={`${getStatusBadge(conn.status)} text-xs`}>{statusText(conn.status)}</Badge>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                {conn.updatedAt ? formatDistanceToNow(new Date(conn.updatedAt), { addSuffix: true }) : "Never"}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
                {canManage ? (
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" title="Configure" onClick={() => onEdit(conn.id)}>
                            <Settings size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" title="Test" onClick={() => onTest(conn.id)}>
                            <Zap size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" title="Delete" onClick={() => onDelete(conn.id)}>
                            <Trash2 size={16} />
                        </Button>
                    </div>
                ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">View only</span>
                )}
            </td>
        </tr>
    );
};

type ConnectionsPageProps = {
    setView: (view: string) => void;
};

export default function ConnectionsPage({ setView }: ConnectionsPageProps) {
    const { user } = useAuth();
    const canManageConnections = !user?.isViewerOnly;
    const [loading, setLoading] = useState(true);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [connectionToDelete, setConnectionToDelete] = useState<Connection | null>(null);

    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    useEffect(() => {
        setLoading(true);
        apiClient
            .listConnections()
            .then((data) => setConnections(data))
            .catch((err) => console.error("Failed to load connections", err))
            .finally(() => setLoading(false));
    }, []);

    const openDeleteModal = (id: string) => {
        const connection = connections.find((c) => c.id === id);
        if (connection) setConnectionToDelete(connection);
    };
    const closeDeleteModal = () => setConnectionToDelete(null);

    const handleDeleteConnection = async () => {
        if (!connectionToDelete) return;
        try {
            await apiClient.deleteConnection(connectionToDelete.id);
            setConnections((prev) => prev.filter((c) => c.id !== connectionToDelete.id));
        } catch (error) {
            console.error("Failed to delete connection:", error);
            alert("Error: Could not delete the connection.");
        } finally {
            closeDeleteModal();
        }
    };

    const handleEditConnection = (id: string) => setView(`connections/wizard?edit=${id}`);

    const handleTestConnection = async (id: string) => {
        setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, status: "testing" } : c)));
        try {
            const result = await apiClient.testConnectionById(id);
            setConnections((prev) =>
                prev.map((c) =>
                    c.id === id ? { ...c, status: result.error ? ("invalid" as StatusType) : ("valid" as StatusType), updatedAt: new Date().toISOString() } : c
                )
            );
        } catch (error) {
            console.error("Failed to test connection:", error);
            setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, status: "invalid", updatedAt: new Date().toISOString() } : c)));
            alert("Error: Could not test the connection.");
        }
    };

    // filtering + sorting (computed before any early returns)
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return connections;
        return connections.filter((c) => {
            const hay = [
                c.name,
                c.host,
                String(c.port ?? ""),
                c.dbName,
                c.username,
                dataFormatLabels[c.dataFormat] || c.dataFormat,
                statusText(c.status),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return hay.includes(q);
        });
    }, [connections, search]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        const get = (c: Connection) => {
            switch (sortKey) {
                case "type":
                    return (dataFormatLabels[c.dataFormat] || c.dataFormat).toLowerCase();
                case "host":
                    return `${c.host ?? ""}`.toLowerCase();
                case "status":
                    const rank = c.status === "valid" ? 0 : c.status === "testing" ? 1 : c.status === "invalid" ? 2 : 3;
                    return rank;
                case "updated":
                    return c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
                default:
                case "name":
                    return (c.name ?? "").toLowerCase();
            }
        };
        arr.sort((a, b) => {
            const va = get(a) as any;
            const vb = get(b) as any;
            if (va < vb) return sortDir === "asc" ? -1 : 1;
            if (va > vb) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
        return arr;
    }, [filtered, sortKey, sortDir]);

    const changeSort = (key: SortKey) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(key);
            setSortDir(key === "updated" ? "desc" : "asc");
        }
    };

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
        <>
            <ConfirmationModal
                isOpen={!!connectionToDelete}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteConnection}
                connectionName={connectionToDelete?.name}
            />

            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-[32px] font-bold leading-tight text-slate-900 dark:text-white" data-testid="connections-title">
                            Connections
                        </h1>
                        <p className="mt-1 text-slate-700 dark:text-slate-300">Manage your database and data source connections</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {canManageConnections && (
                            <Link to="/connections/wizard">
                                <Button className="flex items-center space-x-2" variant="primary">
                                    <Plus size={16} />
                                    <span>Add Connection</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Search + View toggle (unified) */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            type="text"
                            placeholder="Search connections… (name, host, db, type)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 w-full"
                        />
                        {search && (
                            <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {/* View toggle */}
                    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={() => setViewMode("cards")}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all ${viewMode === "cards" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                            aria-pressed={viewMode === "cards"}
                            title="Card view"
                        >
                            <Grid3X3 size={16} /> Cards
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all ${viewMode === "table" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                            aria-pressed={viewMode === "table"}
                            title="Table view"
                        >
                            <ListIcon size={16} /> Table
                        </button>
                    </div>
                </div>

                {/* Views */}
                <div className="relative">
                    {/* Cards */}
                    <div className={`${viewMode === "cards" ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0"} transition-opacity duration-300`}>
                        <motion.div layout variants={{ visible: { transition: { staggerChildren: 0.07 } }, hidden: {} }} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sorted.length > 0 ? (
                                sorted.map((conn) => (
                                    <ConnectionCard key={conn.id} connection={conn} onEdit={handleEditConnection} onDelete={openDeleteModal} onTest={handleTestConnection} canManage={canManageConnections} />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <h3 className="text-lg font-semibold">No Connections Found</h3>
                                    <p className="mt-2 text-sm">Click "Add Connection" to get started and connect to your databases.</p>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Table */}
                    <div className={`${viewMode === "table" ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0"} transition-opacity duration-300`}>
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/50">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                                        <tr>
                                            {(
                                                [
                                                    { key: "name", label: "Name" },
                                                    { key: "type", label: "Type" },
                                                    { key: "host", label: "Host" },
                                                    { key: "db", label: "Database" },
                                                    { key: "status", label: "Status" },
                                                    { key: "updated", label: "Last Checked" },
                                                    { key: "actions", label: "" },
                                                ] as const
                                            ).map((col) => (
                                                <th
                                                    key={col.key}
                                                    className={`text-left font-semibold px-4 py-3 whitespace-nowrap ${col.key === "actions" || col.key === "db" ? "" : "cursor-pointer select-none"
                                                        }`}
                                                    onClick={() => {
                                                        if (col.key === "actions" || col.key === "db") return;
                                                        changeSort(col.key as SortKey);
                                                    }}
                                                >
                                                    <div className="inline-flex items-center gap-1">
                                                        {col.label}
                                                        {(col.key as any) === sortKey && (
                                                            <span aria-hidden className="text-xs">{sortDir === "asc" ? "▲" : "▼"}</span>
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                                        {sorted.map((conn) => (
                                            <ConnectionRow key={conn.id} conn={conn} onEdit={handleEditConnection} onDelete={openDeleteModal} onTest={handleTestConnection} canManage={canManageConnections} />
                                        ))}
                                        {sorted.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="py-10 text-center text-slate-500 dark:text-slate-400">
                                                    No connections match your search.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
