import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, FolderPlus, CircleDot } from 'lucide-react';
import AllAvailableTablesProvider from './AllAvailableTablesProvider';
import { ConditionExpr, Expression, LiteralExpr, LookupExpr, MigrateItem, MigrationConfig } from '../../types/MigrationConfig';
import { TableMetadata } from '../../types/Metadata';
import Card from '../common/v2/Card';
import CardHeader from '../common/v2/CardHeader';
import Button from '../common/v2/Button';
import ColumnSelector from '../common/v2/ColumnSelector';
import Select from '../common/v2/Select';
import Input from '../common/v2/Input';

const isLookup = (expr?: Expression): expr is LookupExpr => !!(expr as LookupExpr)?.Lookup;
const isCondition = (expr?: Expression): expr is ConditionExpr => !!(expr as ConditionExpr)?.Condition;
const isLiteral = (expr?: Expression): expr is LiteralExpr => !!(expr as LiteralExpr)?.Literal;

const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL'];

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

const getLookupData = (expr?: Expression): { entity: string; column: string | null } => {
    if (isLookup(expr)) return { entity: expr.Lookup.entity || '', column: expr.Lookup.field };
    return { entity: '', column: null };
};

const getLiteralValue = (expr?: Expression): string => {
    if (isLiteral(expr)) return expr.Literal.String ?? '';
    return '';
};

/**
 * Recursively flattens a nested ConditionExpr tree into a UI-friendly tree. (Unchanged)
 */
const flattenExpressionToUINode = (expression?: Expression): UINode | null => {
    if (!isCondition(expression)) return null;

    const { op, left, right } = expression.Condition;
    const groupOp = op.toUpperCase();

    if (groupOp === 'AND' || groupOp === 'OR') {
        const children: UINode[] = [];
        [left, right].forEach(childExpr => {
            const childNode = flattenExpressionToUINode(childExpr);
            if (childNode) {
                if (childNode.type === 'group' && childNode.op === groupOp) {
                    children.push(...childNode.children);
                } else {
                    children.push(childNode);
                }
            }
        });
        return {
            type: 'group',
            id: `group-${Date.now()}-${Math.random()}`,
            op: groupOp as 'AND' | 'OR',
            children,
        };
    } else {
        const leftData = getLookupData(left);
        const rightData = getLiteralValue(right);
        return {
            type: 'condition',
            id: `condition-${Date.now()}-${Math.random()}`,
            left: leftData,
            op,
            right: rightData,
        };
    }
};

/**
 * Recursively builds a nested ConditionExpr tree from a UI tree. (Unchanged)
 * It correctly filters out incomplete conditions.
 */
const buildExpressionFromUINode = (node: UINode): Expression | null => {
    if (node.type === 'condition') {
        if (!node.left.column) return null; // Invalid/incomplete condition, ignore it
        return {
            Condition: {
                op: node.op,
                left: { Lookup: { entity: node.left.entity, field: node.left.column, key: '' } },
                right: { Literal: { String: node.right } },
            },
        };
    }

    if (node.type === 'group') {
        if (node.children.length === 0) return null;

        const validChildren = node.children.map(buildExpressionFromUINode).filter(Boolean) as Expression[];
        if (validChildren.length === 0) return null;

        let expression = validChildren[0];
        for (let i = 1; i < validChildren.length; i++) {
            expression = {
                Condition: {
                    op: node.op,
                    left: expression,
                    right: validChildren[i],
                },
            };
        }
        return expression;
    }

    return null;
};

type Step7_FiltersProps = {
    config: MigrationConfig;
    migrateItem: MigrateItem;
    metadata: Record<string, TableMetadata> | null;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
};

