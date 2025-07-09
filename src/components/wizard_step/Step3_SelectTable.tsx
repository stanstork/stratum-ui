import React, { useState, useMemo, useEffect } from 'react';
import { MigrateItem, MigrationConfig } from '../../types/MigrationConfig';
import Card from '../common/v2/Card';
import CardHeader from '../common/v2/CardHeader';
import { Key, Search, Table, Link2 } from 'lucide-react';
import { TableMetadata } from '../../types/Metadata';
import apiClient from '../../services/apiClient';
import Input from '../common/v2/Input';

interface Step3_SelectTableProps {
    config: MigrationConfig;
    migrateItem: MigrateItem;
    metadata: Record<string, TableMetadata> | null; // Receive metadata as a prop
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
}

const Step3_SelectTable: React.FC<Step3_SelectTableProps> = ({ config, metadata, setConfig, migrateItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const availableTables = useMemo<TableMetadata[]>(() => {
        if (!metadata) return [];
        // const flattened = flattenTableMetadataMap(metadata);
        return Object.values(metadata);
    }, [metadata]);


    const filteredTables = useMemo(() => {
        return availableTables.filter(t =>
            t.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [availableTables, searchTerm]);

    const selectedTableSchema = useMemo<TableMetadata | null>(() => {
        const tableName = migrateItem.source.names?.[0];
        if (!tableName) return null;
        return availableTables.find(t => t.name === tableName) || null;
    }, [migrateItem.source.names, availableTables]);

    const handleTableSelect = (tableName: string) => {
        const table = availableTables.find(t => t.name === tableName);
        if (!table) return;

        console.log("Selected table:", table);

        // Update the config state immutably
        setConfig(currentConfig => {
            const newConfig = { ...currentConfig };
            const migrationIndex = newConfig.migration.migrateItems.findIndex(
                m => m.id === migrateItem.id
            );

            console.log("Updating migration item index:", migrationIndex);

            if (migrationIndex > -1) {
                newConfig.migration.migrateItems[migrationIndex] = {
                    ...newConfig.migration.migrateItems[migrationIndex],
                    source: {
                        ...newConfig.migration.migrateItems[migrationIndex].source,
                        names: [table.name],
                    },
                };
            }
            return newConfig;
        });
    };

    const allRelations = useMemo(() => {
        if (!selectedTableSchema) return [];

        const relations: { type: 'outgoing' | 'incoming'; targetTable: string; onColumns: string[] }[] = [];

        // Process incoming relations (from tables that reference this one)
        if (selectedTableSchema.referencingTables) {
            for (const referencingTable of Object.values(selectedTableSchema.referencingTables)) {
                const relevantFk = Object.values(referencingTable.foreignKeys).find(
                    fk => fk.referencedTable === selectedTableSchema.name
                );
                relations.push({
                    type: 'incoming',
                    targetTable: referencingTable.name,
                    onColumns: relevantFk ? [relevantFk.column] : ['unknown'],
                });
            }
        }

        // Process outgoing relations (to tables that this one references)
        if (selectedTableSchema.referencedTables) {
            for (const referencedTable of Object.values(selectedTableSchema.referencedTables)) {
                const relevantFk = Object.values(selectedTableSchema.foreignKeys).find(
                    fk => fk.referencedTable === referencedTable.name
                );
                relations.push({
                    type: 'outgoing',
                    targetTable: referencedTable.name,
                    onColumns: relevantFk ? [relevantFk.column] : ['unknown'],
                });
            }
        }

        return relations;
    }, [selectedTableSchema]);

    return (
        <Card>
            <CardHeader
                title="Source Table"
                subtitle="Choose the main table to migrate from. The schema and its relations will be shown."
            />
            <div className="p-6 flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-1/3">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
                        Available Tables
                    </h3>
                    <div className="relative mb-4">
                        <Search
                            size={18}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        />
                        <Input
                            placeholder="Search tables..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 -mr-2">
                        {isLoading ? (
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Loading tables...</p>
                        ) : (
                            filteredTables.map(table => (
                                <button
                                    key={table.name}
                                    onClick={() => handleTableSelect(table.name)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 text-sm ${migrateItem.source.names?.[0] === table.name
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    <Table size={16} /> {table.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>
                <div className="w-full lg:w-2/3">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
                        Schema & Relations
                    </h3>
                    {selectedTableSchema ? (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-5 bg-slate-50/80 dark:bg-slate-800/50 min-h-[200px]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 p-2 rounded-full">
                                    <Table size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                                        {selectedTableSchema.name}
                                    </h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Primary source table
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h5 className="font-semibold text-sm text-slate-600 dark:text-slate-300 mb-2">
                                        Columns
                                    </h5>
                                    <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                                        {Object.entries(selectedTableSchema.columns).map(
                                            ([col, info]) => (
                                                <li key={col} className="flex items-center gap-2">
                                                    <Key
                                                        size={12}
                                                        className="text-slate-400 dark:text-slate-500"
                                                    />
                                                    <span>
                                                        {col}:{' '}
                                                        <span className="text-slate-500 dark:text-slate-400">
                                                            {info.dataType}
                                                        </span>
                                                    </span>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="font-semibold text-sm text-slate-600 dark:text-slate-300 mb-2">
                                        Detected Relations
                                    </h5>
                                    {allRelations.length > 0 ? (
                                        <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                                            {allRelations.map((rel, index) => (
                                                <li key={`${rel.targetTable}-${index}`} className="flex items-center gap-2">
                                                    <Link2 size={12} className="text-slate-400 dark:text-slate-500" />
                                                    <span>
                                                        {rel.type === 'outgoing' ? 'Connects to ' : 'Referenced by '}
                                                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                                                            {rel.targetTable}
                                                        </span>
                                                        {' on '}
                                                        <code className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-0.5 px-1.5 rounded">
                                                            {rel.onColumns.join(', ')}
                                                        </code>
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
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center min-h-[200px] bg-slate-50/80 dark:bg-slate-800/50">
                            <p className="text-slate-500 dark:text-slate-400">
                                {isLoading ? 'Loading schema...' : 'Select a table to see its schema'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default Step3_SelectTable;