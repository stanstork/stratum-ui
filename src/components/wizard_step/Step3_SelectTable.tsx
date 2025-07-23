import React, { useState, useMemo, useEffect } from 'react';
import { MigrateItem, MigrationConfig } from '../../types/MigrationConfig';
import Card from '../common/v2/Card';
import CardHeader from '../common/v2/CardHeader';
import { Key, Search, Table, Link2, ArrowRight, GitMerge, ChevronDown } from 'lucide-react';
import { TableMetadata } from '../../types/Metadata';
import Input from '../common/v2/Input';
import SchemaDiagram from '../SchemaDiagram';
import { ReactFlowProvider } from 'reactflow';

interface Step3_SelectTableProps {
    config: MigrationConfig;
    migrateItem: MigrateItem;
    metadata: Record<string, TableMetadata> | null;
    isMetadataLoading: boolean;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
}

const Step3_SelectTable: React.FC<Step3_SelectTableProps> = ({ config, metadata, setConfig, migrateItem, isMetadataLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [destinationTableName, setDestinationTableName] = useState(migrateItem.destination.names?.[0] || '');
    const [isDiagramVisible, setIsDiagramVisible] = useState(false);

    useEffect(() => {
        setDestinationTableName(migrateItem.destination.names?.[0] || '');
    }, [migrateItem.destination.names]);


    const availableTables = useMemo<TableMetadata[]>(() => {
        if (!metadata) return [];
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

        console.log(`Selected source table: ${table.name}. Setting destination and resetting dependent config.`);

        // Update the config state immutably
        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            const migrationIndex = 0; // Assuming single migration item for simplicity

            if (migrationIndex > -1) {
                const currentItem = newConfig.migration.migrateItems[migrationIndex];
                newConfig.migration.migrateItems[migrationIndex] = {
                    ...currentItem,
                    source: {
                        kind: 'Table',
                        names: [table.name],
                    },
                    destination: {
                        kind: 'Table',
                        names: [table.name], // Default destination name to match source
                    },
                    load: { entities: [], matches: [] },
                    map: { mappings: [] },
                    filter: { expression: null },
                };
            }
            return newConfig;
        });
    };

    // Handler to update the destination table name in the global config
    const handleDestinationNameChange = (newDestName: string) => {
        setDestinationTableName(newDestName); // Update local state immediately for input responsiveness
        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            const migrationIndex = 0; // Assuming single migration item for simplicity
            if (migrationIndex > -1) {
                newConfig.migration.migrateItems[migrationIndex].destination.kind = 'table';
                newConfig.migration.migrateItems[migrationIndex].destination.names = [newDestName];
            }
            return newConfig;
        });
    };

    const allRelations = useMemo(() => {
        if (!selectedTableSchema) return [];
        const relations: { type: 'outgoing' | 'incoming'; targetTable: string; onColumns: string[] }[] = [];
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
                title="Source & Destination"
                subtitle="Choose the main table to migrate from and name the destination table."
            />
            <div className="p-6 flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-1/3">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
                        Available Source Tables
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
                        {isMetadataLoading ? (
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
                        Schema & Destination
                    </h3>
                    {selectedTableSchema ? (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 min-h-[200px]">
                            <div className="p-5">
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
                                                        <Key size={12} className="text-slate-400 dark:text-slate-500" />
                                                        <span>{col}: <span className="text-slate-500 dark:text-slate-400">{info.dataType}</span></span>
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
                            </div>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center min-h-[200px] bg-slate-50/80 dark:bg-slate-800/50">
                            <p className="text-slate-500 dark:text-slate-400">
                                {isMetadataLoading ? 'Loading schema...' : 'Select a table to see its schema'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Destination Table Name Section */}
            {selectedTableSchema && (
                <div className="px-6 pb-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4 pt-6">
                        <div className="bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 p-2 rounded-full">
                            <Table size={20} />
                        </div>
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-xl">
                            Destination Table Name
                        </h3>
                    </div>
                    <Input
                        placeholder="Enter destination table name..."
                        value={destinationTableName}
                        onChange={e => handleDestinationNameChange(e.target.value)}
                        className="font-mono"
                    />
                </div>
            )}

            {/* Schema Diagram Section */}
            {selectedTableSchema && metadata && (
                <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setIsDiagramVisible(!isDiagramVisible)}
                        className="w-full flex justify-between items-center text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 p-2 rounded-full">
                                <GitMerge size={20} />
                            </div>
                            <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-xl">
                                Schema Diagram
                            </h3>
                        </div>
                        <ChevronDown size={24} className={`text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isDiagramVisible ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isDiagramVisible ? 'pt-4' : 'max-h-0'}`}>
                        <ReactFlowProvider>
                            <SchemaDiagram table={selectedTableSchema} metadata={metadata} />
                        </ReactFlowProvider>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default Step3_SelectTable;
