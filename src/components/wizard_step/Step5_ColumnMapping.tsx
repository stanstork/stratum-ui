import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Wand2, Plus, ArrowRight, X, GitFork, ArrowRightLeft } from 'lucide-react';
import AllAvailableTablesProvider from './AllAvailableTablesProvider';
import { Expression, LiteralExpr, LookupExpr, Mapping, MapStep, MigrateItem, MigrationConfig } from '../../types/MigrationConfig';
import { TableMetadata } from '../../types/Metadata';
import Card from '../common/v2/Card';
import CardHeader from '../common/v2/CardHeader';
import Button from '../common/v2/Button';
import ColumnSelector from '../common/v2/ColumnSelector';
import Input from '../common/v2/Input';

const getLookupData = (expr: Expression): { entity: string; column: string | null } => {
    const lookup = (expr as LookupExpr)?.Lookup;
    if (lookup) {
        return { entity: lookup.entity || '', column: lookup.field };
    }
    return { entity: '', column: null };
};

const getExpressionString = (expr: Expression): string => {
    const literal = (expr as LiteralExpr)?.Literal;
    if (literal && typeof literal.String === 'string') {
        return literal.String;
    }
    // In a real scenario, you might serialize other expression types to a string here.
    return '';
};

interface MappingInterfaceProps {
    mappings: Mapping[];
    allAvailableTables: TableMetadata[];
    autoMapAll: (tables: TableMetadata[]) => void;
    addMapping: () => void;
    updateMapping: (index: number, field: 'target', value: string) => void;
    updateSourceLookup: (index: number, field: 'entity' | 'column', value: string | null) => void;
    updateSourceExpression: (index: number, value: string) => void;
    toggleSourceMode: (index: number) => void;
    removeMapping: (index: number) => void;
}

