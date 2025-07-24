import { CheckCircle2, HelpCircle, Loader2, XCircle, Zap } from "lucide-react";
import { Connection, StatusType } from "../types/Connection";
import { DatabaseIcon } from "./common/Helper";

interface ConnectionCardProps {
    connection: Connection;
    isSelected: boolean;
    onClick: () => void;
}

const StatusIndicator = ({ status }: { status: StatusType }) => {
    const statusStyles: Record<StatusType, { icon: React.ReactNode, text: string, className: string }> = {
        untested: { icon: <HelpCircle size={14} />, text: 'Untested', className: 'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400' },
        testing: { icon: <Loader2 size={14} className="animate-spin" />, text: 'Testing...', className: 'text-sky-600 bg-sky-100 dark:bg-sky-500/20 dark:text-sky-400' },
        valid: { icon: <CheckCircle2 size={14} />, text: 'Active', className: 'text-green-600 bg-green-100 dark:bg-green-500/10 dark:text-green-400' },
        invalid: { icon: <XCircle size={14} />, text: 'Invalid', className: 'text-red-600 bg-red-100 dark:bg-red-500/10 dark:text-red-400' },
    };

    const currentStatus = statusStyles[status];

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${currentStatus.className}`}>
            {currentStatus.icon}
            <span>{currentStatus.text}</span>
        </div>
    );
};

const ConnectionCard = ({ connection, isSelected, status, onSelect, onTest }: { connection: Connection, isSelected: boolean, status: StatusType, onSelect: () => void, onTest: (e: React.MouseEvent) => void }) => {
    return (
        <button
            onClick={onSelect}
            className={`
                relative w-full text-left p-3 rounded-lg border-2 transition-all duration-200
                focus:outline-none focus:ring-4
                ${isSelected
                    ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-500/20 dark:border-indigo-500 focus:ring-indigo-300 dark:focus:ring-indigo-400/50'
                    : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 focus:ring-slate-300 dark:focus:ring-slate-600'
                }
            `}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-md ${isSelected ? 'bg-indigo-100 dark:bg-indigo-500/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        <DatabaseIcon type={connection.dataFormat} className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold text-slate-800 dark:text-slate-100 ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : ''}`}>{connection.name}</h3>
                        <p className={`text-xs text-slate-500 dark:text-slate-400 ${isSelected ? 'text-indigo-700/80 dark:text-indigo-300/80' : ''}`}>{connection.dataFormat}</p>
                    </div>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            </div>

            <div className="mt-3 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                <p><strong>Host:</strong> {connection.host}</p>
                <p><strong>Database:</strong> {connection.dbName}</p>
            </div>
        </button>
    );
};

export default ConnectionCard;