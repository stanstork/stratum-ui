import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Wand2, Plus, ArrowRight, X, Type, AtSign, Sigma, FunctionSquare, Pilcrow, Check, ListTree, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import AllAvailableTablesProvider from './AllAvailableTablesProvider';
import { Expression, LiteralExpr, LookupExpr, Mapping, MapStep, MigrateItem, MigrationConfig, FunctionCallExpr, ArithmeticExpr } from '../../types/MigrationConfig';
import { TableMetadata } from '../../types/Metadata';
import Button from '../common/v2/Button';
import ColumnSelector from '../common/v2/ColumnSelector';
import Input from '../common/v2/Input';

// --- Type Guards & Helpers ---
const isLookup = (expr: Expression): expr is LookupExpr => !!(expr as LookupExpr)?.Lookup;
const isLiteral = (expr: Expression): expr is LiteralExpr => !!(expr as LiteralExpr)?.Literal;
const isFunctionCall = (expr: Expression): expr is FunctionCallExpr => Array.isArray((expr as FunctionCallExpr)?.FunctionCall);
const isArithmetic = (expr: Expression): expr is ArithmeticExpr => !!(expr as ArithmeticExpr)?.Arithmetic;

type SourceMode = 'lookup' | 'literal' | 'function' | 'arithmetic';

const getSourceMode = (expr: Expression): SourceMode => {
    if (isLookup(expr)) return 'lookup';
    if (isFunctionCall(expr)) return 'function';
    if (isArithmetic(expr)) return 'arithmetic';
    return 'literal';
};

const getEmptyExprForMode = (mode: SourceMode): Expression => {
    switch (mode) {
        case 'lookup':
            return { Lookup: { entity: '', field: null, key: '' } };
        case 'function':
            return { FunctionCall: ['CONCAT', []] };
        case 'arithmetic':
            return { Arithmetic: { left: { Lookup: { entity: '', field: null, key: '' } }, operator: 'Add', right: { Literal: { Integer: 0 } } } };
        case 'literal':
        default:
            return { Literal: { String: '' } };
    }
}

// --- Expression Editor Components ---

interface ExpressionEditorProps {
    expression: Expression;
    allAvailableTables: TableMetadata[];
    onUpdate: (newExpression: Expression) => void;
}

const LiteralEditor: React.FC<ExpressionEditorProps> = ({ expression, onUpdate }) => {
    const value = (expression as LiteralExpr).Literal?.String ?? '';
    return <Input
        value={value}
        onChange={e => onUpdate({ Literal: { String: e.target.value } })}
        placeholder="Enter a static value"
        className="font-mono text-sm"
    />;
};

const FunctionArgumentEditor: React.FC<{
    arg: Expression;
    onUpdate: (newArg: Expression) => void;
    allAvailableTables: TableMetadata[];
}> = ({ arg, onUpdate, allAvailableTables }) => {
    const isArgLookup = isLookup(arg);

    const toggleMode = () => {
        const newArg = isArgLookup ? { Literal: { String: '' } } : { Lookup: { entity: '', field: null, key: '' } };
        onUpdate(newArg);
    };

    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-grow">
                {isArgLookup ? (
                    <ColumnSelector
                        allTables={allAvailableTables}
                        selectedTable={(arg as LookupExpr).Lookup?.entity || ''}
                        selectedColumn={(arg as LookupExpr).Lookup?.key || ''}
                        onTableChange={(val) => onUpdate({ Lookup: { entity: val, key: null, field: '' } })}
                        onColumnChange={(val) => onUpdate({ Lookup: { entity: (arg as LookupExpr).Lookup?.entity || '', key: val, field: '' } })}
                    />
                ) : (
                    <Input
                        value={(arg as LiteralExpr).Literal?.String ?? ''}
                        onChange={e => onUpdate({ Literal: { String: e.target.value } })}
                        placeholder="Literal value..."
                        className="font-mono text-sm"
                    />
                )}
            </div>
            <button
                onClick={toggleMode}
                title={isArgLookup ? "Switch to Literal Value" : "Switch to Column Lookup"}
                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-md flex-shrink-0"
            >
                {isArgLookup ? <Pilcrow size={16} /> : <AtSign size={16} />}
            </button>
        </div>
    );
};


