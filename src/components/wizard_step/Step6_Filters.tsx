import { Plus, X } from "lucide-react";
import { TableMetadata } from "../../types/Metadata";
import { ConditionExpr, Expression, LiteralExpr, LookupExpr, MigrateItem, MigrationConfig } from "../../types/MigrationConfig";
import Button from "../common/v2/Button";
import Card from "../common/v2/Card";
import CardHeader from "../common/v2/CardHeader";
import AllAvailableTablesProvider from "./AllAvailableTablesProvider";
import ColumnSelector from "../common/v2/ColumnSelector";
import { useMemo } from "react";
import Select from "../common/v2/Select";
import Input from "../common/v2/Input";

const isLookup = (expr?: Expression): expr is LookupExpr => !!(expr as LookupExpr)?.Lookup;
const isCondition = (expr?: Expression): expr is ConditionExpr => !!(expr as ConditionExpr)?.Condition;
const isLiteral = (expr?: Expression): expr is LiteralExpr => !!(expr as LiteralExpr)?.Literal;

const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL'];

type UIFilter = {
    id: string; // Unique ID for React key
    left: { entity: string; column: string | null };
    op: string;
    right: string; // The value is stored as a simple string for the input
};


const flattenExpressionToUIFilters = (expression?: Expression): UIFilter[] => {
    if (!expression) return [];

    const filters: UIFilter[] = [];
    let current: Expression | undefined = expression;
    let i = 0;

    // Traverse the nested AND conditions
    while (current && isCondition(current) && current.Condition.op.toUpperCase() === 'AND') {
        const rightCondition = current.Condition.right;
        if (isCondition(rightCondition)) {
            const left = getLookupData(rightCondition.Condition.left);
            const rightValue = getLiteralValue(rightCondition.Condition.right);
            filters.push({
                id: `filter-${i++}`,
                left: { entity: left.entity, column: left.column },
                op: rightCondition.Condition.op,
                right: rightValue,
            });
        }
        current = current.Condition.left;
    }

    // Add the last (or only) condition
    if (current && isCondition(current)) {
        const left = getLookupData(current.Condition.left);
        const rightValue = getLiteralValue(current.Condition.right);
        filters.push({
            id: `filter-${i++}`,
            left: { entity: left.entity, column: left.column },
            op: current.Condition.op,
            right: rightValue,
        });
    }

    return filters.reverse(); // Reverse to show in the order they were added
};

const buildExpressionFromUIFilters = (filters: UIFilter[]): Expression | null => {
    if (filters.length === 0) return null;

    // Convert UI filters to ConditionExpr array
    const conditions: ConditionExpr[] = filters.map(f => ({
        Condition: {
            op: f.op,
            left: { Lookup: { entity: f.left.entity, field: f.left.column, key: '' } },
            right: { Literal: { String: f.right } }, // Store value as a string literal
        }
    }));

    // Nest the conditions with 'AND'
    let expression: Expression = conditions[0];
    for (let i = 1; i < conditions.length; i++) {
        expression = {
            Condition: {
                op: 'AND',
                left: expression,
                right: conditions[i],
            }
        };
    }
    return expression;
};

const getLookupData = (expr?: Expression): { entity: string; column: string | null } => {
    if (isLookup(expr)) {
        return { entity: expr.Lookup.entity || '', column: expr.Lookup.field };
    }
    return { entity: '', column: null };
};

const getLiteralValue = (expr?: Expression): string => {
    if (isLiteral(expr)) {
        // Handle different literal types if necessary
        return expr.Literal.String ?? '';
    }
    return '';
};

type Step6_FiltersProps = {
    config: MigrationConfig;
    migrateItem: MigrateItem;
    metadata: Record<string, TableMetadata> | null;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
};

