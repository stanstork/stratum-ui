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

// --- Type Guards ---
const isLookup = (expr: Expression): expr is LookupExpr => !!(expr as LookupExpr)?.Lookup;
const isLiteral = (expr: Expression): expr is LiteralExpr => !!(expr as LiteralExpr)?.Literal;
const isFunctionCall = (expr: Expression): expr is FunctionCallExpr => Array.isArray((expr as FunctionCallExpr)?.FunctionCall);
const isArithmetic = (expr: Expression): expr is ArithmeticExpr => !!(expr as ArithmeticExpr)?.Arithmetic;
const isCondition = (expr: Expression): expr is ConditionExpr => !!(expr as ConditionExpr)?.Condition;


const COMPARATOR_MAP: Record<string, string> = {
    'Equal': '=',
    'NotEqual': '!=',
    'GreaterThan': '>',
    'GreaterThanOrEqual': '>=',
    'LessThan': '<',
    'LessThanOrEqual': '<=',
};

const ARITHMETIC_OPERATORS: Record<string, string> = {
    'Add': '+',
    'Subtract': '-',
    'Multiply': '*',
    'Divide': '/',
};

// --- Render Helpers ---

// Helper function to render any Expression type into a readable string
const renderExpression = (expr?: Expression | null): string => {
    if (!expr) return 'N/A';

    if (isLookup(expr)) {
        const lookup = expr.Lookup;
        return `${lookup.entity}.${lookup.key || '?'}`;
    }
    if (isLiteral(expr)) {
        const literal = expr.Literal;
        if (literal.String !== undefined) return `'${literal.String}'`;
        if (literal.Integer !== undefined) return literal.Integer.toString();
        if (literal.Float !== undefined) return literal.Float.toString();
        if (literal.Boolean !== undefined) return literal.Boolean.toString().toUpperCase();
        return 'NULL';
    }
    if (isArithmetic(expr)) {
        const arithmetic = expr.Arithmetic;
        return `(${renderExpression(arithmetic.left)} ${ARITHMETIC_OPERATORS[arithmetic.operator]} ${renderExpression(arithmetic.right)})`;
    }
    if (isFunctionCall(expr)) {
        const [name, args] = expr.FunctionCall;
        const renderedArgs = args.map(renderExpression).join(', ');
        return `${name}(${renderedArgs})`;
    }
    if (isCondition(expr)) {
        const condition = expr.Condition;
        return `(${renderExpression(condition.left)} ${COMPARATOR_MAP[condition.op]} ${renderExpression(condition.right)})`;
    }

    return 'Unknown Expression';
};

// A dedicated component to render the potentially nested filter tree
const FilterTree: React.FC<{ expression: Expression }> = ({ expression }) => {
    // Check if it's a FunctionCall representing a logical group (AND/OR)
    if (isFunctionCall(expression)) {
        const [op, args] = expression.FunctionCall;
        if ((op.toUpperCase() === 'AND' || op.toUpperCase() === 'OR') && Array.isArray(args)) {
            return (
                <div className="pl-4 border-l-2 border-slate-300 dark:border-slate-600">
                    <strong className={`font-mono text-xs ${op.toUpperCase() === 'AND' ? 'text-sky-500' : 'text-amber-500'}`}>{op.toUpperCase()}</strong>
                    <div className="flex flex-col gap-1 mt-1">
                        {args.length > 0 ? (
                            args.map((arg, i) => <FilterTree key={i} expression={arg} />)
                        ) : (
                            <p className="text-slate-500 text-sm italic">Empty group</p>
                        )}
                    </div>
                </div>
            );
        }
    }

    // Otherwise, it's a simple condition or another expression type
    return (
        <p>
            <code className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-md">
                {renderExpression(expression)}
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

                    <ConfigSection title="Source & Destination" icon={<Table size={16} />}>
                        <p><strong>Primary Table:</strong> <code className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-md">{migrateItem.source.names[0]}</code></p>
                        <p><strong>Destination Table:</strong> <code className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-md">{migrateItem.destination.names[0]}</code></p>
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
