import React, { useState, useEffect } from 'react';
import {
    Play,
    Pencil,
    RefreshCw,
    Database,
    Table,
    ArrowRightLeft,
    GitMerge,
    Filter,
    Settings,
    ArrowRight,
    XCircle,
    ArrowRightIcon,
    DatabaseIcon,
    ChevronRight,
    Server,
    User,
    ArrowLeft,
    Download,
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
    IdentifierExpr,
    MigrateItemDTO,
    getMigrationItem,
} from '../types/MigrationConfig';
import { AnimatePresence, motion } from 'framer-motion';
import { dataFormatLabels } from './Connections';
import { StatusBadge } from '../components/common/Helper';

const isLookup = (expr: Expression): expr is LookupExpr => !!(expr as LookupExpr)?.Lookup;
const isLiteral = (expr: Expression): expr is LiteralExpr => !!(expr as LiteralExpr)?.Literal;
const isFunctionCall = (expr: Expression): expr is FunctionCallExpr => Array.isArray((expr as FunctionCallExpr)?.FunctionCall);
const isArithmetic = (expr: Expression): expr is ArithmeticExpr => !!(expr as ArithmeticExpr)?.Arithmetic;
const isCondition = (expr: Expression): expr is ConditionExpr => !!(expr as ConditionExpr)?.Condition;
const isIdentifier = (expr: Expression): expr is IdentifierExpr => typeof (expr as IdentifierExpr).Identifier === 'string';

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
    if (isIdentifier(expr)) return expr.Identifier;

    return 'Unknown Expression';
};

const ConnectionSummary: React.FC<{ config: MigrationConfig }> = ({ config }) => (
    <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-6">
        {/* Source Card */}
        <div
            className="bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex-1"
        >
            <div className="flex items-center gap-4">
                <DatabaseIcon type={config.connections.source.dataFormat} className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="flex-1 overflow-hidden">
                    <div className="flex items-baseline gap-3">
                        <h3 className="font-bold text-xl text-slate-900 dark:text-slate-50 truncate">{config.connections.source.name}</h3>
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex-shrink-0">{dataFormatLabels[config.connections.source.dataFormat] || config.connections.source.dataFormat}</span>
                    </div>
                </div>
            </div>
            <div className="space-y-3 mt-5 text-sm border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                        <Server size={16} className="text-slate-400 flex-shrink-0" />
                        <span className="font-medium">Host:</span>
                    </div>
                    <span className="truncate font-mono">{config.connections.source.host}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                        <Database size={16} className="text-slate-400 flex-shrink-0" />
                        <span className="font-medium">Database:</span>
                    </div>
                    <span className="truncate font-mono">{config.connections.source.database}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                        <User size={16} className="text-slate-400 flex-shrink-0" />
                        <span className="font-medium">User:</span>
                    </div>
                    <span className="truncate font-mono">{config.connections.source.user}</span>
                </div>
            </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center justify-center py-2 md:py-0">
            <ArrowRight size={32} className="text-slate-400 dark:text-slate-500 transform md:rotate-0 rotate-90" />
        </div>

        {/* Destination Card */}
        <div
            className="bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex-1"
        >
            <div className="flex items-center gap-4">
                <DatabaseIcon type={config.connections.dest.dataFormat} className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 overflow-hidden">
                    <div className="flex items-baseline gap-3">
                        <h3 className="font-bold text-xl text-slate-900 dark:text-slate-50 truncate">{config.connections.dest.name}</h3>
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex-shrink-0">{dataFormatLabels[config.connections.dest.dataFormat] || config.connections.dest.dataFormat}</span>
                    </div>
                </div>
            </div>
            <div className="space-y-3 mt-5 text-sm border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                        <Server size={16} className="text-slate-400 flex-shrink-0" />
                        <span className="font-medium">Host:</span>
                    </div>
                    <span className="truncate font-mono">{config.connections.dest.host}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                        <Database size={16} className="text-slate-400 flex-shrink-0" />
                        <span className="font-medium">Database:</span>
                    </div>
                    <span className="truncate font-mono">{config.connections.dest.database}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                        <User size={16} className="text-slate-400 flex-shrink-0" />
                        <span className="font-medium">User:</span>
                    </div>
                    <span className="truncate font-mono">{config.connections.dest.user}</span>
                </div>
            </div>
        </div>
    </div>
);

