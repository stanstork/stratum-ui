import React, { useMemo } from "react";
import Select from "./Select";
import { TableMetadata } from "../../types/Metadata";

type ColumnSelectorProps = {
    allTables: TableMetadata[];
    selectedTable: string;
    selectedColumn: string;
    onTableChange: (table: string) => void;
    onColumnChange: (column: string) => void;
    tablePlaceholder?: string;
    columnPlaceholder?: string;
    disabled?: boolean;
};

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
    allTables,
    selectedTable,
    selectedColumn,
    onTableChange,
    onColumnChange,
    tablePlaceholder = "Select table...",
    columnPlaceholder = "Select column...",
    disabled = false,
}) => {
    const tableOptions = allTables.map(t => ({ value: t.name, label: t.name }));
    const columnOptions = useMemo(() => {
        const table = allTables.find(t => t.name === selectedTable);
        return table
            ? Object.keys(table.columns).map(columnName => ({
                value: columnName,
                label: columnName,
            }))
            : [];
    }, [selectedTable, allTables]);
    return (
        <div className="flex items-center gap-2 w-full">
            <div className="w-1/2"><Select value={selectedTable} onChange={e => onTableChange(e.target.value)} options={tableOptions} placeholder={tablePlaceholder} disabled={disabled} /></div>
            <div className="w-1/2"><Select value={selectedColumn} onChange={e => onColumnChange(e.target.value)} options={columnOptions} placeholder={columnPlaceholder} disabled={disabled || !selectedTable} /></div>
        </div>
    );
};

export default ColumnSelector;