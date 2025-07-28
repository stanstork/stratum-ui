import { useEffect, useState } from "react";
import apiClient from "../services/apiClient";
import { JobDefinition } from "../types/JobDefinition";
import { motion } from "framer-motion";
import { Plus, Search, ArrowRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DatabaseIcon } from "../components/common/Helper";

const DefinitionCard = ({ def }: { def: JobDefinition }) => {
    const navigate = useNavigate();

    return (
        <motion.div
            variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
            className="bg-white dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full"
            onClick={() => navigate(`/definitions/${def.id}`)}
        >
            <div className="flex-grow">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{def.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 h-10">{def.description || "No description provided."}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 truncate">
                    <DatabaseIcon type={def.sourceConnection?.dataFormat} className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate" title={def.sourceConnection?.name}>{def.sourceConnection?.name}</span>
                </div>
                <ArrowRight className="text-slate-400 dark:text-slate-500 mx-2 flex-shrink-0" />
                <div className="flex items-center gap-2 truncate">
                    <DatabaseIcon type={def.destinationConnection?.dataFormat} className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate" title={def.destinationConnection?.name}>{def.destinationConnection?.name}</span>
                </div>
            </div>
        </motion.div>
    )
};


const Definitions = () => {
    const [definitions, setDefinitions] = useState<JobDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        apiClient.getJobDefinitions().then((data) => {
            setDefinitions(data);
            setLoading(false);
        });
    }, []);

    const filteredDefinitions = definitions
        .filter(def => def.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Migration Definitions</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage, edit, and create new migration jobs.</p>
                </div>
                <button onClick={() => navigate("/wizard")} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
                    <Plus size={18} /> Create Definition
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-grow">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search definitions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                </div>
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
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredDefinitions.length > 0 ? (
                        filteredDefinitions.map((def) => <DefinitionCard key={def.id} def={def} />)
                    ) : (
                        <div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400">
                            <p className="font-semibold">No definitions found.</p>
                            <p>Try adjusting your search.</p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default Definitions;