const TableMappingSummary: React.FC<{ migrateItem: MigrateItem }> = ({ migrateItem }) => (
    <div className="flex items-center justify-around gap-4 md:gap-6 p-4">
        <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/80">
            <div className="flex items-center justify-center gap-2">
                <Table size={16} className="text-slate-500 dark:text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Source Table</p>
            </div>
            <p className="font-mono text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{migrateItem.source.names[0]}</p>
        </div>
        <div className="flex-shrink-0"><ArrowRight size={24} className="text-indigo-500 dark:text-indigo-400" /></div>
        <div className="flex-1 p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-500/50 text-center transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-500/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/50">
            <div className="flex items-center justify-center gap-2">
                <Table size={16} className="text-indigo-500 dark:text-indigo-300" />
                <p className="text-sm text-indigo-500 dark:text-indigo-300">Destination Table</p>
            </div>
            <p className="font-mono text-xl font-bold text-indigo-800 dark:text-indigo-100 mt-1">{migrateItem.destination.names[0]}</p>
        </div>
    </div>
);

const ColumnMappingDisplay: React.FC<{ migrateItem: MigrateItem }> = ({ migrateItem }) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-500 dark:text-slate-400 px-4">
            <h2 className="w-5/12">Source Field ({migrateItem.source.names[0]})</h2>
            <div className="w-2/12"></div>
            <h2 className="w-5/12">Destination Field ({migrateItem.destination.names[0]})</h2>
        </div>
        {migrateItem.map.mappings.map((mapping, index) => (
            <div key={index} className="flex items-center p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors">
                <div className="w-5/12 font-mono text-sm pr-2">
                    <span className="bg-slate-200 dark:bg-slate-700/50 py-1 px-2 rounded-md text-slate-700 dark:text-slate-300">{renderExpression(mapping.source)}</span>
                </div>
                <div className="w-2/12 flex justify-center"><ArrowRight className="text-indigo-500 dark:text-indigo-400" /></div>
                <div className="w-5/12 font-mono text-sm pl-2">
                    <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 py-1 px-2 rounded-md">{mapping.target}</span>
                </div>
            </div>
        ))}
    </div>
);

const CollapsibleSectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; initialOpen?: boolean }> = ({ title, icon, children, initialOpen = true }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="text-indigo-500">{icon}</div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronRight size={20} className="text-slate-500" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.section
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-700/60">
                            {children}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>
        </div>
    );
};

const JoinSummary: React.FC<{ join: JoinCondition }> = ({ join }) => (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-all hover:border-slate-300 dark:hover:border-slate-600">
        <div className="flex justify-between items-center text-center gap-4">
            <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Source Table</p>
                <p className="font-mono text-base font-bold text-slate-700 dark:text-slate-200 mt-1 truncate">{renderExpression(join.left)?.toString().split('.')[0]}</p>
            </div>
            <div className="flex-shrink-0 text-center">
                <div className="w-12 h-12 flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/20 rounded-full text-indigo-500 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/50">
                    <GitMerge size={24} />
                </div>
                <p className="text-xs mt-1 font-semibold text-indigo-500 dark:text-indigo-400">JOIN</p>
            </div>
            <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Joined Table</p>
                <p className="font-mono text-base font-bold text-slate-700 dark:text-slate-200 mt-1 truncate">{renderExpression(join.right)?.toString().split('.')[0]}</p>
            </div>
        </div>
        <div className="mt-4 text-center bg-slate-100 dark:bg-slate-900/70 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">On Condition</p>
            <code className="text-sm font-mono">
                {renderExpression(join.left)} <span className="text-rose-500 dark:text-rose-400 font-bold mx-2">=</span> {renderExpression(join.right)}
            </code>
        </div>
    </div>
);

const FilterSummary: React.FC<{ expression: Expression | null }> = ({ expression }) => (
    <div className="relative p-4 pl-5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-lg"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">The following WHERE clause will be applied:</p>
        <code className="block text-base font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-md overflow-x-auto">
            {expression ? renderExpression(expression) : 'No filters defined.'}
        </code>
    </div>
);

