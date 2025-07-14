import apiClient from "../../services/apiClient";
import { TableMetadata } from "../../types/Metadata";
import { JoinCondition, LoadStep, MigrateItem, MigrationConfig } from "../../types/MigrationConfig";
import React, { useMemo, useCallback, useState, useEffect } from "react";
import Card from "../common/v2/Card";
import CardHeader from "../common/v2/CardHeader";
import Button from "../common/v2/Button";
import { Plus } from "lucide-react";
import JoinItem from "../JoinItem";

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
    const sourceTableSchema = useMemo<TableMetadata | null>(() => allTablesInConnection.find(t => t.name === sourceTableName) || null, [allTablesInConnection, sourceTableName]);

    const availableJoinTables = useMemo<TableMetadata[]>(() => {
        const usedTableNames = new Set(loadStep.entities.concat(sourceTableName));
        return allTablesInConnection.filter(t => !usedTableNames.has(t.name));
    }, [allTablesInConnection, sourceTableName, loadStep.entities]);

    const getTableSchema = useCallback((tableName: string): TableMetadata | null => {
        return allTablesInConnection.find(t => t.name === tableName) || null;
    }, [allTablesInConnection]);

    const updateLoadStep = (updatedLoadStep: LoadStep) => {
        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            // Assuming we are always editing the first migrate item for simplicity
            newConfig.migration.migrateItems[0].load = updatedLoadStep;
            return newConfig;
        });
    };

    const addJoin = () => {
        if (availableJoinTables.length === 0) {
            console.warn("No available tables to join.");
            return;
        }

        const defaultJoinTable = availableJoinTables[0].name;

        const newMatch: JoinCondition = {
            left: { Lookup: { entity: sourceTableName, field: null, key: '' } },
            right: { Lookup: { entity: defaultJoinTable, field: null, key: '' } },
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

        // Ensure we are updating a lookup expression
        if ('Lookup' in matchToUpdate.right) {
            // Update the entity (table) on the right side of the join
            matchToUpdate.right.Lookup.entity = newTableName;
            // Reset the field (column) since the table has changed
            matchToUpdate.right.Lookup.field = null;
        }

        // Also reset the left side column to force user re-selection, preventing invalid states.
        if ('Lookup' in matchToUpdate.left) {
            matchToUpdate.left.Lookup.field = null;
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
                expr.Lookup.field = null; // Reset column on entity change
            } else {
                expr.Lookup.field = value;
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
                    <Button onClick={addJoin} variant="secondary" disabled={availableJoinTables.length === 0}>
                        <Plus size={16} className="mr-2" /> Add Join
                    </Button>
                </div>
                <div className="space-y-4">
                    {loadStep.matches.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-8 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg">
                            No joins added yet.
                        </p>
                    ) : (
                        loadStep.matches.map((match, index) => (
                            <JoinItem
                                key={`join-${index}`}
                                index={index}
                                entity={loadStep.entities[index]}
                                match={match}
                                loadStep={loadStep}
                                sourceTableSchema={sourceTableSchema}
                                availableJoinTables={availableJoinTables}
                                getTableSchema={getTableSchema}
                                onUpdateTable={updateJoinTable}
                                onUpdateCondition={updateJoinCondition}
                                onRemove={removeJoin}
                            />
                        ))
                    )}
                </div>
            </div>
        </Card>
    );
};

export default Step4_Joins;