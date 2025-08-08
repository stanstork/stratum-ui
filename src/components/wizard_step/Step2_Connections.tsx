import { useEffect, useMemo, useState, useCallback } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, RefreshCw, XCircle, Plus, Search } from "lucide-react";
import apiClient from "../../services/apiClient";
import { Button } from "../common/v2/Button";
import { Card, CardContent } from "../common/v2/Card";
import Input from "../common/Input";
import { Link } from "react-router-dom";
import { DatabaseIcon } from "../common/Helper";
import { emptyMigrationConfig, getConnectionInfo, MigrationConfig } from "../../types/MigrationConfig";
import { Connection, emptyConnection, StatusType } from "../../types/Connection";

type Step2ConnectionsProps = {
    config: MigrationConfig;
    setConfig: (config: MigrationConfig) => void;
};

const statusPill = (status?: StatusType) => {
    const s = status || "untested";
    if (s === "valid") {
        return { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", Icon: CheckCircle2, text: "Verified" };
    }
    if (s === "invalid") {
        return { cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", Icon: XCircle, text: "Failed" };
    }
    if (s === "testing") {
        return { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", Icon: RefreshCw, text: "Verifying…" };
    }
    return { cls: "bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300", Icon: AlertCircle, text: "Untested" };
};

function ConnectionTile({
    conn,
    selected,
    onSelect,
    onTest,
}: {
    conn: Connection;
    selected: boolean;
    onSelect: () => void;
    onTest?: () => void;
}) {
    const pill = statusPill(conn.status);
    return (
        <div className="relative">
            {/* status pill */}
            <span className={`absolute right-3 top-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${pill.cls}`}>
                <pill.Icon size={12} className={conn.status === "testing" ? "animate-spin" : ""} />
                {pill.text}
            </span>

            <button
                type="button"
                onClick={onSelect}
                aria-pressed={selected}
                className={`group relative text-left p-4 rounded-xl border transition-all w-full
          ${selected
                        ? "border-slate-900 dark:border-white bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
            >
                <div className="flex items-start gap-3">
                    <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ring-1
              ${selected
                                ? "ring-slate-900 dark:ring-white bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                : "ring-slate-200 dark:ring-slate-700 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                    >
                        <DatabaseIcon type={conn.dataFormat} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-white truncate">{conn.name || "Unnamed connection"}</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                    {conn.dataFormat?.toUpperCase?.() || "—"} · {conn.host || "—"}
                                    {conn.port ? `:${conn.port}` : ""}
                                </div>
                            </div>

                            {onTest && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTest();
                                    }}
                                >
                                    <RefreshCw size={14} />
                                    Test
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* active ring */}
                <span className={`pointer-events-none absolute inset-0 rounded-xl ring-0 ${selected ? "ring-2 ring-slate-900/20 dark:ring-white/20" : ""}`} />
            </button>
        </div>
    );
}

export default function Step2_Connections({ config, setConfig }: Step2ConnectionsProps) {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [rawSearch, setRawSearch] = useState("");
    const q = rawSearch.trim().toLowerCase();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const fetched = await apiClient.listConnections();
            setConnections(fetched || []);
        } catch (e) {
            console.error("Failed to load connections", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const filterBySearch = useCallback(
        (c: Connection) => {
            if (!q) return true;
            return (
                c.name?.toLowerCase().includes(q) ||
                c.host?.toLowerCase().includes(q) ||
                c.dataFormat?.toLowerCase().includes(q)
            );
        },
        [q]
    );

    const filtered = useMemo(() => connections.filter(filterBySearch), [connections, filterBySearch]);

    const sourceSelected = !!config.connections.source?.id;
    const destinationSelected = !!config.connections.dest?.id;

    const destinationOptions = sourceSelected
        ? filtered.filter((c) => c.id !== config.connections.source!.id)
        : filtered;

    const setSource = (id: string) => {
        const selected = connections.find((c) => c.id === id) || emptyConnection();
        setConfig({
            ...config,
            connections: { ...config.connections, source: getConnectionInfo(selected) },
            // reset migrateItems when source changes
            migration: { ...config.migration, migrateItems: [{ ...emptyMigrationConfig().migration.migrateItems[0] }] },
        });
    };

    const setDestination = (id: string) => {
        const selected = connections.find((c) => c.id === id) || emptyConnection();
        setConfig({ ...config, connections: { ...config.connections, dest: getConnectionInfo(selected) } });
    };

    const testConn = async (conn: Connection) => {
        // Wire this to your real tester if available
        console.log("Test connection:", conn.name);
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[0, 1].map((i) => (
                    <div key={i} className="space-y-4">
                        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="h-20 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/50 animate-pulse" />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Connections</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Pick where to read from and where to write to.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-64 hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            className="pl-9"
                            placeholder="Search connections…"
                            value={rawSearch}
                            onChange={(e) => setRawSearch(e.target.value)}
                        />
                        {rawSearch && (
                            <button
                                type="button"
                                onClick={() => setRawSearch("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <Button type="button" variant="outline" onClick={load}>
                        <RefreshCw size={14} />
                        Refresh
                    </Button>
                    <Link to="/connections/add">
                        <Button type="button" variant="primary">
                            <Plus size={14} />
                            Add Connection
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Source / Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Source */}
                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <DatabaseIcon type="mysql" className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Source</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {filtered.map((conn) => (
                                <ConnectionTile
                                    key={`src-${conn.id}`}
                                    conn={conn}
                                    selected={config.connections.source.id === conn.id}
                                    onSelect={() => setSource(conn.id)}
                                    onTest={() => testConn(conn)}
                                />
                            ))}
                            {filtered.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No connections match your search.</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Destination */}
                <Card className={`bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden ${sourceSelected ? "" : "opacity-50 pointer-events-none select-none"}`}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <DatabaseIcon type="pg" className="w-5 h-5 text-sky-500" />
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Destination</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {destinationOptions.map((conn) => (
                                <ConnectionTile
                                    key={`dst-${conn.id}`}
                                    conn={conn}
                                    selected={config.connections.dest.id === conn.id}
                                    onSelect={() => setDestination(conn.id)}
                                    onTest={() => testConn(conn)}
                                />
                            ))}
                            {destinationOptions.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No connections available for destination.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Summary */}
            {sourceSelected && destinationSelected && (
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Summary</h3>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/50 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 min-w-0">
                                <DatabaseIcon type={config.connections.source.dataFormat} className="w-5 h-5 text-slate-500" />
                                <span className="truncate font-semibold text-slate-900 dark:text-white">{config.connections.source.name}</span>
                            </div>
                            <ArrowRight size={18} className="text-slate-400 dark:text-slate-500" />
                            <div className="flex items-center gap-2 min-w-0">
                                <DatabaseIcon type={config.connections.dest.dataFormat} className="w-5 h-5 text-slate-500" />
                                <span className="truncate font-semibold text-slate-900 dark:text-white">{config.connections.dest.name}</span>
                            </div>
                        </div>
                        {/* overall status */}
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                            {config.connections.source.status === "valid" && config.connections.dest.status === "valid" ? (
                                <>
                                    <CheckCircle2 size={16} className="text-emerald-500" /> Connections Verified
                                </>
                            ) : (
                                <>
                                    <AlertCircle size={16} /> Verification Recommended
                                </>
                            )}
                        </span>
                    </div>
                </section>
            )}
        </div>
    );
}
