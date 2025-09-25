import React, { useState } from 'react';
import {
    CheckCircle2,
    Settings,
    Table,
    Database,
    FileStackIcon,
    ColumnsIcon,
    Table2Icon,
    BrickWallIcon,
    ConstructionIcon,
    TableConfigIcon,
    Filter,
    ArrowRightLeft,
} from "lucide-react";
import {
    MigrationConfig, Expression, LookupExpr, LiteralExpr, ConditionExpr, MigrateItem, ArithmeticExpr, FunctionCallExpr
} from "../../types/MigrationConfig";
import apiClient from '../../services/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../common/v2/Card';
import { getConnectionIcon } from '../common/Helper';
import { dataFormatLabels } from '../../pages/Connections';
import { fieldPill, getLookupParts, getStatusBadge, getStatusIndicator, highlightBooleanOps, isIdentifier, JoinIcon, opText, pillBase, statusText, tablePill } from '../../pages/MIgrationDefinitionDetails';
import { Badge } from '../common/v2/Badge';
import { cn } from '../../utils/utils';

// --- Tiny reusable section header ---
const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <span className="text-slate-600 dark:text-slate-400">{icon}</span>
        <h3 className="text-lg font-semibold">{title}</h3>
    </div>
);

// --- Type Guards & Helpers ---
const isLookup = (expr: Expression): expr is LookupExpr => !!(expr as LookupExpr)?.Lookup;
const isLiteral = (expr: Expression): expr is LiteralExpr => !!(expr as LiteralExpr)?.Literal;
const isFunctionCall = (expr: Expression): expr is FunctionCallExpr => Array.isArray((expr as FunctionCallExpr)?.FunctionCall);
const isArithmetic = (expr: Expression): expr is ArithmeticExpr => !!(expr as ArithmeticExpr)?.Arithmetic;
const isCondition = (expr: Expression): expr is ConditionExpr => !!(expr as ConditionExpr)?.Condition;

const COMPARATOR_MAP: Record<string, string> = {
    'Equal': '=', 'NotEqual': '!=', 'GreaterThan': '>', 'GreaterThanOrEqual': '>=', 'LessThan': '<', 'LessThanOrEqual': '<='
};

const ARITHMETIC_OPERATORS: Record<string, string> = {
    'Add': '+', 'Subtract': '-', 'Multiply': '*', 'Divide': '/'
};

const renderExpression = (expr?: Expression | null): string => {
    if (!expr) return 'N/A';
    if (isLookup(expr)) return `${expr.Lookup.entity}.${expr.Lookup.key || '?'}`;
    if (isLiteral(expr)) {
        const literal = expr.Literal;
        if (literal.String !== undefined) return `'${literal.String}'`;
        if (literal.Integer !== undefined) return literal.Integer.toString();
        if (literal.Float !== undefined) return literal.Float.toString();
        if (literal.Boolean !== undefined) return literal.Boolean.toString().toUpperCase();
        return 'NULL';
    }
    if (isArithmetic(expr)) return `(${renderExpression(expr.Arithmetic.left)} ${ARITHMETIC_OPERATORS[expr.Arithmetic.operator]} ${renderExpression(expr.Arithmetic.right)})`;
    if (isFunctionCall(expr)) return `${expr.FunctionCall[0]}(${expr.FunctionCall[1].map(renderExpression).join(', ')})`;
    if (isCondition(expr)) return `(${renderExpression(expr.Condition.left)} ${COMPARATOR_MAP[expr.Condition.op]} ${renderExpression(expr.Condition.right)})`;
    return 'Unknown Expression';
};