const MappingInterface: React.FC<MappingInterfaceProps> = ({
    mappings,
    allAvailableTables,
    autoMapAll,
    addMapping,
    updateMapping,
    updateSourceLookup,
    updateSourceExpression,
    toggleSourceMode,
    removeMapping,
}) => {
    const [activeTab, setActiveTab] = useState('manual');
    const [hasAutoMapped, setHasAutoMapped] = useState(false);

    useEffect(() => {
        if (allAvailableTables.length > 0 && mappings.length === 0 && !hasAutoMapped) {
            autoMapAll(allAvailableTables);
            setHasAutoMapped(true);
        }
    }, [allAvailableTables, mappings, hasAutoMapped, autoMapAll]);

    return (
        <Card>
            <CardHeader
                title="Column Mapping"
                subtitle="Define the structure of your destination table."
            />
            <div className="px-6 pt-4 border-b border-slate-200/80 dark:border-slate-700/80">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'manual'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                            }`}
                    >
                        Manual Mapping
                    </button>
                    <button
                        onClick={() => setActiveTab('visual')}
                        className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'visual'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                            }`}
                    >
                        Visual Builder
                    </button>
                </nav>
            </div>

            {activeTab === 'manual' && (
                <div className="p-6">
                    <div className="flex justify-end gap-2 mb-6">
                        <Button onClick={() => autoMapAll(allAvailableTables)} >
                            <Wand2 size={16} className="mr-2" /> Auto-map 1:1
                        </Button>
                        <Button onClick={addMapping} variant="secondary">
                            <Plus size={16} className="mr-2" /> Add Mapping
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            <div className="col-span-5">Source Column / Expression</div>
                            <div className="col-span-1 text-center"></div>
                            <div className="col-span-5">Destination Column</div>
                            <div className="col-span-1"></div>
                        </div>
                        {mappings.map((map, index) => {
                            const isLookupMode = (map.source as LookupExpr)?.Lookup !== undefined;
                            const { entity, column } = getLookupData(map.source);
                            const expressionString = getExpressionString(map.source);

                            return (
                                <div key={index} className={`grid grid-cols-12 gap-4 items-center p-4 rounded-lg ${index % 2 === 0 ? 'bg-slate-50/80 dark:bg-slate-700/50' : 'bg-white/80 dark:bg-slate-800/40'}`}>
                                    <div className="col-span-5 flex items-center gap-2">
                                        {isLookupMode ? (
                                            <ColumnSelector
                                                allTables={allAvailableTables}
                                                selectedTable={entity}
                                                selectedColumn={column || ''}
                                                onTableChange={(val) => updateSourceLookup(index, 'entity', val)}
                                                onColumnChange={(val) => updateSourceLookup(index, 'column', val)}
                                            />
                                        ) : (
                                            <Input
                                                value={expressionString}
                                                onChange={e => updateSourceExpression(index, e.target.value)}
                                                placeholder="e.g. CONCAT(users.first_name, ' ')"
                                                className="font-mono text-sm"
                                            />
                                        )}
                                        <button onClick={() => toggleSourceMode(index)} title="Switch input mode" className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-md">
                                            <ArrowRightLeft size={16} />
                                        </button>
                                    </div>
                                    <div className="col-span-1 text-center text-slate-400 dark:text-slate-500"><ArrowRight size={20} /></div>
                                    <div className="col-span-5"><Input value={map.target} onChange={e => updateMapping(index, 'target', e.target.value)} placeholder="Destination column name" /></div>
                                    <div className="col-span-1 text-right"><button onClick={() => removeMapping(index)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"><X size={18} /></button></div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            {activeTab === 'visual' && (
                <div className="p-6 flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="mx-auto bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 p-4 rounded-full w-fit mb-4">
                            <GitFork size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Visual Builder Coming Soon!</h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">
                            An interactive, node-based interface to build your transformations is on the way.
                        </p>
                    </div>
                </div>
            )}
        </Card>
    );
};


type Step5_ColumnMappingProps = {
    config: MigrationConfig;
    migrateItem: MigrateItem;
    metadata: Record<string, TableMetadata> | null;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
};

const Step5_ColumnMapping: React.FC<Step5_ColumnMappingProps> = ({ config, migrateItem, metadata, setConfig }) => {
    const { mappings } = useMemo(() => migrateItem.map || { mappings: [] }, [migrateItem.map]);

    const updateMapStep = (updatedMapStep: MapStep) => {
        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            newConfig.migration.migrateItems[0].map = updatedMapStep;
            console.log('Updated Map Step:', newConfig.migration.migrateItems[0].map);
            return newConfig;
        });
    };

    const autoMapAll = useCallback((allAvailableTables: TableMetadata[]) => {
        const existingSources = new Set(mappings.map(m => {
            const { entity, column } = getLookupData(m.source);
            return `${entity}.${column}`;
        }));
        const newMappings: Mapping[] = [];
        allAvailableTables.forEach(table => {
            Object.keys(table.columns).forEach(columnName => {
                const sourceIdentifier = `${table.name}.${columnName}`;
                if (!existingSources.has(sourceIdentifier)) {
                    newMappings.push({
                        source: { Lookup: { entity: table.name, field: columnName, key: '' } },
                        target: `${table.name}_${columnName}`,
                    });
                }
            });
        });
        if (newMappings.length > 0) {
            updateMapStep({ mappings: [...mappings, ...newMappings] });
        }
    }, [mappings]);

    const addMapping = () => {
        const newMapping: Mapping = {
            source: { Lookup: { entity: '', field: null, key: '' } },
            target: '',
        };
        updateMapStep({ mappings: [...mappings, newMapping] });
    };

    const removeMapping = (mappingIndex: number) => {
        const newMappings = mappings.filter((_, index) => index !== mappingIndex);
        updateMapStep({ mappings: newMappings });
    };

    const updateMapping = (mappingIndex: number, field: 'target', value: string) => {
        const newMappings = mappings.map((mapping, index) => {
            if (index !== mappingIndex) return mapping;
            return { ...mapping, [field]: value };
        });
        updateMapStep({ mappings: newMappings });
    };

    const updateSourceLookup = (mappingIndex: number, field: 'entity' | 'column', value: string | null) => {
        const newMappings = mappings.map((mapping, index) => {
            if (index !== mappingIndex) return mapping;
            const sourceExpr = mapping.source;
            if (!(sourceExpr as LookupExpr)?.Lookup) return mapping;
            const newSourceExpr: LookupExpr = { Lookup: { ...(sourceExpr as LookupExpr).Lookup } };
            if (field === 'entity') {
                newSourceExpr.Lookup.entity = value || '';
                newSourceExpr.Lookup.field = null;
            } else {
                newSourceExpr.Lookup.field = value;
            }
            return { ...mapping, source: newSourceExpr };
        });
        updateMapStep({ mappings: newMappings });
    };

    const updateSourceExpression = (mappingIndex: number, value: string) => {
        const newMappings = mappings.map((mapping, index) => {
            if (index !== mappingIndex) return mapping;
            // Create a new Literal expression to hold the custom text
            const newSource: LiteralExpr = { Literal: { String: value } };
            return { ...mapping, source: newSource };
        });
        updateMapStep({ mappings: newMappings });
    };

    const toggleSourceMode = (mappingIndex: number) => {
        const newMappings = mappings.map((mapping, index) => {
            if (index !== mappingIndex) return mapping;
            const isLookupCurrently = (mapping.source as LookupExpr)?.Lookup !== undefined;
            const newSource: Expression = isLookupCurrently
                ? { Literal: { String: '' } } // Switch to Expression mode
                : { Lookup: { entity: '', field: null, key: '' } }; // Switch back to Lookup mode
            return { ...mapping, source: newSource };
        });
        updateMapStep({ mappings: newMappings });
    };

    return (
        <AllAvailableTablesProvider migrateItem={migrateItem} metadata={metadata}>
            {(allAvailableTables) => (
                <MappingInterface
                    mappings={mappings}
                    allAvailableTables={allAvailableTables}
                    autoMapAll={autoMapAll}
                    addMapping={addMapping}
                    updateMapping={updateMapping}
                    updateSourceLookup={updateSourceLookup}
                    updateSourceExpression={updateSourceExpression}
                    toggleSourceMode={toggleSourceMode}
                    removeMapping={removeMapping}
                />
            )}
        </AllAvailableTablesProvider>
    );
};

export default Step5_ColumnMapping;
