import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, FolderPlus, CircleDot } from 'lucide-react';
import AllAvailableTablesProvider from './AllAvailableTablesProvider';
import { ConditionExpr, Expression, LiteralExpr, LookupExpr, MigrateItem, MigrationConfig, FunctionCallExpr } from '../../types/MigrationConfig';
import { TableMetadata } from '../../types/Metadata';
import Card from '../common/v2/Card';
import CardHeader from '../common/v2/CardHeader';
import Button from '../common/v2/Button';
import ColumnSelector from '../common/v2/ColumnSelector';
import Select from '../common/v2/Select';
import Input from '../common/v2/Input';

// --- Type Guards ---
const isLookup = (expr?: Expression): expr is LookupExpr => !!(expr as LookupExpr)?.Lookup;
const isCondition = (expr?: Expression): expr is ConditionExpr => !!(expr as ConditionExpr)?.Condition;
const isLiteral = (expr?: Expression): expr is LiteralExpr => !!(expr as LiteralExpr)?.Literal;
const isFunctionCall = (expr?: Expression): expr is FunctionCallExpr => Array.isArray((expr as FunctionCallExpr)?.FunctionCall);

// --- UI State Types ---
type UINode = UICondition | UIGroup;

type UICondition = {
    type: 'condition';
    id: string;
    left: { entity: string; column: string | null };
    op: string;
    right: string;
};

type UIGroup = {
    type: 'group';
    id: string;
    op: 'AND' | 'OR';
    children: UINode[];
};

// --- Data Transformation Functions ---

const getLookupData = (expr?: Expression): { entity: string; column: string | null } => {
    if (isLookup(expr)) return { entity: expr.Lookup.entity || '', column: expr.Lookup.key };
    return { entity: '', column: null };
};

const getLiteralValue = (expr?: Expression): string => {
    if (isLiteral(expr)) {
        if (expr.Literal.String !== undefined) return expr.Literal.String;
        if (expr.Literal.Integer !== undefined) return String(expr.Literal.Integer);
        if (expr.Literal.Float !== undefined) return String(expr.Literal.Float);
        if (expr.Literal.Boolean !== undefined) return String(expr.Literal.Boolean);
    }
    return '';
};

/**
 * Converts the config's Expression tree into a UI-friendly tree.
 */
const expressionToUINode = (expression?: Expression | null): UINode | null => {
    const expr: Expression | undefined = expression === null ? undefined : expression;
    if (isFunctionCall(expr)) {
        const [op, args] = expr.FunctionCall;
        return {
            type: 'group',
            id: `group-${Date.now()}-${Math.random()}`,
            op: op.toUpperCase() === 'OR' ? 'OR' : 'AND',
            children: args.map(arg => expressionToUINode(arg)).filter(Boolean) as UINode[],
        };
    }

    if (isCondition(expr)) {
        const { op, left, right } = expr.Condition;
        return {
            type: 'condition',
            id: `condition-${Date.now()}-${Math.random()}`,
            left: getLookupData(left),
            op: op,
            right: getLiteralValue(right),
        };
    }

    return null;
};

/**
 * Converts the UI tree back into a config-compatible Expression tree.
 */
const uiNodeToExpression = (node: UINode): Expression | null => {
    if (node.type === 'condition') {
        if (!node.left.column || !node.op) return null;

        let rightExpr: Expression;
        const num = Number(node.right);
        if (!isNaN(num) && String(num) === node.right) {
            rightExpr = { Literal: { Integer: num } };
        } else {
            rightExpr = { Literal: { String: node.right } };
        }

        return {
            Condition: {
                op: OPERATORS_MAP[node.op] || node.op,
                left: { Lookup: { entity: node.left.entity, key: node.left.column, field: '' } },
                right: rightExpr,
            },
        };
    }

    if (node.type === 'group') {
        const childrenExpr = node.children.map(uiNodeToExpression).filter(Boolean) as Expression[];
        return {
            FunctionCall: [node.op, childrenExpr],
        };
    }

    return null;
};


// --- Component ---

type Step6_FiltersProps = {
    config: MigrationConfig;
    migrateItem: MigrateItem;
    metadata: Record<string, TableMetadata> | null;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
};