const FunctionCallEditor: React.FC<ExpressionEditorProps> = ({ expression, onUpdate, allAvailableTables }) => {
    const [name, args] = (expression as FunctionCallExpr).FunctionCall;

    const handleNameChange = (newName: string) => onUpdate({ FunctionCall: [newName, args] });
    const handleArgChange = (argIndex: number, newArg: Expression) => {
        const newArgs = [...args];
        newArgs[argIndex] = newArg;
        onUpdate({ FunctionCall: [name, newArgs] });
    };
    const addArg = () => onUpdate({ FunctionCall: [name, [...args, { Literal: { String: '' } }]] });
    const removeArg = (argIndex: number) => onUpdate({ FunctionCall: [name, args.filter((_, i) => i !== argIndex)] });

    return (
        <div className="flex flex-col gap-2">
            <Input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Function Name (e.g. CONCAT)" className="font-mono font-bold" />
            <div className='pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-2 mt-2 pt-2'>
                <h4 className='text-xs font-semibold text-slate-500 dark:text-slate-400'>ARGUMENTS</h4>
                {args.map((arg, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <FunctionArgumentEditor
                            arg={arg}
                            onUpdate={(newArg) => handleArgChange(i, newArg)}
                            allAvailableTables={allAvailableTables}
                        />
                        <button onClick={() => removeArg(i)} className="p-1 text-slate-400 hover:text-red-500 flex-shrink-0"><X size={14} /></button>
                    </div>
                ))}
                <Button onClick={addArg} variant="outline" className='w-full'><Plus size={14} className="mr-2" /> Add Argument</Button>
            </div>
        </div>
    );
};

