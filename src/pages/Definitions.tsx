import { useEffect, useState } from "react";
import { useAppContext } from "../App";
import apiClient from "../services/apiClient";
import { JobDefinition } from "../types/JobDefinition";
import Card from "../components/common/Card";
import { CardContent, CardHeader, Spinner } from "../components/common/Helper";
import { motion } from "framer-motion";
import { PlusIcon } from "../components/icons/Helper";
import { useNavigate } from "react-router-dom";


const Definitions = () => {
    const [definitions, setDefinitions] = useState<JobDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const { setPage, setViewDefinitionId } = useAppContext();
    const navigate = useNavigate();
    const listVariants = { visible: { transition: { staggerChildren: 0.05 } }, hidden: {} };
    const itemVariants = { visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } };

    useEffect(() => {
        apiClient.getJobDefinitions().then((data) => {
            setDefinitions(data);
            setLoading(false);
        });
    }, []);

    return (
        <Card>
            <CardHeader actions={
                <button onClick={() => navigate("/definitions/new")} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200">
                    <PlusIcon /> Create Definition
                </button>
            }>Job Definitions</CardHeader>
            <CardContent>
                {loading ? <Spinner /> : (
                    <motion.ul variants={listVariants} initial="hidden" animate="visible" role="list" className="divide-y divide-black/5 dark:divide-white/5">
                        {definitions.map((def) => (
                            <motion.li variants={itemVariants} key={def.id} className="relative py-5 px-1 hover:bg-gray-50/50 dark:hover:bg-white/5 rounded-lg transition-colors duration-150">
                                <div className="flex justify-between space-x-3">
                                    <div className="min-w-0 flex-1">
                                        <a href="#" onClick={(e) => { e.preventDefault(); setViewDefinitionId(def.id); setPage('job-definition-detail'); }} className="block focus:outline-none">
                                            <span className="absolute inset-0" aria-hidden="true" />
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{def.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-mono">{def.id}</p>
                                        </a>
                                    </div>
                                </div>
                                <div className="mt-1">
                                    <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                                        {"Hardcoded description for the job definition. This should be replaced with the actual description from the definition."}
                                    </p>
                                </div>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </CardContent>
        </Card>
    );
}

export default Definitions;