const Step6_Filters: React.FC<Step6_FiltersProps> = ({ config, migrateItem, metadata, setConfig }) => {
    const [rootNode, setRootNode] = useState<UIGroup>(() => {
        const expr = migrateItem.filter?.expression;
        const node = expressionToUINode(expr);
        if (node && node.type === 'group') {
            return node;
        }
        return { type: 'group', id: 'root', op: 'AND', children: node ? [node] : [] };
    });

    useEffect(() => {
        const newExpression = uiNodeToExpression(rootNode);

        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            const index = 0; // Assuming single migration item

            if (!newConfig.migration.migrateItems[index].filter) {
                newConfig.migration.migrateItems[index].filter = { expression: newExpression };
            } else {
                newConfig.migration.migrateItems[index].filter.expression = newExpression;
            }
            return newConfig;
        });
    }, [rootNode, setConfig]);

    const updateNodeByPath = useCallback((path: string[], updater: (node: UINode) => UINode) => {
        setRootNode(currentRoot => {
            const newRoot = structuredClone(currentRoot);
            if (path.length === 0) return currentRoot;

            if (path.length === 1 && path[0] === newRoot.id) {
                return updater(newRoot) as UIGroup;
            }

            const parentPath = path.slice(1, -1);
            const targetId = path[path.length - 1];

            let parentGroup = newRoot;
            for (const id of parentPath) {
                const nextNode = parentGroup.children.find((c: UINode) => c.id === id);
                if (nextNode && nextNode.type === 'group') {
                    parentGroup = nextNode;
                } else {
                    console.error("Invalid path for update");
                    return currentRoot;
                }
            }

            const targetIndex = parentGroup.children.findIndex((c: UINode) => c.id === targetId);
            if (targetIndex !== -1) {
                parentGroup.children[targetIndex] = updater(parentGroup.children[targetIndex]);
            }
            return newRoot;
        });
    }, []);

    const modifyNodeByPath = useCallback((path: string[], modification: 'add-condition' | 'add-group' | 'remove') => {
        setRootNode(currentRoot => {
            const newRoot = structuredClone(currentRoot);

            if (modification === 'remove') {
                if (path.length <= 1) return currentRoot; // Cannot remove root

                const parentPath = path.slice(1, -1);
                const idToRemove = path[path.length - 1];

                let parentGroup = newRoot;
                for (const id of parentPath) {
                    const nextNode = parentGroup.children.find((c: UINode) => c.id === id);
                    if (nextNode && nextNode.type === 'group') {
                        parentGroup = nextNode;
                    } else {
                        console.error("Invalid parent path for removal");
                        return currentRoot;
                    }
                }
                parentGroup.children = parentGroup.children.filter((c: UINode) => c.id !== idToRemove);

            } else { // Add condition or group
                let targetGroup = newRoot;
                if (path.length > 0 && path[0] !== newRoot.id) {
                    console.error("Path does not start with root ID");
                    return currentRoot;
                }
                const traversalPath = path.slice(1);

                for (const id of traversalPath) {
                    const nextNode = targetGroup.children.find((c: UINode) => c.id === id);
                    if (nextNode && nextNode.type === 'group') {
                        targetGroup = nextNode;
                    } else {
                        console.error("Invalid path for addition. Could not find group with id:", id);
                        return currentRoot;
                    }
                }

                if (modification === 'add-condition') {
                    targetGroup.children.push({ type: 'condition', id: `c-${Date.now()}-${Math.random()}`, left: { entity: '', column: null }, op: '=', right: '' });
                } else if (modification === 'add-group') {
                    targetGroup.children.push({ type: 'group', id: `g-${Date.now()}-${Math.random()}`, op: 'AND', children: [] });
                }
            }

            return newRoot;
        });
    }, []);


    return (
        <AllAvailableTablesProvider migrateItem={migrateItem} metadata={metadata}>
            {(allAvailableTables) => (
                <Card>
                    <CardHeader title="Filters (WHERE Clause)" subtitle="Filter the data to be migrated based on specific conditions." />
                    <div className="p-6">
                        <FilterNode
                            node={rootNode}
                            path={[]}
                            allAvailableTables={allAvailableTables}
                            onUpdate={updateNodeByPath}
                            onModify={modifyNodeByPath}
                        />
                    </div>
                </Card>
            )}
        </AllAvailableTablesProvider>
    );
};


// --- Child Components for UI Rendering ---

const OPERATORS = ['=', '!=', '>', '<', '>=', '<='];
const OPERATORS_MAP: Record<string, string> = {
    '=': 'Equal',
    '!=': 'NotEqual',
    '>': 'GreaterThan',
    '<': 'LessThan',
    '>=': 'GreaterThanOrEqual',
    '<=': 'LessThanOrEqual',
};