const ArithmeticEditor: React.FC<ExpressionEditorProps> = ({ expression, onUpdate, allAvailableTables }) => {
    const { left, operator, right } = (expression as ArithmeticExpr).Arithmetic;

    const handleUpdate = (field: 'left' | 'operator' | 'right', value: any) => {
        onUpdate({ Arithmetic: { left, operator, right, ...{ [field]: value } } });
    };

    const operatorOptions = ['Add', 'Subtract', 'Multiply', 'Divide'];

    return (
        <div className="space-y-3">
            <ColumnSelector
                allTables={allAvailableTables}
                selectedTable={(left as LookupExpr).Lookup?.entity || ''}
                selectedColumn={(left as LookupExpr).Lookup?.key || ''}
                onTableChange={(val) => handleUpdate('left', { Lookup: { entity: val, key: null, field: '' } })}
                onColumnChange={(val) => handleUpdate('left', { Lookup: { entity: (left as LookupExpr).Lookup?.entity, key: val, field: '' } })}
            />
            <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-900 w-fit">
                    {operatorOptions.map((op) => (
                        <button
                            key={op}
                            onClick={() => handleUpdate('operator', op)}
                            className={`flex items-center justify-center w-10 h-8 text-lg font-mono rounded-md transition-colors ${operator === op
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                                : 'bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            {op === 'Add' && '+'}
                            {op === 'Subtract' && '-'}
                            {op === 'Multiply' && '*'}
                            {op === 'Divide' && '/'}
                        </button>
                    ))}
                </div>
                <Input
                    value={((right as LiteralExpr).Literal?.Integer ?? '').toString()}
                    onChange={e => handleUpdate('right', { Literal: { Integer: parseFloat(e.target.value) || 0 } })}
                    placeholder="Value"
                    className="flex-grow"
                    step="0.01"
                    type="number"
                />
            </div>
        </div>
    );
};

// --- Main Row Component ---

interface MappingRowProps {
    mapping: Mapping;
    index: number;
    allAvailableTables: TableMetadata[];
    onUpdate: (index: number, field: 'target' | 'source', value: any) => void;
    onSetSourceMode: (index: number, mode: SourceMode) => void;
    onRemove: (index: number) => void;
}

const MappingRow: React.FC<MappingRowProps> = ({ mapping, index, allAvailableTables, onUpdate, onSetSourceMode, onRemove }) => {
    const mode = getSourceMode(mapping.source);
    const sourceModeOptions = [
        { value: 'lookup', label: 'Column', icon: <AtSign size={16} /> },
        { value: 'literal', label: 'Text', icon: <Type size={16} /> },
        { value: 'function', label: 'Function', icon: <FunctionSquare size={16} /> },
        { value: 'arithmetic', label: 'Math', icon: <Sigma size={16} /> },
    ];

    return (
        <div className="p-5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Source Section */}
            <div className="md:col-span-7">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-sm text-slate-600 dark:text-slate-300">Source</h3>
                    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-900">
                        {sourceModeOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => onSetSourceMode(index, option.value as SourceMode)}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === option.value
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                                    : 'bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                            >
                                {option.icon}
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="min-h-[60px]">
                    {mode === 'lookup' && <ColumnSelector allTables={allAvailableTables} selectedTable={(mapping.source as LookupExpr).Lookup?.entity || ''} selectedColumn={(mapping.source as LookupExpr).Lookup?.key || ''} onTableChange={(val) => onUpdate(index, 'source', { Lookup: { entity: val, key: null, field: '' } })} onColumnChange={(val) => onUpdate(index, 'source', { Lookup: { entity: (mapping.source as LookupExpr).Lookup?.entity, key: val, field: '' } })} />}
                    {mode === 'literal' && <LiteralEditor expression={mapping.source} onUpdate={(newExpr) => onUpdate(index, 'source', newExpr)} allAvailableTables={allAvailableTables} />}
                    {mode === 'function' && <FunctionCallEditor expression={mapping.source} onUpdate={(newExpr) => onUpdate(index, 'source', newExpr)} allAvailableTables={allAvailableTables} />}
                    {mode === 'arithmetic' && <ArithmeticEditor expression={mapping.source} onUpdate={(newExpr) => onUpdate(index, 'source', newExpr)} allAvailableTables={allAvailableTables} />}
                </div>
            </div>

            {/* Arrow */}
            <div className="md:col-span-1 flex items-center justify-center text-slate-400 dark:text-slate-500 my-2 md:my-0 h-full">
                <ArrowRight size={20} />
            </div>

            {/* Destination Section */}
            <div className="md:col-span-3 flex flex-col justify-center h-full">
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Destination Column</label>
                <Input value={mapping.target} onChange={e => onUpdate(index, 'target', e.target.value)} placeholder="e.g., full_name" />
            </div>

            {/* Remove Button */}
            <div className="md:col-span-1 flex items-center justify-start md:justify-end h-full">
                <button onClick={() => onRemove(index)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-md"><X size={18} /></button>
            </div>
        </div>
    );
}

// Available Columns Panel
interface AvailableColumnsPanelProps {
    columns: { table: string; column: string }[];
    mappedColumns: Set<string>;
    isCollapsed: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onAddMapping: (table: string, column: string) => void;
    onToggle: () => void;
}

const AvailableColumnsPanel: React.FC<AvailableColumnsPanelProps> = ({ columns, mappedColumns, isCollapsed, searchTerm, onSearchChange, onAddMapping, onToggle }) => {
    if (isCollapsed) {
        return (
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 h-fit flex justify-center">
                <Button onClick={onToggle} variant="ghost" title="Show Available Columns">
                    <ChevronsRight />
                </Button>
            </div>
        )
    }

    return (
        <div className="p-4 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 h-fit">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <ListTree size={18} />
                    Available Columns
                </h3>
                <Button onClick={onToggle} variant="ghost" title="Hide Panel">
                    <ChevronsLeft />
                </Button>
            </div>
            <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder="Search columns..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 text-sm"
                />
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {columns.map(({ table, column }) => {
                    const isMapped = mappedColumns.has(`${table}.${column}`);
                    return (
                        <div key={`${table}.${column}`} className={`flex items-center justify-between rounded-md ${isMapped ? 'bg-slate-100 dark:bg-slate-700/50 p-2' : ''}`}>
                            <p className={`text-sm ${isMapped ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 p-1 rounded">{table}</span>
                                <span className="mx-1">.</span>
                                <span>{column}</span>
                            </p>
                            {isMapped ? (
                                <span className="text-green-500 flex items-center text-xs gap-1 font-medium"><Check size={14} /> Mapped</span>
                            ) : (
                                <Button variant="ghost" onClick={() => onAddMapping(table, column)}>
                                    Add
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Main Component ---

type Step5_ColumnMappingProps = {
    config: MigrationConfig;
    migrateItem: MigrateItem;
    metadata: Record<string, TableMetadata> | null;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
};

const Step5_ColumnMapping: React.FC<Step5_ColumnMappingProps> = ({ config, migrateItem, metadata, setConfig }) => {
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
    const [columnSearchTerm, setColumnSearchTerm] = useState('');
    const { mappings } = useMemo(() => migrateItem.map || { mappings: [] }, [migrateItem.map]);

    const updateMapStep = (updatedMapStep: MapStep) => {
        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            newConfig.migration.migrateItems[0].map = updatedMapStep;
            return newConfig;
        });
    };

    const addMapping = (sourceExpr?: Expression, targetName?: string) => {
        const newMapping: Mapping = {
            source: sourceExpr || { Lookup: { entity: '', key: null, field: '' } },
            target: targetName || '',
        };
        updateMapStep({ mappings: [...mappings, newMapping] });
    };

    const addMappingFromSource = (table: string, column: string) => {
        const newSourceExpr: Expression = { Lookup: { entity: table, key: column, field: '' } };
        const newTargetName = `${table}_${column}`;
        addMapping(newSourceExpr, newTargetName);
    };

    const autoMapAll = useCallback((allAvailableTables: TableMetadata[]) => {
        const existingTargets = new Set(mappings.map(m => m.target));
        let newMappings: Mapping[] = [];
        allAvailableTables.forEach(table => {
            Object.keys(table.columns).forEach(columnName => {
                const targetName = `${table.name}_${columnName}`;
                if (!existingTargets.has(targetName)) {
                    newMappings.push({
                        source: { Lookup: { entity: table.name, key: columnName, field: '' } },
                        target: targetName,
                    });
                }
            });
        });

        const destTableName = config.migration.migrateItems[0].destination.names[0];
        if (destTableName && allAvailableTables.length === 1 && allAvailableTables[0].name !== destTableName) {
            newMappings = newMappings.map(m => ({ ...m, target: m.target.replace(`${allAvailableTables[0].name}_`, '') }))
        }

        if (newMappings.length > 0) {
            updateMapStep({ mappings: [...mappings, ...newMappings] });
        }
    }, [mappings, config.migration.migrateItems, updateMapStep]);

    const removeMapping = (mappingIndex: number) => {
        const newMappings = mappings.filter((_, index) => index !== mappingIndex);
        updateMapStep({ mappings: newMappings });
    };

    const updateMapping = (mappingIndex: number, field: 'target' | 'source', value: any) => {
        const newMappings = mappings.map((mapping, index) => {
            if (index !== mappingIndex) return mapping;
            return { ...mapping, [field]: value };
        });
        updateMapStep({ mappings: newMappings });
    };

    const setSourceMode = (mappingIndex: number, mode: SourceMode) => {
        const newMappings = mappings.map((mapping, index) => {
            if (index !== mappingIndex) return mapping;
            if (getSourceMode(mapping.source) === mode) return mapping;
            return { ...mapping, source: getEmptyExprForMode(mode) };
        });
        updateMapStep({ mappings: newMappings });
    };

    const mappedSourceColumns = useMemo(() => {
        return new Set(
            mappings
                .filter(m => isLookup(m.source))
                .map(m => {
                    const lookup = (m.source as LookupExpr).Lookup;
                    return `${lookup.entity}.${lookup.key}`;
                })
        );
    }, [mappings]);

    return (
        <AllAvailableTablesProvider migrateItem={migrateItem} metadata={metadata}>
            {(allAvailableTables) => {
                const allSourceColumns = allAvailableTables.flatMap(table =>
                    Object.keys(table.columns).map(column => ({ table: table.name, column }))
                );

                const filteredColumns = !columnSearchTerm
                    ? allSourceColumns
                    : allSourceColumns.filter(
                        c => c.column.toLowerCase().includes(columnSearchTerm.toLowerCase()) ||
                            c.table.toLowerCase().includes(columnSearchTerm.toLowerCase())
                    );

                return (
                    <>
                        {/* Section Intro */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Column Mapping</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">
                                    Define the structure of your destination table by mapping source columns and expressions.
                                </p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button onClick={() => autoMapAll(allAvailableTables)} variant="outline" >
                                    <Wand2 size={16} className="mr-2" /> Auto-map 1:1
                                </Button>
                                <Button onClick={() => addMapping()} variant="outline">
                                    <Plus size={16} className="mr-2" /> Add Mapping
                                </Button>
                            </div>
                        </div>
                        {/* Body */}
                        <div className="pt-8 border-slate-200 dark:border-slate-700/60">
                            <div className="grid grid-cols-12 gap-8 items-start">
                                {/* Left Panel: Available Columns */}
                                <div className={`lg:sticky lg:top-8 transition-all duration-300 ${isPanelCollapsed ? 'col-span-1' : 'lg:col-span-3 col-span-12'}`}>
                                    <AvailableColumnsPanel
                                        columns={filteredColumns}
                                        mappedColumns={mappedSourceColumns}
                                        isCollapsed={isPanelCollapsed}
                                        searchTerm={columnSearchTerm}
                                        onSearchChange={setColumnSearchTerm}
                                        onToggle={() => setIsPanelCollapsed(!isPanelCollapsed)}
                                        onAddMapping={addMappingFromSource}
                                    />
                                </div>
                                {/* Right Panel: Mappings */}
                                <div className={`space-y-4 transition-all duration-300 ${isPanelCollapsed ? 'col-span-11' : 'lg:col-span-9 col-span-12'}`}>
                                    {mappings.length === 0 ? (
                                        <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                                            <div className="mx-auto bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 p-4 rounded-full w-fit mb-4">
                                                <ArrowRight size={32} />
                                            </div>
                                            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">No Mappings Defined</h3>
                                            <p className="text-slate-500 dark:text-slate-400 mt-1">Add mappings manually or use the reference list.</p>
                                        </div>
                                    ) : (mappings.map((map, index) => (
                                        <MappingRow
                                            key={index}
                                            mapping={map}
                                            index={index}
                                            allAvailableTables={allAvailableTables}
                                            onUpdate={updateMapping}
                                            onSetSourceMode={setSourceMode}
                                            onRemove={removeMapping}
                                        />
                                    )))}
                                </div>
                            </div>
                        </div>
                    </>
                )
            }}
        </AllAvailableTablesProvider>
    );
};

export default Step5_ColumnMapping;
