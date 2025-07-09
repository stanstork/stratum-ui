import { useMemo } from "react";
import { TableMetadata } from "../types/Metadata";
import { JoinCondition } from "../types/MigrationConfig";
import { getLookupData } from "../utils/meta";
import Select from "./common/v2/Select";
import { X } from "lucide-react";
import ColumnSelector from "./common/v2/ColumnSelector";

interface JoinItemProps {
    index: number;
    entity: string;
    match: JoinCondition;
    sourceTableSchema: TableMetadata | null;
    availableJoinTables: TableMetadata[];
    getTableSchema: (tableName: string) => TableMetadata | null;
    onUpdateTable: (index: number, newTableName: string) => void;
    onUpdateCondition: () => void;
    onRemove: (index: number) => void;
}

const JoinItem: React.FC<JoinItemProps> = ({ index, entity, match, sourceTableSchema, availableJoinTables, getTableSchema, onUpdateTable, onUpdateCondition, onRemove }) => {

    const { entity: leftEntity, column: leftColumn } = getLookupData(match.left);
    const { entity: rightEntity, column: rightColumn } = getLookupData(match.right);

    const availableFromTables = useMemo(() => sourceTableSchema ? [sourceTableSchema] : [], [sourceTableSchema]);
    const currentJoinTableSchema = useMemo(() => getTableSchema(entity), [entity, getTableSchema]);

    return (
        <div className="bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Join #{index + 1}</h3>
                <button onClick={() => onRemove(index)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"><X size={18} /></button>
            </div>
            <div className="mb-4">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Join Table</label>
                <Select
                    value={entity}
                    onChange={e => onUpdateTable(index, e.target.value)}
                    options={(currentJoinTableSchema ? [currentJoinTableSchema, ...availableJoinTables] : availableJoinTables)
                        .map(t => ({ value: t.name, label: t.name }))}
                    placeholder="Select a table..."
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Join Condition (ON)</label>
                <div className="flex items-center gap-2 flex-wrap">
                    <ColumnSelector
                        allTables={availableFromTables}
                        selectedTable={leftEntity}
                        selectedColumn={leftColumn}
                        onColumnChange={(val) => onUpdateCondition()} onTableChange={function (table: string): void {
                            throw new Error("Function not implemented.");
                        }} />
                    <span className="text-slate-500 dark:text-slate-400 font-mono pt-1">=</span>
                    <ColumnSelector
                        allTables={currentJoinTableSchema ? [currentJoinTableSchema] : []}
                        selectedTable={rightEntity}
                        selectedColumn={rightColumn}
                        onColumnChange={(val) => onUpdateCondition()}
                        disabled={!entity} onTableChange={function (table: string): void {
                            throw new Error("Function not implemented.");
                        }} />
                </div>
            </div>
        </div>
    );
};

export default JoinItem;