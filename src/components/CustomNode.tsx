import { Handle, Position } from 'reactflow';
import { TableMetadata } from "../types/Metadata";

const CustomNode = ({ data }: { data: TableMetadata }) => (
    <div className="bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-lg shadow-lg w-64">
        <div className="bg-indigo-500 text-white p-3 rounded-t-md">
            <h3 className="font-bold text-lg">{data.name}</h3>
        </div>

        <div className="p-3 space-y-1">
            {Object.entries(data.columns).map(([columnName, columnInfo]) => (
                <div key={columnName} className="relative flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md">

                    {/* TARGET HANDLE: For incoming connections to this column */}
                    <Handle
                        type="target"
                        position={Position.Left}
                        id={columnName} // The ID matches the column name
                        style={{ top: '50%', background: '#a855f7' }}
                    />

                    <span className="font-mono text-slate-700 dark:text-slate-300">{columnName}</span>
                    <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs">
                        {columnInfo.dataType}
                    </span>

                    {/* SOURCE HANDLE: For outgoing connections from this column */}
                    <Handle
                        type="source"
                        position={Position.Right}
                        id={columnName} // The ID matches the column name
                        style={{ top: '50%', background: '#6366f1' }}
                    />
                </div>
            ))}
        </div>
    </div>
);

export default CustomNode;