const SettingsSummary: React.FC<{ settings: MigrateItem['settings'] }> = ({ settings }) => {
    const settingItems = [
        { label: "Batch Size", value: `${settings.batchSize} rows` },
        { label: "Copy Columns", value: settings.copyColumns === 'All' ? "All" : "Mapped Only" },
        { label: "Infer Schema", value: settings.inferSchema ? 'Enabled' : 'Disabled', enabled: settings.inferSchema },
        { label: "Cascade Schema", value: settings.cascadeSchema ? 'Enabled' : 'Disabled', enabled: settings.cascadeSchema },
        { label: "Ignore Constraints", value: settings.ignoreConstraints ? 'Enabled' : 'Disabled', enabled: settings.ignoreConstraints },
        { label: "Create Missing Tables", value: settings.createMissingTables ? 'Enabled' : 'Disabled', enabled: settings.createMissingTables },
    ];
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settingItems.map(item => (
                <div key={item.label} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700/80">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className={`text-base font-semibold ${item.enabled ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>{item.value}</p>
                </div>
            ))}
        </div>
    );
};

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
                const migrationItem = JSON.parse(data.ast)['migration']['migrate_items'][0] as MigrateItemDTO;


                const migrationConfig: MigrationConfig = {
                    name: data.name,
                    description: data.description,
                    migration: {
                        settings: {
                            batchSize: migrationItem.settings.batch_size,
                            csvHeader: migrationItem.settings.csv_header,
                            copyColumns: migrationItem.settings.copy_columns,
                            inferSchema: migrationItem.settings.infer_schema,
                            csvDelimiter: migrationItem.settings.csv_delimiter,
                            csvIdColumn: migrationItem.settings.csv_id_column,
                            cascadeSchema: migrationItem.settings.cascade_schema,
                            ignoreConstraints: migrationItem.settings.ignore_constraints,
                            createMissingTables: migrationItem.settings.create_missing_tables,
                            createMissingColumns: migrationItem.settings.create_missing_columns
                        },
                        migrateItems: [getMigrationItem(migrationItem)],
                    },
                    connections: {
                        source: {
                            id: data.sourceConnection.id,
                            name: data.sourceConnection.name,
                            dataFormat: data.sourceConnection.dataFormat,
                            database: data.sourceConnection.dbName,
                            status: data.sourceConnection.status,
                            host: data.sourceConnection.host,
                            port: data.sourceConnection.port,
                            user: data.sourceConnection.username,
                            description: `${data.sourceConnection.dataFormat} - ${data.sourceConnection.host}:${data.sourceConnection.port}`
                        },
                        dest: {
                            id: data.destinationConnection.id,
                            name: data.destinationConnection.name,
                            dataFormat: data.destinationConnection.dataFormat,
                            database: data.destinationConnection.dbName,
                            status: data.destinationConnection.status,
                            host: data.destinationConnection.host,
                            port: data.destinationConnection.port,
                            user: data.destinationConnection.username,
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
        <div>
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-wrap gap-4 justify-between items-center mb-6 bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/definitions')} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{config.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">{config.description}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600/80 transition-all" aria-label="Edit"><Pencil size={18} /></button>
                        <button className="inline-flex items-center gap-2 h-10 px-6 bg-indigo-600 text-white text-sm font-bold rounded-lg dark:hover:bg-indigo-500 transition-all"><Play size={16} /> Run Migration</button>
                    </div>
                </header>
                <main className="space-y-6">
                    <CollapsibleSectionCard title="Connections" icon={<Database size={20} />}>
                        <ConnectionSummary config={config} />
                    </CollapsibleSectionCard>
                    {migrateItem && (
                        <>
                            <CollapsibleSectionCard title="Table Mapping" icon={<Table size={20} />}>
                                <TableMappingSummary migrateItem={migrateItem} />
                            </CollapsibleSectionCard>

                            {migrateItem.load.matches.length > 0 && (
                                <CollapsibleSectionCard title="Table Joins" icon={<GitMerge size={20} />}>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {migrateItem.load.matches.map((join, i) => (
                                            <JoinSummary key={i} join={join} />
                                        ))}
                                    </div>
                                </CollapsibleSectionCard>
                            )}

                            <CollapsibleSectionCard title="Column Mappings" icon={<ArrowRightLeft size={20} />}>
                                <ColumnMappingDisplay migrateItem={migrateItem} />
                            </CollapsibleSectionCard>

                            {migrateItem.filter.expression && (
                                <CollapsibleSectionCard title="Data Filters" icon={<Filter size={20} />}>
                                    <FilterSummary expression={migrateItem.filter.expression} />
                                </CollapsibleSectionCard>
                            )}

                            <CollapsibleSectionCard title="Migration Settings" icon={<Settings size={20} />}>
                                <SettingsSummary settings={migrateItem.settings} />
                            </CollapsibleSectionCard>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default MigrationDetailsPage;