const Step6_Filters = ({ config, migrateItem, metadata, setConfig }: Step6_FiltersProps) => {
    const uiFilters = useMemo(
        () => flattenExpressionToUIFilters(migrateItem.filter?.expression ?? undefined),
        [migrateItem.filter]
    );

    const updateFilterStep = (newExpression: Expression | null) => {
        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            const index = 0; // Assuming single migrateItem for simplicity
            if (index > -1) {
                if (!newConfig.migration.migrateItems[index].filter) {
                    newConfig.migration.migrateItems[index].filter = { expression: newExpression };
                } else {
                    newConfig.migration.migrateItems[index].filter.expression = newExpression;
                }
            }
            return newConfig;
        });
    };

    const addFilter = () => {
        const newFilter: UIFilter = {
            id: `filter-${Date.now()}`,
            left: { entity: '', column: null },
            op: '=',
            right: '',
        };
        const newUIFilters = [...uiFilters, newFilter];
        const newExpression = buildExpressionFromUIFilters(newUIFilters);
        updateFilterStep(newExpression);
    };

    const removeFilter = (id: string) => {
        const newUIFilters = uiFilters.filter(f => f.id !== id);
        const newExpression = buildExpressionFromUIFilters(newUIFilters);
        updateFilterStep(newExpression);
    };

    const updateFilter = (id: string, field: 'op' | 'right', value: string) => {
        const newUIFilters = uiFilters.map(f => {
            if (f.id !== id) return f;
            return { ...f, [field]: value };
        });
        const newExpression = buildExpressionFromUIFilters(newUIFilters);
        updateFilterStep(newExpression);
    };

    const updateFilterColumn = (id: string, field: 'entity' | 'column', value: string) => {
        const newUIFilters = uiFilters.map(f => {
            if (f.id !== id) return f;
            const newLeft = { ...f.left, [field]: value };
            if (field === 'entity') {
                newLeft.column = null; // Reset column when table changes
            }
            return { ...f, left: newLeft };
        });
        const newExpression = buildExpressionFromUIFilters(newUIFilters);
        updateFilterStep(newExpression);
    };

    return (
        <AllAvailableTablesProvider migrateItem={migrateItem} metadata={metadata}>
            {(allAvailableTables) => (
                <Card>
                    <CardHeader title="Filters (WHERE Clause)" subtitle="Filter the data to be migrated based on specific conditions." />
                    <div className="p-6">
                        <div className="flex justify-end mb-6">
                            <Button onClick={addFilter} variant="secondary">
                                <Plus size={16} className="mr-2" />
                                Add Filter
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {uiFilters.length === 0 ? (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-8 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg">No filters added. All data will be migrated.</p>
                            ) : (
                                uiFilters.map((filter, index) => (
                                    <div key={filter.id} className={`grid grid-cols-1 md:grid-cols-10 gap-2 items-center p-4 rounded-lg ${index % 2 === 0 ? 'bg-slate-50/80 dark:bg-slate-700/50' : 'bg-white/80 dark:bg-slate-800/40'}`}>
                                        <div className="md:col-span-4">
                                            <ColumnSelector
                                                allTables={allAvailableTables}
                                                selectedTable={filter.left.entity}
                                                selectedColumn={filter.left.column || ''}
                                                onTableChange={(val) => updateFilterColumn(filter.id, 'entity', val)}
                                                onColumnChange={(val) => updateFilterColumn(filter.id, 'column', val)}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Select
                                                value={filter.op}
                                                onChange={e => updateFilter(filter.id, 'op', e.target.value)}
                                                options={OPERATORS.map(op => ({ value: op, label: op }))}
                                                placeholder="Operator"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            {!['IS NULL', 'IS NOT NULL'].includes(filter.op) && (
                                                <Input
                                                    value={filter.right}
                                                    onChange={e => updateFilter(filter.id, 'op', e.target.value)}
                                                    placeholder="Value..."
                                                />
                                            )}
                                        </div>
                                        <div className="md:col-span-1 text-right">
                                            <button onClick={() => removeFilter(filter.id)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Card>
            )}
        </AllAvailableTablesProvider>
    );
};

export default Step6_Filters;