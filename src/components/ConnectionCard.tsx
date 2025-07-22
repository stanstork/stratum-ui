import { CheckCircle2 } from "lucide-react";
import { Connection } from "../types/Connection";
import { DatabaseIcon } from "./common/Helper";

interface ConnectionCardProps {
    connection: Connection;
    isSelected: boolean;
    onClick: () => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, isSelected, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`relative text-left w-full p-4 rounded-xl transition-all duration-200 group
                ${isSelected
                    ? 'bg-white dark:bg-slate-800/80 ring-2 ring-indigo-500 shadow-lg'
                    : 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1'
                }`}
        >
            {isSelected ? (
                <CheckCircle2 size={20} className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-slate-800 group-hover:scale-125 transition-transform"></div>
            )}

            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                    <DatabaseIcon type={connection.dataFormat} />
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{connection.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{connection.dataFormat}</p>
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <p><span className="font-semibold text-slate-500 dark:text-slate-500">Host:</span> {connection.host}</p>
                        <p><span className="font-semibold text-slate-500 dark:text-slate-500">Database:</span> {connection.dbName}</p>
                    </div>
                </div>
            </div>
        </button>
    );
};

export default ConnectionCard;