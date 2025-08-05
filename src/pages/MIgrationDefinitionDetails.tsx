import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Play,
    Pencil,
    Trash2,
    RefreshCw,
    Database,
    Table,
    ArrowRightLeft,
    GitMerge,
    Filter,
    Settings,
    ArrowRight,
    CheckCircle,
    AlertTriangle,
    XCircle,
    ChevronRight,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import {
    MigrationConfig,
    Expression,
    LookupExpr,
    LiteralExpr,
    ConditionExpr,
    MigrateItem,
    ArithmeticExpr,
    FunctionCallExpr,
    Mapping,
    JoinCondition,
    Migration,
} from '../types/MigrationConfig';


// --- Reusable Components from Wizard Preview ---
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

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
            <div className="text-indigo-500">{icon}</div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
        <div className="p-4 md:p-6">{children}</div>
    </div>
);

const ConnectionSummary: React.FC<{ config: MigrationConfig }> = ({ config }) => (
    <div className="flex items-center justify-center gap-4 md:gap-8">
        <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center bg-green-100 dark:bg-green-900/50 rounded-md text-green-600 dark:text-green-300">
                    <Database size={14} />
                </div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">Source</p>
            </div>
            <p className="text-sm"><span className="font-medium text-slate-600 dark:text-slate-300">Type:</span> {config.connections.source.dataFormat}</p>
            <p className="text-sm"><span className="font-medium text-slate-600 dark:text-slate-300">Database:</span> {config.connections.source.database}</p>
        </div>
        <ArrowRight size={24} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <div className="flex-1 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50 space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 rounded-md text-blue-600 dark:text-blue-300">
                    <Database size={14} />
                </div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Destination</p>
            </div>
            <p className="text-sm"><span className="font-medium text-slate-600 dark:text-slate-300">Type:</span> {config.connections.dest.dataFormat}</p>
            <p className="text-sm"><span className="font-medium text-slate-600 dark:text-slate-300">Database:</span> {config.connections.dest.database}</p>
        </div>
    </div>
);

const TableMappingSummary: React.FC<{ migrateItem: MigrateItem }> = ({ migrateItem }) => (
    <div className="flex items-center justify-center gap-4 md:gap-8">
        <div className="flex-1 flex items-center gap-3 p-4">
            <Table size={20} className="text-green-500 flex-shrink-0" />
            <div>
                <p className="text-sm font-semibold text-green-500 dark:text-green-400">SOURCE TABLE</p>
                <p className="font-mono text-base text-slate-800 dark:text-slate-200">{migrateItem.source.names[0]}</p>
            </div>
        </div>
        <ArrowRight size={24} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3 p-4">
            <Table size={20} className="text-blue-500 flex-shrink-0" />
            <div>
                <p className="text-sm font-semibold text-blue-500 dark:text-blue-400">DESTINATION TABLE</p>
                <p className="font-mono text-base text-slate-800 dark:text-slate-200">{migrateItem.destination.names[0]}</p>
            </div>
        </div>
    </div>
);

const ColumnMappingRow: React.FC<{ mapping: Mapping, status: 'ok' | 'warning' | 'error' }> = ({ mapping, status }) => {
    const statusIcons = {
        ok: <CheckCircle size={20} className="text-green-500" />,
        warning: <AlertTriangle size={20} className="text-amber-500" />,
        error: <XCircle size={20} className="text-red-500" />,
    };

    return (
        <div className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0">
            <div className="w-6 flex-shrink-0">{statusIcons[status]}</div>
            <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">SOURCE</p>
                <p className="font-mono text-sm text-slate-700 dark:text-slate-200">{renderExpression(mapping.source)}</p>
            </div>
            <ArrowRight size={20} className="text-slate-400" />
            <div className="flex-1">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">DESTINATION</p>
                <p className="font-mono text-sm text-slate-700 dark:text-slate-200">{mapping.target}</p>
            </div>
        </div>
    );
};

const JoinSummary: React.FC<{ join: JoinCondition }> = ({ join }) => (
    <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center text-center">
            <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">SOURCE TABLE</p>
                <p className="font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">{renderExpression(join.left).split('.')[0]}</p>
            </div>
            <div className="flex-shrink-0 mx-4 text-center">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 rounded-full text-blue-600 dark:text-blue-300">
                    <GitMerge size={20} />
                </div>
            </div>
            <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">JOINED TABLE</p>
                <p className="font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">{renderExpression(join.right).split('.')[0]}</p>
            </div>
        </div>
        <div className="mt-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">On Condition</p>
            <div className="mt-2 inline-block bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600">
                <code className="text-sm text-slate-700 dark:text-slate-200">{renderExpression(join.left)} = {renderExpression(join.right)}</code>
            </div>
        </div>
    </div>
);

const FilterSummary: React.FC<{ expression: Expression | null }> = ({ expression }) => (
    <div className="relative p-4 pl-6 bg-slate-50 dark:bg-slate-900/30 rounded-lg">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-400 rounded-l-lg"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">The following WHERE clause will be applied:</p>
        <code className="block text-sm text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-x-auto">
            {expression ? renderExpression(expression) : 'No filters defined.'}
        </code>
    </div>
);