const ConnectionSummary: React.FC<{ config: MigrationConfig }> = ({ config }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800/50 p-4">
            <div className="space-y-4">
                <div className="flex items-center space-x-3">
                    {getConnectionIcon(config.connections.source?.dataFormat || "MySQL")}
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{config.connections.source?.name || "mysql sakila"}</h3>
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded font-medium">
                                {dataFormatLabels[config.connections.source?.dataFormat || "MySQL"]}
                            </span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                            <div className={`w-2 h-2 ${getStatusIndicator(config.connections.source?.status || "unknown")}`}></div>
                            <span className={`text-sm ${getStatusBadge(config.connections.source?.status || "unknown")}`}>{statusText(config.connections.source?.status || "unknown")}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <Database className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">Host:</span>
                        <span className="text-sm text-slate-900 dark:text-white font-mono">{config.connections.source?.host || "host.docker.internal"}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Database className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">Database:</span>
                        <span className="text-sm text-slate-900 dark:text-white font-mono">{config.connections.source?.database || "sakila"}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">User:</span>
                        <span className="text-sm text-slate-900 dark:text-white font-mono">root</span>
                    </div>
                </div>
            </div>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800/50 p-4">
            <div className="space-y-4">
                <div className="flex items-center space-x-3">
                    {getConnectionIcon(config.connections.dest?.dataFormat || "MySQL")}
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{config.connections.dest?.name || "mysql test db"}</h3>
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded font-medium">
                                {dataFormatLabels[config.connections.dest?.dataFormat || "MySQL"]}
                            </span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                            <div className={`w-2 h-2 ${getStatusIndicator(config.connections.dest?.status || "unknown")}`}></div>
                            <span className={`text-sm ${getStatusBadge(config.connections.dest?.status || "unknown")}`}>{statusText(config.connections.dest?.status || "unknown")}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <Database className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">Host:</span>
                        <span className="text-sm text-slate-900 dark:text-white font-mono">{config.connections.dest?.host || "mysql_db"}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Database className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">Database:</span>
                        <span className="text-sm text-slate-900 dark:text-white font-mono">{config.connections.dest?.database || "testdb"}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">User:</span>
                        <span className="text-sm text-slate-900 dark:text-white font-mono">user</span>
                    </div>
                </div>
            </div>
        </Card>
    </div>
);