const Step7_Filters: React.FC<Step7_FiltersProps> = ({ config, migrateItem, metadata, setConfig }) => {
    const [rootNode, setRootNode] = useState<UIGroup>(() => {
        const expr = migrateItem.filter?.expression ?? undefined;
        const flattened = flattenExpressionToUINode(expr);

        if (flattened && flattened.type === 'group') {
            return flattened;
        }
        const children = flattened ? [flattened] : [];
        return { type: 'group', id: 'root', op: 'AND', children };
    });

    useEffect(() => {
        const newExpression = buildExpressionFromUINode(rootNode);

        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            const index = 0; // Assuming single migration item for simplicity

            // This check prevents overwriting the filter if it's already gone,
            // or if the user clears all conditions.
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

            if (path.length === 0) {
                const updatedRoot = updater(newRoot);
                return updatedRoot as UIGroup;
            }

            let parent: UIGroup = newRoot;
            for (let i = 0; i < path.length - 1; i++) {
                const nextNode = parent.children.find(c => c.id === path[i]);
                if (nextNode && nextNode.type === 'group') {
                    parent = nextNode;
                } else {
                    console.error("Invalid path for update");
                    return currentRoot; // Abort update, return original state
                }
            }

            const targetId = path[path.length - 1];
            const targetIndex = parent.children.findIndex(c => c.id === targetId);
            if (targetIndex !== -1) {
                parent.children[targetIndex] = updater(parent.children[targetIndex]);
            }
            return newRoot;
        });
    }, [setRootNode]);

    const modifyNodeByPath = useCallback((path: string[], modification: 'add-condition' | 'add-group' | 'remove') => {
        console.log(`Modifying node at path: ${path.join(' > ')} with modification: ${modification}`);
        setRootNode(currentRoot => {
            const newRoot = structuredClone(currentRoot);

            let targetGroup: UIGroup | null = newRoot;
            if (modification === 'remove' && path.length > 0) {
                const parentPath = path.slice(0, -1);
                for (const id of parentPath) {
                    const nextNode = targetGroup?.children.find(c => c.id === id) as UINode;
                    if (nextNode && nextNode.type === 'group') {
                        targetGroup = nextNode;
                    } else {
                        targetGroup = null;
                        break;
                    }
                }
            } else if (modification !== 'remove') {
                for (const id of path) {
                    const nextNode = targetGroup?.children.find(c => c.id === id) as UINode;
                    if (nextNode && nextNode.type === 'group') {
                        targetGroup = nextNode;
                    } else {
                        targetGroup = null;
                        break;
                    }
                }
            }

            if (!targetGroup) {
                console.error("Could not find target group for modification");
                return currentRoot;
            }

            if (modification === 'add-condition') {
                targetGroup.children.push({ type: 'condition', id: `c-${Date.now()}`, left: { entity: '', column: null }, op: '=', right: '' });
            } else if (modification === 'add-group') {
                targetGroup.children.push({ type: 'group', id: `g-${Date.now()}`, op: 'AND', children: [] });
            } else if (modification === 'remove') {
                const idToRemove = path[path.length - 1];
                targetGroup.children = targetGroup.children.filter(c => c.id !== idToRemove);
            }

            return newRoot;
        });
    }, [setRootNode]);


    return (
        <AllAvailableTablesProvider migrateItem={migrateItem} metadata={metadata}>
            {(allAvailableTables) => (
                <Card>
                    <CardHeader title="Filters (WHERE Clause)" subtitle="Filter the data to be migrated based on specific conditions." />
                    <div className="p-6">
                        {rootNode.children.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-500 dark:text-slate-400 mb-4">No filters added. All data will be migrated.</p>
                                <Button onClick={() => modifyNodeByPath([], 'add-condition')} variant="primary">
                                    <Plus size={16} className="mr-2" /> Add Filter Condition
                                </Button>
                            </div>
                        ) : (
                            <FilterNode
                                node={rootNode}
                                path={[]}
                                allAvailableTables={allAvailableTables}
                                onUpdate={updateNodeByPath}
                                onModify={modifyNodeByPath}
                            />
                        )}
                    </div>
                </Card>
            )}
        </AllAvailableTablesProvider>
    );
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

    const handleOpChange = (newOp: 'AND' | 'OR') => {
        onUpdate(path, (n) => ({ ...(n as UIGroup), op: newOp }));
    };

    return (
        <div className={`pl-4 border-l-2 ${node.op === 'AND' ? 'border-sky-500' : 'border-amber-500'} ${isRoot ? 'border-none pl-0' : 'pt-2'}`}>
            <div className="flex items-center gap-4 mb-2 flex-wrap">
                <div className="flex items-center rounded-full border border-slate-300 dark:border-slate-600">
                    <button onClick={() => handleOpChange('AND')} className={`px-3 py-1 text-xs font-semibold rounded-l-full transition-colors ${node.op === 'AND' ? 'bg-sky-500 text-white' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>AND</button>
                    <button onClick={() => handleOpChange('OR')} className={`px-3 py-1 text-xs font-semibold rounded-r-full transition-colors ${node.op === 'OR' ? 'bg-amber-500 text-white' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>OR</button>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => onModify(path, 'add-condition')} variant="secondary"><Plus size={14} className="mr-1.5" />Condition</Button>
                    <Button onClick={() => onModify(path, 'add-group')} variant="secondary"><FolderPlus size={14} className="mr-1.5" />Group</Button>
                </div>
                {!isRoot && (
                    <button onClick={() => onModify(path, 'remove')} className="ml-auto text-slate-400 hover:text-red-600 dark:hover:text-red-400"><X size={16} /></button>
                )}
            </div>
            <div className="space-y-2 mt-3">
                {node.children.map((child) => (
                    <div key={child.id} className="flex items-center gap-2">
                        <CircleDot size={12} className={`mt-1 flex-shrink-0 ${node.op === 'AND' ? 'text-sky-500' : 'text-amber-500'}`} />
                        <div className="w-full">
                            <FilterNode
                                node={child}
                                path={[...path, child.id]}
                                allAvailableTables={allAvailableTables}
                                onUpdate={onUpdate}
                                onModify={onModify}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FilterCondition: React.FC<{ node: UICondition } & Omit<FilterNodeProps, 'node'>> = ({ node, path, allAvailableTables, onUpdate, onModify }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-10 gap-2 items-center w-full">
            <div className="md:col-span-4">
                <ColumnSelector
                    allTables={allAvailableTables}
                    selectedTable={node.left.entity}
                    selectedColumn={node.left.column || ''}
                    onTableChange={(val) => onUpdate(path, n => ({ ...(n as UICondition), left: { entity: val, column: null } }))}
                    onColumnChange={(val) => onUpdate(path, n => ({ ...(n as UICondition), left: { ...((n as UICondition).left), column: val } }))}
                />
            </div>
            <div className="md:col-span-2">
                <Select
                    value={node.op}
                    onChange={e =>
                        onUpdate(path, n =>
                            n.type === 'condition'
                                ? { ...n, op: e.target.value }
                                : n
                        )
                    }
                    options={OPERATORS.map(op => ({ value: op, label: op }))}
                    placeholder="Operator"
                />
            </div>
            <div className="md:col-span-3">
                {!['IS NULL', 'IS NOT NULL'].includes(node.op) && (
                    <Input
                        value={node.right}
                        onChange={e => onUpdate(path, n => ({ ...(n as UICondition), right: e.target.value }))}
                        placeholder="Value..."
                    />
                )}
            </div>
            <div className="md:col-span-1 text-right">
                <button onClick={() => onModify(path, 'remove')} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default Step7_Filters;