const SettingsSummary: React.FC<{ settings: MigrateItem['settings'] }> = ({ settings }) => {
    const settingItems = [
        { label: "Batch Size", value: `${settings.batchSize} rows` },
        { label: "Copy Columns", value: settings.copyColumns === 'All' ? "All" : "Mapped Only" },
        { label: "Infer Schema", value: settings.inferSchema ? 'Enabled' : 'Disabled' },
        { label: "Cascade Schema", value: settings.cascadeSchema ? 'Enabled' : 'Disabled' },
        { label: "Ignore Constraints", value: settings.ignoreConstraints ? 'Enabled' : 'Disabled' },
        { label: "Create Missing Tables", value: settings.createMissingTables ? 'Enabled' : 'Disabled' },
    ];
    return (
        <div className="grid grid-cols-2 gap-4">
            {settingItems.map(item => (
                <div key={item.label}>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{item.value}</p>
                </div>
            ))}
        </div>
    );
};


// --- Main Details Page Component ---

const MigrationDetailsPage = () => {
    const { definitionId } = useParams<{ definitionId: string }>();
    const navigate = useNavigate();
    const [config, setConfig] = useState<MigrationConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDefinition = async () => {
            if (!definitionId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const data = await apiClient.getJobDefinition(definitionId);
                const migrationItem = JSON.parse(data.ast)['migration']['migrate_items'][0] as MigrateItem;


                const migrationConfig: MigrationConfig = {
                    name: data.name,
                    description: data.description,
                    migration: {
                        settings: {
                            batchSize: migrationItem.settings.batchSize,
                            csvHeader: migrationItem.settings.csvHeader,
                            copyColumns: migrationItem.settings.copyColumns,
                            inferSchema: migrationItem.settings.inferSchema,
                            csvDelimiter: migrationItem.settings.csvDelimiter,
                            csvIdColumn: migrationItem.settings.csvIdColumn,
                            cascadeSchema: migrationItem.settings.cascadeSchema,
                            ignoreConstraints: migrationItem.settings.ignoreConstraints,
                            createMissingTables: migrationItem.settings.createMissingTables,
                            createMissingColumns: migrationItem.settings.createMissingColumns
                        },
                        migrateItems: [migrationItem]
                    },
                    connections: {
                        source: {
                            id: data.sourceConnection.id,
                            name: data.sourceConnection.name,
                            dataFormat: data.sourceConnection.dataFormat,
                            database: data.sourceConnection.dbName,
                            status: data.sourceConnection.status,
                            description: `${data.sourceConnection.dataFormat} - ${data.sourceConnection.host}:${data.sourceConnection.port}`
                        },
                        dest: {
                            id: data.destinationConnection.id,
                            name: data.destinationConnection.name,
                            dataFormat: data.destinationConnection.dataFormat,
                            database: data.destinationConnection.dbName,
                            status: data.destinationConnection.status,
                            description: `${data.destinationConnection.dataFormat} - ${data.destinationConnection.host}:${data.destinationConnection.port}`
                        }
                    },
                    creation_date: data.createdAt instanceof Date ? data.createdAt.toISOString() : new Date(data.createdAt).toISOString(),
                };
                setConfig(migrationConfig);
            } catch (error) {
                console.error("Failed to fetch migration definition:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDefinition();
    }, [definitionId]);

    if (loading) {
        return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-indigo-500" size={32} /></div>;
    }

    if (!config) {
        return <div className="text-center text-slate-500 dark:text-slate-400">Migration definition not found.</div>;
    }

    const migrateItem = config.migration.migrateItems[0];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <button onClick={() => navigate('/definitions')} className="font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                        Definitions
                    </button>
                    <ChevronRight size={16} />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{config.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700">
                        <Play size={16} /> Run Migration
                    </button>
                    <div className="flex items-center gap-1 border border-slate-300 dark:border-slate-600 rounded-lg p-1">
                        <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" aria-label="Edit">
                            <Pencil size={18} />
                        </button>
                        <button className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors" aria-label="Delete definition">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
            <div>
                <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">{config.name}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{config.description}</p>
            </div>

            {/* Configuration Details */}
            <div className="space-y-6">
                <SectionCard title="Connections" icon={<Database size={20} />}>
                    <ConnectionSummary config={config} />
                </SectionCard>

                {migrateItem && (
                    <>
                        <SectionCard title="Table Mapping" icon={<Table size={20} />}>
                            <TableMappingSummary migrateItem={migrateItem} />
                        </SectionCard>

                        <SectionCard title="Column Mappings" icon={<ArrowRightLeft size={20} />}>
                            <div className="space-y-2">
                                {migrateItem.map.mappings.map((mapping, i) => (
                                    <ColumnMappingRow key={i} mapping={mapping} status={'ok'} />
                                ))}
                                {migrateItem.map.mappings.length === 0 && <p className="text-center text-slate-500 py-4">No columns mapped.</p>}
                            </div>
                        </SectionCard>

                        {migrateItem.load.matches.length > 0 && (
                            <SectionCard title="Table Joins" icon={<GitMerge size={20} />}>
                                <div className="space-y-4">
                                    {migrateItem.load.matches.map((join, i) => (
                                        <JoinSummary key={i} join={join} />
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {migrateItem.filter.expression && (
                            <SectionCard title="Data Filters" icon={<Filter size={20} />}>
                                <FilterSummary expression={migrateItem.filter.expression} />
                            </SectionCard>
                        )}

                        <SectionCard title="Migration Settings" icon={<Settings size={20} />}>
                            <SettingsSummary settings={migrateItem.settings} />
                        </SectionCard>
                    </>
                )}
            </div>
        </div>
    );
};

export default MigrationDetailsPage;