const TableSourceSummary: React.FC<{ migrateItem: MigrateItem }> = ({ migrateItem }) => (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60">
            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 flex items-center gap-2 rounded-md border border-blue-100 dark:border-blue-800">
                <Table className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                    {migrateItem.source?.names[0]}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">Primary Table</span>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Filters: {migrateItem.filter.expression ? 1 : 0}
                </Badge>
                <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Joins: {migrateItem.load?.matches?.length ?? 0}
                </Badge>
            </div>
        </div>

        {/* Conditions header */}
        <div className="px-4 md:px-5 pt-4">
            <SectionHeader icon={<Filter size={18} />} title="Conditions" />
        </div>

        <div className="p-4 md:p-5 space-y-6">
            {/* Filters */}
            <section>
                <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters</h5>
                </div>

                {migrateItem.filter.expression ? (
                    <div className="relative rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                        <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-500 rounded-l-lg" />
                        <div className="pl-4 pr-3 py-3 md:pl-5">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                                Where
                            </div>
                            <pre className="text-sm font-mono text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words">
                                {highlightBooleanOps(renderExpression(migrateItem.filter.expression))}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400">
                        No filters defined.
                    </div>
                )}
            </section>

            {/* Joins */}
            <section>
                <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Joins</h5>

                {migrateItem.load?.matches?.length ? (
                    <div className="space-y-2">
                        {migrateItem.load.matches.map((join, idx) => {
                            const L = getLookupParts(join.left);
                            const R = getLookupParts(join.right);
                            const leftField = L.isLookup ? (L.column || L.raw) : L.raw;
                            const rightField = R.isLookup ? (R.column || R.raw) : R.raw;

                            return (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 flex-wrap rounded-lg px-3 py-2 border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/20"
                                >
                                    {/* table A */}
                                    <span className={`${pillBase} ${tablePill}`} title={L.table || leftField}>
                                        {L.table || leftField}
                                    </span>

                                    {/* join icon */}
                                    <JoinIcon />

                                    {/* table B */}
                                    <span className={`${pillBase} ${tablePill}`} title={R.table || rightField}>
                                        {R.table || rightField}
                                    </span>

                                    <span className={opText}>where</span>

                                    {/* condition */}
                                    <span className={`${pillBase} ${fieldPill}`} title={leftField}>
                                        {leftField}
                                    </span>
                                    <span className="text-rose-500 dark:text-rose-400 font-semibold mx-1">=</span>
                                    <span className={`${pillBase} ${fieldPill}`} title={rightField}>
                                        {rightField}
                                    </span>

                                    {/* optional: join type tag */}
                                    <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                        INNER
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400">
                        No joins configured.
                    </div>
                )}
            </section>
        </div>
    </div>
);

const SettingsSummary: React.FC<{ settings: MigrateItem['settings'] }> = ({ settings }) => (
    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
        <CardContent className="p-6 space-y-4">
            {(() => {
                const s = settings;
                const rows =
                    s
                        ? [
                            {
                                key: "batchSize",
                                label: "Batch Size",
                                value: `${s.batchSize} rows`,
                                desc:
                                    "Number of records processed in each batch. Larger batches improve performance but use more memory.",
                                icon: (
                                    <FileStackIcon size={14} />
                                ),
                            },
                            {
                                key: "copyColumns",
                                label: "Copy Columns",
                                value: s.copyColumns === "All" ? "All" : "Mapped Only",
                                desc: "Controls which columns are copied to the target system.",
                                icon: (
                                    <ColumnsIcon size={14} />
                                ),
                            },
                            {
                                key: "inferSchema",
                                label: "Infer Schema",
                                value: s.inferSchema,
                                desc: "Automatically infer the database schema from the source data.",
                                icon: (
                                    <Table2Icon size={14} />
                                ),
                            },
                            {
                                key: "cascadeSchema",
                                label: "Cascade Schema",
                                value: s.cascadeSchema,
                                desc: "Automatically create related tables in the target schema.",
                                icon: (
                                    <BrickWallIcon size={14} />
                                ),
                            },
                            {
                                key: "ignoreConstraints",
                                label: "Ignore Constraints",
                                value: s.ignoreConstraints,
                                desc: "Ignore database constraints during migration.",
                                icon: (
                                    <ConstructionIcon size={14} />
                                ),
                            },
                            {
                                key: "createMissingTables",
                                label: "Create Missing Tables",
                                value: s.createMissingTables,
                                desc: "Create tables in the target schema if they don't exist.",
                                icon: (
                                    <TableConfigIcon size={14} />
                                ),
                            },
                        ]
                        : [];

                const BoolPill = ({ on }: { on: boolean }) => (
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border",
                            on
                                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                                : "bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        )}
                    >
                        <span className={cn("w-1.5 h-1.5 rounded-full", on ? "bg-green-500" : "bg-slate-500")} />
                        {on ? "Enabled" : "Disabled"}
                    </span>
                );

                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {rows.map((r) => (
                            <div
                                key={r.key}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
                            >
                                <dl className="space-y-1.5">
                                    <dt className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                        <span className="text-slate-500 dark:text-slate-400">{r.icon}</span>
                                        {r.label}
                                    </dt>
                                    <dd className="text-base font-mono font-medium">
                                        {typeof r.value === "boolean" ? (
                                            <BoolPill on={r.value} />
                                        ) : (
                                            <span className="text-blue-700 dark:text-blue-300">{r.value}</span>
                                        )}
                                    </dd>
                                    <dd className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{r.desc}</dd>
                                </dl>
                            </div>
                        ))}
                    </div>
                );
            })()}
        </CardContent>
    </Card>
);

// --- Main Preview Component ---

interface Step8PreviewProps {
    config: MigrationConfig;
    onEditStep: (step: number) => void;
    setView: (view: string, params?: any) => void;
}

const Step8_Preview: React.FC<Step8PreviewProps> = ({ config, onEditStep, setView }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const migrateItem = config.migration.migrateItems[0];
    const [mappingQuery, setMappingQuery] = useState("");

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            await apiClient.createJobDefinition(config);
            setView('definitions');
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!migrateItem) {
        return <div className="text-center text-slate-500 dark:text-slate-400">Configuration is not available.</div>;
    }

    const stepsCompleted = 7;
    const totalSteps = 7;
    const progressPercentage = (stepsCompleted / totalSteps) * 100;

    return (
        <div className="space-y-8">
            {/* Header Zone */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700/60 shadow-sm">
                {/* Left: Icon + Title */}
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 w-10 h-10 flex items-center justify-center rounded-full">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Migration Summary</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Review configuration before executing</p>
                    </div>
                </div>

                {/* Right: Progress */}
                <div className="flex items-center gap-3 w-64">
                    <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {stepsCompleted}/{totalSteps} steps
                    </span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>


            <div className="space-y-8">
                {/* Connections */}
                <SectionHeader icon={<Database size={18} />} title="Connections" />
                <ConnectionSummary config={config} />

                {/* Source Tables */}
                <div>
                    <SectionHeader icon={<Table size={18} />} title="Source Tables" />
                </div>
                <TableSourceSummary migrateItem={migrateItem} />

                {/* Column Mappings */}
                <div>
                    <SectionHeader icon={<ArrowRightLeft size={18} />} title="Column Mappings" />
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                >
                                    {config?.migration.migrateItems[0].source.names[0]}
                                </Badge>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Column Mappings
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {(config?.migration.migrateItems[0].map?.mappings?.length ?? 0)} total
                                </span>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <input
                                    value={mappingQuery}
                                    onChange={(e) => setMappingQuery(e.target.value)}
                                    placeholder="Search columns…"
                                    className="h-8 w-52 rounded-md bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-3 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <colgroup>
                                    <col className="w-[45%]" />
                                    <col className="w-[10%]" />
                                    <col className="w-[45%]" />
                                </colgroup>

                                <thead className="sticky top-0 z-[1] bg-gray-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                                            Source Column
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">
                                            {/* arrow col */}
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                                            Destination Column
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {(Object.entries(config?.migration.migrateItems[0].map.mappings ?? [])
                                        .filter(([_, m]) => {
                                            const src = renderExpression(m.source).toLowerCase();
                                            const dst = (m.target ?? "").toLowerCase();
                                            const q = mappingQuery.trim().toLowerCase();
                                            return !q || src.includes(q) || dst.includes(q);
                                        }) as Array<[string, { source: Expression; target: string }]>).map(
                                            ([key, m], idx) => (
                                                <tr
                                                    key={key ?? idx}
                                                    className="hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-colors"
                                                >
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            {/* tiny badge to hint if it's derived (function/arithmetic/condition) */}
                                                            {!isLookup(m.source) && !isIdentifier(m.source) && !isLiteral(m.source) ? (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                                                                    Expr
                                                                </span>
                                                            ) : null}
                                                            <span
                                                                title={renderExpression(m.source)}
                                                                className="font-mono text-slate-700 dark:text-slate-300 block truncate"
                                                            >
                                                                {renderExpression(m.source)}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-2.5 text-center text-slate-400">→</td>

                                                    <td className="px-4 py-2.5">
                                                        <span
                                                            title={m.target}
                                                            className="font-mono font-medium text-slate-900 dark:text-white block truncate"
                                                        >
                                                            {m.target}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                </tbody>
                            </table>

                            {/* Empty state on filter */}
                            {mappingQuery &&
                                (Object.entries(config?.migration.migrateItems[0].map.mappings ?? []).filter(([_, m]) => {
                                    const src = renderExpression(m.source).toLowerCase();
                                    const dst = (m.target ?? "").toLowerCase();
                                    const q = mappingQuery.trim().toLowerCase();
                                    return !q || src.includes(q) || dst.includes(q);
                                }).length === 0) && (
                                    <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
                                        No mappings match “{mappingQuery}”.
                                    </div>
                                )}
                        </div>
                    </div>
                </div>

                {/* Settings */}
                <div>
                    <SectionHeader icon={<Settings size={18} />} title="Settings" />
                </div>
                <SettingsSummary settings={migrateItem.settings} />
            </div>
        </div >
    );
};

export default Step8_Preview;
