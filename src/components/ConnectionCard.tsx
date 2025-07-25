import { AlertCircle, CheckCircle2, HelpCircle, Loader2, RefreshCw, XCircle, Zap } from "lucide-react";
import { Connection, StatusType } from "../types/Connection";
import { DatabaseIcon } from "./common/Helper";

interface ConnectionCardProps {
    connection: Connection;
    isSelected: boolean;
    onClick: () => void;
}

const ConnectionStatus = ({ status }: { status: StatusType }) => {
    const STATUS_MAP: { [key in StatusType]: { text: string, icon: React.ReactNode, color: string } } = {
        valid: { text: 'Connected', icon: <CheckCircle2 size={12} />, color: 'text-green-600 dark:text-green-400' },
        invalid: { text: 'Failed', icon: <XCircle size={12} />, color: 'text-red-600 dark:text-red-400' },
        testing: { text: 'Testing...', icon: <RefreshCw size={12} className="animate-spin" />, color: 'text-yellow-600 dark:text-yellow-400' },
        untested: { text: 'Untested', icon: <AlertCircle size={12} />, color: 'text-slate-500 dark:text-slate-400' },
    };

    const currentStatus = STATUS_MAP[status] || STATUS_MAP.untested;

    return (
        <div className={`flex items-center gap-1.5 ${currentStatus.color}`}>
            {currentStatus.icon}
            <span className="text-xs font-medium">{currentStatus.text}</span>
        </div>
    );
};


const DATA_FORMAT_STYLES: { [key: string]: { bg: string, tag: string } } = {
    mysql: { bg: 'bg-green-500', tag: 'bg-slate-600' },
    pg: { bg: 'bg-blue-600', tag: 'bg-slate-600' },
    snowflake: { bg: 'bg-cyan-500', tag: 'bg-cyan-700' },
    default: { bg: 'bg-slate-500', tag: 'bg-slate-700' },
};

const ConnectionCard = ({ connection, isSelected, status, onSelect, onTest }: { connection: Connection, isSelected: boolean, status: StatusType, onSelect: () => void, onTest: (e: React.MouseEvent) => void }) => {
    const styles = DATA_FORMAT_STYLES[connection.dataFormat.toLowerCase()] || DATA_FORMAT_STYLES.default;

    return (
        <button
            onClick={onSelect}
            className={`
                relative w-full text-left p-4 rounded-xl transition-all duration-200
                focus:outline-none focus:ring-4 border-2
                ${isSelected
                    ? 'bg-indigo-50 dark:bg-slate-700/50 border-indigo-500 focus:ring-indigo-300 dark:focus:ring-indigo-400/50'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-slate-300 dark:focus:ring-slate-600'
                }
            `}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg ${styles.bg}`}>
                        <DatabaseIcon type={connection.dataFormat} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{connection.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{connection.host}:{connection.port}</p>
                        <ConnectionStatus status={connection.status} />
                    </div>
                </div>

                <div className={`text-xs font-semibold text-white px-3 py-1.5 rounded-md ${styles.tag}`}>
                    <p>{connection.dataFormat}</p>
                    {/* Placeholder for version */}
                    {/* <p className="text-center font-bold text-base">8.0</p> */}
                </div>
            </div>
        </button>
    );
};

export default ConnectionCard;