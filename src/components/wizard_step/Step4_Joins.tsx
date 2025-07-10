import apiClient from "../../services/apiClient";
import { TableMetadata } from "../../types/Metadata";
import { JoinCondition, LoadStep, MigrateItem, MigrationConfig } from "../../types/MigrationConfig";
import React, { useMemo, useCallback, useState, useEffect } from "react";
import Card from "../common/v2/Card";
import CardHeader from "../common/v2/CardHeader";
import Button from "../common/v2/Button";
import { Plus } from "lucide-react";
import JoinItem from "../JoinItem";

type Step4JoinsProps = {
    config: MigrationConfig;
    migrateItem: MigrateItem;
    metadata: Record<string, TableMetadata> | null;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
};

const Step4_Joins = ({ config, metadata, setConfig, migrateItem }: Step4JoinsProps) => {
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
            newConfig.migration.migrateItems[0].load = updatedLoadStep;
            console.log("Migrate item after update:", newConfig.migration.migrateItems[0]);
            return newConfig;
        });
    };

    const addJoin = () => {
        // Check if there are any tables available to join.
        if (availableJoinTables.length === 0) {
            // Optionally, show a notification to the user
            console.warn("No available tables to join.");
            return;
        }

        const defaultJoinTable = availableJoinTables[0].name;

        // Create the new join condition, pre-filling the right side.
        const newMatch: JoinCondition = {
            left: { Lookup: { entity: sourceTableName, field: null, key: '' } },
            right: { Lookup: { entity: defaultJoinTable, field: null, key: '' } }, // Use the default table
        };

        // Create the new load step with the default table name.
        const newLoadStep: LoadStep = {
            entities: [...loadStep.entities, defaultJoinTable],
            matches: [...loadStep.matches, newMatch],
        };

        updateLoadStep(newLoadStep);
    };


    const updateJoinTable = (index: number, newTableName: string) => {
        const newEntities = [...loadStep.entities];
        newEntities[index] = newTableName;

        const newMatches = [...loadStep.matches];
        updateLoadStep({ entities: newEntities, matches: newMatches });
    };

    const updateJoinCondition = (
        index: number,
        side: 'left' | 'right',
        field: 'entity' | 'column',
        value: string | null
    ) => {
        // Create a deep copy of the matches array to ensure immutability.
        const newMatches = structuredClone(loadStep.matches);

        // Cet the specific expression object ('left' or 'right') to modify.
        const expr = newMatches[index][side];

        // Only update if the expression is a LookupExpr
        if ('Lookup' in expr) {
            if (field === 'entity') {
                // tf the table ('entity') changes...
                expr.Lookup.entity = value || '';
                // ...reset the column ('field') to prevent invalid states.
                expr.Lookup.field = null;
            } else {
                // otherwise, just update the column ('field').
                expr.Lookup.field = value;
            }
        }

        // Update the parent state with the newly modified 'matches' array.
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
                    <Button onClick={addJoin} variant="secondary">
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