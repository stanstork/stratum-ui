import React, { useState, useMemo, useEffect } from 'react';
import { MigrateItem, MigrationConfig } from '../../types/MigrationConfig';
import { Key, Search, Table, Link2, GitMerge, ChevronDown, Database, ArrowRight } from 'lucide-react';
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
        setDestinationTableName(migrateItem.source.names?.[0] || '');
    }, [migrateItem.source.names]);


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

        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            const migrationIndex = 0;
            if (migrationIndex > -1) {
                const currentItem = newConfig.migration.migrateItems[migrationIndex];
                newConfig.migration.migrateItems[migrationIndex] = {
                    ...currentItem,
                    source: { kind: 'Table', names: [table.name] },
                    destination: { kind: 'Table', names: [table.name] },
                    load: { entities: [], matches: [] },
                    map: { mappings: [] },
                    filter: { expression: null },
                };
            }
            return newConfig;
        });
    };

    const handleDestinationNameChange = (newDestName: string) => {
        setDestinationTableName(newDestName);
        setConfig(currentConfig => {
            const newConfig = structuredClone(currentConfig);
            const migrationIndex = 0;
            if (migrationIndex > -1) {
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
                const relevantFk = Object.values(referencingTable.foreignKeys).find(fk => fk.referencedTable === selectedTableSchema.name);
                relations.push({ type: 'incoming', targetTable: referencingTable.name, onColumns: relevantFk ? [relevantFk.column] : [] });
            }
        }
        if (selectedTableSchema.referencedTables) {
            for (const referencedTable of Object.values(selectedTableSchema.foreignKeys)) {
                if (referencedTable.referencedTable) {
                    relations.push({ type: 'outgoing', targetTable: referencedTable.referencedTable, onColumns: [referencedTable.column] });
                }
            }
        }
        return relations;
    }, [selectedTableSchema]);

    const renderTableList = () => (
        <div>
            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 mb-4">Available Tables</h3>
            <div className="relative mb-4">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input
                    placeholder="Search tables..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            <div className="space-y-2 max-h-[calc(100vh-550px)] overflow-y-auto pr-2 -mr-2">
                {isMetadataLoading ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center pt-10">Loading tables...</p>
                ) : (
                    filteredTables.map(table => {
                        const columnCount = Object.keys(table.columns).length;
                        const referencedCount = table.referencedTables ? Object.keys(table.referencedTables).length : 0;
                        const referencingCount = table.referencingTables ? Object.keys(table.referencingTables).length : 0;
                        const totalRelations = referencedCount + referencingCount;

                        return (
                            <button
                                key={table.name}
                                onClick={() => handleTableSelect(table.name)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${migrateItem.source.names?.[0] === table.name
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                                    }`}
                            >
                                <div className={`p-2 rounded-md ${migrateItem.source.names?.[0] === table.name ? 'bg-indigo-200/80 dark:bg-indigo-500/30' : 'bg-slate-200/80 dark:bg-slate-700/60'}`}>
                                    <Table size={16} />
                                </div>
                                <div>
                                    <p className={`font-semibold text-sm ${migrateItem.source.names?.[0] === table.name ? 'text-indigo-800 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-200'}`}>{table.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Key size={12} />
                                            {columnCount} columns
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Link2 size={12} />
                                            {totalRelations} relations
                                        </span>
                                    </div>
                                </div>
                            </button>
                        )
                    })
                )}
                {!isMetadataLoading && filteredTables.length === 0 && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center pt-10">No tables found.</p>
                )}
            </div>
        </div>
    );

    const renderSchemaDetails = () => (
        <div className={`transition-opacity duration-500 ${!selectedTableSchema && !isMetadataLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100 mb-4">Schema & Destination</h3>
                {selectedTableSchema ? (
                    <div className="space-y-6">
                        <div className="p-5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 p-3 rounded-lg">
                                    <Database size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{selectedTableSchema.name}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Source Table</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h5 className="font-semibold text-sm text-slate-600 dark:text-slate-300 mb-2">Columns</h5>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                                        {Object.entries(selectedTableSchema.columns).map(([col, info]) => (
                                            <li key={col} className="flex items-center gap-2 truncate">
                                                <Key size={12} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                                <span className="truncate">{col}: <span className="text-slate-500 dark:text-slate-400">{info.dataType}</span></span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {allRelations.length > 0 && (
                                    <div>
                                        <h5 className="font-semibold text-sm text-slate-600 dark:text-slate-300 mb-2">Detected Relations</h5>
                                        <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                                            {allRelations.map((rel, index) => (
                                                <li key={`${rel.targetTable}-${index}`} className="flex items-center gap-2">
                                                    <Link2 size={12} className={`flex-shrink-0 ${rel.type === 'outgoing' ? 'text-sky-500' : 'text-amber-500'}`} />
                                                    <span>
                                                        {rel.type === 'outgoing' ? 'Connects to ' : 'Referenced by '}
                                                        <span className="font-semibold text-slate-800 dark:text-slate-100">{rel.targetTable}</span>
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 p-3 rounded-lg">
                                    <ArrowRight size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Destination Table</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Optionally, rename the destination table.</p>
                                </div>
                            </div>
                            <Input
                                placeholder="Enter destination table name..."
                                value={destinationTableName}
                                onChange={e => handleDestinationNameChange(e.target.value)}
                                className="font-mono text-sm"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center text-center h-[200px]">
                        <p className="text-slate-500 dark:text-slate-400">
                            {isMetadataLoading ? 'Loading tables...' : 'Select a table to view its schema'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Section Intro */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Source Table</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Choose the main table to migrate from and name the destination table.
                </p>
            </div>

            {/* Body */}
            <div className="pt-8 border-slate-200 dark:border-slate-700/60">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {renderTableList()}
                    {renderSchemaDetails()}
                </div>

                {selectedTableSchema && metadata && (
                    <div className="mt-8">
                        <div className="p-5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                            <button
                                onClick={() => setIsDiagramVisible(!isDiagramVisible)}
                                className="w-full flex justify-between items-center text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 p-3 rounded-lg">
                                        <GitMerge size={20} />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Schema Diagram</h3>
                                </div>
                                <ChevronDown size={24} className={`text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isDiagramVisible ? 'rotate-180' : ''}`} />
                            </button>
                            {isDiagramVisible && (
                                <div className="mt-4 rounded-lg p-2">
                                    <ReactFlowProvider>
                                        <SchemaDiagram table={selectedTableSchema} metadata={metadata} />
                                    </ReactFlowProvider>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Step3_SelectTable;
