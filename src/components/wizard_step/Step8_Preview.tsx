import React, { useState } from 'react';
import { ArrowRight, CheckCircle, CheckCircle2, Edit, GitMerge, Loader, AlertTriangle, XCircle, Filter, Settings, Table, Database, ArrowRightLeft } from "lucide-react";
import {
    MigrationConfig, Expression, LookupExpr, LiteralExpr, ConditionExpr, MigrateItem, ArithmeticExpr, FunctionCallExpr, Mapping, JoinCondition
} from "../../types/MigrationConfig";
import Button from "../common/v2/Button";
import apiClient from '../../services/apiClient';

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

// --- Sub-Components for the New UI ---

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
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">Source</p>
            </div>
            <p className="text-sm"><span className="font-medium text-slate-600 dark:text-slate-300">Type:</span> {config.connections.source.dataFormat}</p>
            <p className="text-sm"><span className="font-medium text-slate-600 dark:text-slate-300">Server:</span> {config.connections.source.database}</p>
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
            <p className="text-sm"><span className="font-medium text-slate-600 dark:text-slate-300">Server:</span> {config.connections.dest.database}</p>
        </div>
    </div>
);

const TableMappingSummary: React.FC<{ migrateItem: MigrateItem }> = ({ migrateItem }) => (
    <div className="flex items-center justify-center gap-4 md:gap-8">
        <div className="flex-1 flex items-center gap-3 p-4">
            <Table size={20} className="text-green-500 flex-shrink-0" />
            <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">SOURCE TABLE</p>
                <p className="font-mono text-base text-slate-800 dark:text-slate-200">{migrateItem.source.names[0]}</p>
            </div>
        </div>
        <ArrowRight size={24} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3 p-4">
            <Table size={20} className="text-blue-500 flex-shrink-0" />
            <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">DESTINATION TABLE</p>
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
                {/* <p className="text-xs text-slate-400">Type: String</p> */}
            </div>
            <ArrowRight size={20} className="text-slate-400" />
            <div className="flex-1">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">DESTINATION</p>
                <p className="font-mono text-sm text-slate-700 dark:text-slate-200">{mapping.target}</p>
                {/* <p className="text-xs text-slate-400">Type: VARCHAR(255)</p> */}
                {status === 'warning' && <p className="text-xs text-amber-600 dark:text-amber-400">Type Mismatch: INT</p>}
                {status === 'error' && <p className="text-xs text-red-600 dark:text-red-400">Required Field</p>}
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
                <p className="text-xs font-semibold mt-1 text-slate-500 dark:text-slate-400">INNER JOIN</p>
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
        { label: "Ignore Constraints", value: settings.ignoreConstraints ? 'Enabled' : 'Disabled' },
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

    return (
        <div className="space-y-6">
            <SectionCard title="Connections" icon={<Database size={20} />}>
                <ConnectionSummary config={config} />
            </SectionCard>

            <SectionCard title="Table Mapping" icon={<Table size={20} />}>
                <TableMappingSummary migrateItem={migrateItem} />
            </SectionCard>

            <SectionCard title="Column Mappings" icon={<ArrowRightLeft size={20} />}>
                <div className="space-y-2">
                    {migrateItem.map.mappings.map((mapping, i) => (
                        <ColumnMappingRow key={i} mapping={mapping} status={'ok'} /> // Status is hardcoded for now
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

            {/* Footer Actions Zone */}
            <div className="pt-6 flex justify-end">
                {error && (
                    <div className="w-full mr-4 p-3 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                <Button onClick={handleSave} variant="primary" disabled={isSaving}>
                    {isSaving && <Loader size={18} className="animate-spin mr-2" />}
                    {isSaving ? 'Saving Migration...' : 'Confirm & Save Migration'}
                </Button>
            </div>
        </div>
    );
};

export default Step8_Preview;
