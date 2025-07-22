import React, { useMemo, useCallback, useState } from "react";
import { TableMetadata } from "../../types/Metadata";
import { JoinCondition, LoadStep, MigrateItem, MigrationConfig, LookupExpr } from "../../types/MigrationConfig";
import Card from "../common/v2/Card";
import CardHeader from "../common/v2/CardHeader";
import Button from "../common/v2/Button";
import { Plus, ChevronDown, Key, Link2, Eye, EyeOff, X } from "lucide-react";
import ColumnSelector from "../common/v2/ColumnSelector";

// --- Join Item Component ---
interface JoinItemProps {
    index: number;
    match: JoinCondition;
    availableLeftTables: TableMetadata[];
    availableRightTables: TableMetadata[];
    getTableSchema: (tableName: string) => TableMetadata | null;
    onUpdateTable: (index: number, newTableName: string) => void;
    onUpdateCondition: (index: number, side: 'left' | 'right', field: 'entity' | 'column', value: string | null) => void;
    onRemove: (index: number) => void;
}

const JoinItem: React.FC<JoinItemProps> = ({
    index,
    match,
    availableLeftTables,
    availableRightTables,
    getTableSchema,
    onUpdateTable,
    onUpdateCondition,
    onRemove
}) => {
    const [isSchemaVisible, setIsSchemaVisible] = useState(false);
    const rightEntity = (match.right as LookupExpr)?.Lookup.entity || '';
    const joinTableSchema = useMemo(() => getTableSchema(rightEntity), [rightEntity, getTableSchema]);

    const allJoinOptions = useMemo(() => {
        const tableMap = new Map<string, TableMetadata>();
        availableRightTables.forEach(t => tableMap.set(t.name, t));
        if (joinTableSchema) {
            tableMap.set(joinTableSchema.name, joinTableSchema);
        }
        return Array.from(tableMap.values());
    }, [availableRightTables, joinTableSchema]);

    const allRelations = useMemo(() => {
        if (!joinTableSchema) return [];
        const relations: { type: 'outgoing' | 'incoming'; targetTable: string; onColumns: string[] }[] = [];

        // Outgoing relations (Foreign Keys in this table)
        if (joinTableSchema.foreignKeys) {
            for (const fk of Object.values(joinTableSchema.foreignKeys)) {
                relations.push({
                    type: 'outgoing',
                    targetTable: fk.referencedTable,
                    onColumns: [fk.column],
                });
            }
        }

        // Incoming relations (Other tables referencing this one)
        if (joinTableSchema.referencingTables) {
            for (const referencingTable of Object.values(joinTableSchema.referencingTables)) {
                const relevantFk = Object.values(referencingTable.foreignKeys).find(
                    fk => fk.referencedTable === joinTableSchema.name
                );
                relations.push({
                    type: 'incoming',
                    targetTable: referencingTable.name,
                    onColumns: relevantFk ? [relevantFk.column] : ['unknown'],
                });
            }
        }
        return relations;
    }, [joinTableSchema]);


    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 p-2 rounded-full">
                            <Link2 size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Join #{index + 1}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Connect data from another table.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center">
                    <button
                        onClick={() => setIsSchemaVisible(!isSchemaVisible)}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title={isSchemaVisible ? `Hide schema for ${rightEntity}` : `View schema for ${rightEntity}`}
                    >
                        {isSchemaVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <Button onClick={() => onRemove(index)} variant="ghost" className="text-slate-400 hover:text-red-500">
                        <X size={18} />
                    </Button>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-11 gap-4 items-start">
                {/* Left Side */}
                <div className="md:col-span-5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">From</label>
                    <ColumnSelector
                        allTables={availableLeftTables}
                        selectedTable={(match.left as LookupExpr).Lookup.entity}
                        selectedColumn={(match.left as LookupExpr).Lookup.key ?? ""}
                        onTableChange={(val) => onUpdateCondition(index, 'left', 'entity', val)}
                        onColumnChange={(val) => onUpdateCondition(index, 'left', 'column', val)}
                    // disableTableSelect={false}
                    />
                </div>

                {/* Equals */}
                <div className="md:col-span-1 flex items-center justify-center pt-7 text-slate-500 font-mono">=</div>

                {/* Right Side - Simplified */}
                <div className="md:col-span-5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">With</label>
                    <ColumnSelector
                        allTables={allJoinOptions}
                        selectedTable={rightEntity}
                        selectedColumn={(match.right as LookupExpr).Lookup.key ?? ""}
                        onTableChange={(newTableName) => onUpdateTable(index, newTableName)}
                        onColumnChange={(val) => onUpdateCondition(index, 'right', 'column', val)}
                    // disableTableSelect={false}
                    />
                </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSchemaVisible ? 'max-h-96 pt-3' : 'max-h-0'}`}>
                {joinTableSchema ? (
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <h5 className="font-semibold text-sm text-slate-600 dark:text-slate-300 mb-2">
                                Columns in <code className="text-xs">{joinTableSchema.name}</code>
                            </h5>
                            <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                                {Object.entries(joinTableSchema.columns).map(([col, info]) => (
                                    <li key={col} className="flex items-center gap-2">
                                        <Key size={12} className="text-slate-400 dark:text-slate-500" />
                                        <span>{col}: <span className="text-slate-500 dark:text-slate-400">{info.dataType}</span></span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-semibold text-sm text-slate-600 dark:text-slate-300 mb-2">
                                Detected Relations
                            </h5>
                            {allRelations.length > 0 ? (
                                <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                                    {allRelations.map((rel, relIndex) => (
                                        <li key={`${rel.targetTable}-${relIndex}`} className="flex items-center gap-2">
                                            <Link2 size={12} className="text-slate-400 dark:text-slate-500" />
                                            <span>
                                                {rel.type === 'outgoing' ? 'Connects to ' : 'Referenced by '}
                                                <span className="font-semibold text-slate-800 dark:text-slate-100">{rel.targetTable}</span>
                                                {' on '}
                                                <code className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-0.5 px-1.5 rounded">{rel.onColumns.join(', ')}</code>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    No relations detected for this table.
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">Schema not available.</div>
                )}
            </div>
        </div>
    );
};


// --- Main Step Component ---
type Step4_JoinsProps = {
    config: MigrationConfig;
    migrateItem: MigrateItem;
    metadata: Record<string, TableMetadata> | null;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
};

const Step4_Joins = ({ config, metadata, setConfig, migrateItem }: Step4_JoinsProps) => {
    const sourceTableName = useMemo(() => migrateItem.source.names[0], [migrateItem]);
    const loadStep = useMemo<LoadStep>(() => migrateItem.load || { entities: [], matches: [] }, [migrateItem]);

    const allTablesInConnection = useMemo<TableMetadata[]>(() => metadata ? Object.values(metadata) : [], [metadata]);

    const getTableSchema = useCallback((tableName: string): TableMetadata | null => {
        return allTablesInConnection.find(t => t.name === tableName) || null;
    }, [allTablesInConnection]);

    const updateLoadStep = (updatedLoadStep: LoadStep) => {
        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            newConfig.migration.migrateItems[0].load = updatedLoadStep;
            return newConfig;
        });
    };

    const addJoin = () => {
        const allUsedTables = new Set(loadStep.entities.concat(sourceTableName));
        const availableJoinTables = allTablesInConnection.filter(t => !allUsedTables.has(t.name));

        if (availableJoinTables.length === 0) return;
        const defaultJoinTable = availableJoinTables[0].name;

        const newMatch: JoinCondition = {
            left: { Lookup: { entity: sourceTableName, key: null, field: '' } },
            right: { Lookup: { entity: defaultJoinTable, key: null, field: '' } },
        };

        const newLoadStep: LoadStep = {
            entities: [...loadStep.entities, defaultJoinTable],
            matches: [...loadStep.matches, newMatch],
        };
        updateLoadStep(newLoadStep);
    };

    const updateJoinTable = (index: number, newTableName: string) => {
        const newEntities = [...loadStep.entities];
        newEntities[index] = newTableName;

        const newMatches = structuredClone(loadStep.matches);
        const matchToUpdate = newMatches[index];

        if ('Lookup' in matchToUpdate.right) {
            matchToUpdate.right.Lookup.entity = newTableName;
            matchToUpdate.right.Lookup.key = null;
        }

        updateLoadStep({ entities: newEntities, matches: newMatches });
    };

    const updateJoinCondition = (
        index: number,
        side: 'left' | 'right',
        field: 'entity' | 'column',
        value: string | null
    ) => {
        const newMatches = structuredClone(loadStep.matches);
        const expr = newMatches[index][side];

        if ('Lookup' in expr) {
            if (field === 'entity') {
                expr.Lookup.entity = value || '';
                expr.Lookup.key = null; // Reset column on entity change
            } else {
                expr.Lookup.key = value;
            }
        }

        updateLoadStep({ ...loadStep, matches: newMatches });
    };

    const removeJoin = (index: number) => {
        const newEntities = loadStep.entities.filter((_, i) => i !== index);
        const newMatches = loadStep.matches.filter((_, i) => i !== index);
        updateLoadStep({ entities: newEntities, matches: newMatches });
    };

    return (
        <Card>
            <CardHeader
                title="Joins"
                subtitle="Combine data from other tables with your source table."
            />
            <div className="p-6">
                <div className="flex justify-end mb-6">
                    <Button onClick={addJoin} variant="secondary" disabled={allTablesInConnection.filter(t => !new Set(loadStep.entities.concat(sourceTableName)).has(t.name)).length === 0}>
                        <Plus size={16} className="mr-2" /> Add Join
                    </Button>
                </div>
                <div className="space-y-4">
                    {loadStep.matches.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg">
                            <div className="mx-auto bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 p-4 rounded-full w-fit mb-4">
                                <Link2 size={32} />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">No Joins Added</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Click "Add Join" to combine data from other tables.</p>
                        </div>
                    ) : (
                        loadStep.matches.map((match, index) => {
                            const tablesUsedInPreviousJoins = loadStep.entities.slice(0, index);
                            const availableLeftTables = [sourceTableName, ...tablesUsedInPreviousJoins]
                                .map(name => getTableSchema(name))
                                .filter((t): t is TableMetadata => t !== null);

                            const allUsedTables = new Set([sourceTableName, ...loadStep.entities]);
                            const availableRightTables = allTablesInConnection.filter(t => !allUsedTables.has(t.name));

                            return (
                                <JoinItem
                                    key={`join-${index}`}
                                    index={index}
                                    match={match}
                                    availableLeftTables={availableLeftTables}
                                    availableRightTables={availableRightTables}
                                    getTableSchema={getTableSchema}
                                    onUpdateTable={updateJoinTable}
                                    onUpdateCondition={updateJoinCondition}
                                    onRemove={removeJoin}
                                />
                            )
                        })
                    )}
                </div>
            </div>
        </Card>
    );
};

export default Step4_Joins;