type FilterNodeProps = {
    node: UINode;
    path: string[];
    allAvailableTables: TableMetadata[];
    onUpdate: (path: string[], updater: (node: UINode) => UINode) => void;
    onModify: (path: string[], modification: 'add-condition' | 'add-group' | 'remove') => void;
};

const FilterNode: React.FC<FilterNodeProps> = ({ node, ...props }) => {
    if (node.type === 'group') {
        return <FilterGroup node={node} {...props} />;
    }
    return <FilterCondition node={node} {...props} />;
};

const FilterGroup: React.FC<{ node: UIGroup } & Omit<FilterNodeProps, 'node'>> = ({ node, path, allAvailableTables, onUpdate, onModify }) => {
    const isRoot = path.length === 0;
    // The path to the current group node itself
    const currentPath = isRoot ? [node.id] : [...path, node.id];

    return (
        <div className={`pl-4 border-l-2 ${node.op === 'AND' ? 'border-sky-500' : 'border-amber-500'} ${isRoot ? 'border-none pl-0' : 'pt-2'}`}>
            <div className="flex items-center gap-4 mb-2 flex-wrap">
                <div className="flex items-center rounded-full border border-slate-300 dark:border-slate-600">
                    <button onClick={() => onUpdate(currentPath, n => ({ ...(n as UIGroup), op: 'AND' }))} className={`px-3 py-1 text-xs font-semibold rounded-l-full transition-colors ${node.op === 'AND' ? 'bg-sky-500 text-white' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>AND</button>
                    <button onClick={() => onUpdate(currentPath, n => ({ ...(n as UIGroup), op: 'OR' }))} className={`px-3 py-1 text-xs font-semibold rounded-r-full transition-colors ${node.op === 'OR' ? 'bg-amber-500 text-white' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>OR</button>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => onModify(currentPath, 'add-condition')} variant="secondary"><Plus size={14} className="mr-1.5" />Condition</Button>
                    <Button onClick={() => onModify(currentPath, 'add-group')} variant="secondary"><FolderPlus size={14} className="mr-1.5" />Group</Button>
                </div>
                {!isRoot && (
                    <button onClick={() => onModify(currentPath, 'remove')} className="ml-auto text-slate-400 hover:text-red-600 dark:hover:text-red-400"><X size={16} /></button>
                )}
            </div>
            <div className="space-y-2 mt-3">
                {node.children.map((child) => (
                    <div key={child.id} className="flex items-start gap-2">
                        <CircleDot size={12} className={`mt-3 flex-shrink-0 ${node.op === 'AND' ? 'text-sky-500' : 'text-amber-500'}`} />
                        <div className="w-full">
                            <FilterNode
                                node={child}
                                path={currentPath}
                                allAvailableTables={allAvailableTables}
                                onUpdate={onUpdate}
                                onModify={onModify}
                            />
                        </div>
                    </div>
                ))}
                {node.children.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 pl-5 py-2">This group is empty. Add a condition or another group.</p>
                )}
            </div>
        </div>
    );
};

const FilterCondition: React.FC<{ node: UICondition } & Omit<FilterNodeProps, 'node'>> = ({ node, path, allAvailableTables, onUpdate, onModify }) => {
    const currentPath = [...path, node.id];
    return (
        <div className="grid grid-cols-1 md:grid-cols-10 gap-2 items-center w-full bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-lg">
            <div className="md:col-span-4">
                <ColumnSelector
                    allTables={allAvailableTables}
                    selectedTable={node.left.entity}
                    selectedColumn={node.left.column || ''}
                    onTableChange={(val) => onUpdate(currentPath, n => ({ ...(n as UICondition), left: { entity: val, column: null } }))}
                    onColumnChange={(val) => onUpdate(currentPath, n => ({ ...(n as UICondition), left: { ...((n as UICondition).left), column: val } }))}
                />
            </div>
            <div className="md:col-span-2">
                <Select
                    value={node.op}
                    onChange={e => onUpdate(currentPath, n => ({ ...(n as UICondition), op: e.target.value }))}
                    options={OPERATORS.map(op => ({ value: op, label: op }))}
                    placeholder="Operator"
                />
            </div>
            <div className="md:col-span-3">
                {!['IS NULL', 'IS NOT NULL'].includes(node.op) && (
                    <Input
                        value={node.right}
                        onChange={e => onUpdate(currentPath, n => ({ ...(n as UICondition), right: e.target.value }))}
                        placeholder="Value..."
                    />
                )}
            </div>
            <div className="md:col-span-1 text-right">
                <button onClick={() => onModify(currentPath, 'remove')} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default Step6_Filters;
