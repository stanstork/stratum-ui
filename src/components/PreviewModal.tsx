import React from 'react';
import { ArrowRight, ArrowRightLeft, Database, Filter, Link2, Settings, Table, X } from "lucide-react";
import {
    MigrationConfig,
    Expression,
    LookupExpr,
    LiteralExpr,
    ConditionExpr,
    MigrateItem,
    ArithmeticExpr,
    FunctionCallExpr
} from "../types/MigrationConfig";
import Button from "./common/v2/Button";
import ConfigSection from "./common/v2/ConfigSection";

// Helper function to render any Expression type into a readable string
const renderExpression = (expr?: Expression | null): string => {
    if (!expr) return 'N/A';

    if ('Lookup' in expr) {
        const lookup = (expr as LookupExpr).Lookup;
        return `${lookup.entity}.${lookup.field || '?'}`;
    }
    if ('Literal' in expr) {
        const literal = (expr as LiteralExpr).Literal;
        if (literal.String !== undefined) return `'${literal.String}'`;
        if (literal.Integer !== undefined) return literal.Integer.toString();
        if (literal.Float !== undefined) return literal.Float.toString();
        if (literal.Boolean !== undefined) return literal.Boolean.toString().toUpperCase();
        return 'NULL';
    }
    if ('Arithmetic' in expr) {
        const arithmetic = (expr as ArithmeticExpr).Arithmetic;
        return `(${renderExpression(arithmetic.left)} ${arithmetic.operator} ${renderExpression(arithmetic.right)})`;
    }
    if ('FunctionCall' in expr) {
        const func = (expr as FunctionCallExpr).FunctionCall;
        const args = func.arguments.map(renderExpression).join(', ');
        return `${func.name}(${args})`;
    }
    if ('Condition' in expr) {
        const condition = (expr as ConditionExpr).Condition;
        return `(${renderExpression(condition.left)} ${condition.op} ${renderExpression(condition.right)})`;
    }

    return 'Unknown Expression';
};

// A dedicated component to render the potentially nested filter tree
const FilterTree: React.FC<{ expression: Expression }> = ({ expression }) => {
    if (!('Condition' in expression)) {
        return <p>{renderExpression(expression)}</p>;
    }

    const { op, left, right } = (expression as ConditionExpr).Condition;

    // If it's a logical operator (AND/OR), we render a nested list
    if (op.toUpperCase() === 'AND' || op.toUpperCase() === 'OR') {
        return (
            <div className="pl-4 border-l-2 border-slate-300 dark:border-slate-600">
                <strong className={`font-mono text-xs ${op.toUpperCase() === 'AND' ? 'text-sky-500' : 'text-amber-500'}`}>{op.toUpperCase()}</strong>
                <div className="flex flex-col gap-1 mt-1">
                    <FilterTree expression={left} />
                    <FilterTree expression={right} />
                </div>
            </div>
        );
    }

    // Otherwise, it's a simple condition
    return (
        <p>
            <code className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-md">
                {renderExpression(left)} {op} {renderExpression(right)}
            </code>
        </p>
    );
};


interface PreviewModalProps {
    config: MigrationConfig;
    onClose: () => void;
    onConfirm: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ config, onClose, onConfirm }) => {
    // There's typically one primary migration item to summarize
    const migrateItem: MigrateItem | undefined = config.migration.migrateItems[0];

    if (!migrateItem) {
        return (
            <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
                    <div className="p-6 text-center">
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Configuration Error</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">No migration items found in the configuration to preview.</p>
                        <div className="mt-4">
                            <Button onClick={onClose} variant="secondary">Close</Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Migration Summary</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <ConfigSection title="Connections" icon={<Database size={16} />}>
                        <p><strong>From:</strong> {config.connections.source.name}</p>
                        <p><strong>To:</strong> {config.connections.dest.name}</p>
                    </ConfigSection>

                    <ConfigSection title="Source" icon={<Table size={16} />}>
                        <p><strong>Primary Table:</strong> <code className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-md">{migrateItem.source.names[0]}</code></p>
                    </ConfigSection>

                    {migrateItem.load.matches.length > 0 && (
                        <ConfigSection title="Joins" icon={<Link2 size={16} />}>
                            {migrateItem.load.matches.map((join, i) => (
                                <p key={i}>
                                    <strong>#{i + 1}:</strong> JOIN <code className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-md">{('Lookup' in join.right) ? (join.right as LookupExpr).Lookup.entity : 'N/A'}</code> ON <code className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-md">{renderExpression(join.left)} = {renderExpression(join.right)}</code>
                                </p>
                            ))}
                        </ConfigSection>
                    )}

                    <ConfigSection title="Column Mapping" icon={<ArrowRightLeft size={16} />}>
                        <div className="space-y-1">
                            {migrateItem.map.mappings.map((mapping, i) =>
                                <p key={i}>
                                    <code className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-md">{renderExpression(mapping.source)}</code>
                                    <ArrowRight className="inline-block mx-2 text-slate-400 dark:text-slate-500" size={14} />
                                    <code className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-md">{migrateItem.destination.names[0]}.{mapping.target}</code>
                                </p>
                            )}
                        </div>
                    </ConfigSection>

                    {migrateItem.filter.expression && (
                        <ConfigSection title="Filters (WHERE Clause)" icon={<Filter size={16} />}>
                            <FilterTree expression={migrateItem.filter.expression} />
                        </ConfigSection>
                    )}

                    <ConfigSection title="Settings" icon={<Settings size={16} />}>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            {Object.entries(config.migration.settings).map(([key, value]) =>
                                <li key={key}>
                                    <span className="text-slate-500 dark:text-slate-400">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                    <strong className="ml-2">{value != null ? value.toString() : 'N/A'}</strong>
                                </li>
                            )}
                        </ul>
                    </ConfigSection>

                </div>
                <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl flex justify-end gap-3">
                    <Button onClick={onClose} variant="secondary">Close</Button>
                    <Button onClick={onConfirm} variant="primary">Save</Button>
                </div>
            </div>
        </div>
    );
};

export default PreviewModal;
