import { useEffect, useState } from "react";
import apiClient from "../services/apiClient";
import { JobDefinition } from "../types/JobDefinition";
import { motion } from "framer-motion";
import { Plus, ArrowRight, RefreshCw, Pencil, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DatabaseIcon } from "../components/common/Helper";

const DefinitionCard = ({ def }: { def: JobDefinition }) => {
    const navigate = useNavigate();

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <motion.div
            variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
            className="bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
            onClick={() => navigate(`/definitions/${def.id}`)}
        >
            <div>
                {/* Top Section */}
                <h3 className="font-bold text-xl text-slate-900 dark:text-slate-50 truncate">{def.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1 mb-5 text-sm">{def.description || "No description."}</p>

                {/* Connections */}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <DatabaseIcon type={def.sourceConnection?.dataFormat} className="w-4 h-4 text-slate-400" />
                    <span className="font-medium truncate">{def.sourceConnection?.name}</span>
                    <ArrowRight size={16} className="text-slate-400 flex-shrink-0" />
                    <DatabaseIcon type={def.destinationConnection?.dataFormat} className="w-4 h-4 text-slate-400" />
                    <span className="font-medium truncate">{def.destinationConnection?.name}</span>
                </div>

                {/* Last Modified */}
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-2">
                    <Calendar size={14} />
                    <span>Created: {new Date(def.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Footer Section */}
            <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                    <span>Active</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => handleActionClick(e, () => navigate(`/wizard/${def.id}`))}
                        className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        onClick={(e) => handleActionClick(e, () => alert('Run migration!'))}
                        className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                    >
                        Run
                    </button>
                </div>
            </div>
        </motion.div>
    );
};


const MigrationDefinitionsList = () => {
    const [definitions, setDefinitions] = useState<JobDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        apiClient.getJobDefinitions().then((data) => {
            setDefinitions(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">Migration Definitions</h1>
                <button onClick={() => navigate("/wizard")} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
                    <Plus size={18} /> Create Definition
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <RefreshCw className="animate-spin text-indigo-500" size={32} />
                </div>
            ) : (
                <motion.div
                    variants={{ visible: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    {definitions.length > 0 ? (
                        definitions.map((def) => <DefinitionCard key={def.id} def={def} />)
                    ) : (
                        <div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400">
                            <p className="font-semibold text-lg">No definitions found.</p>
                            <p className="mt-2">Click "Create Definition" to get started.</p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default MigrationDefinitionsList;
