import { useEffect, useState, Fragment } from "react";
import apiClient from "../services/apiClient";
import { JobDefinition } from "../types/JobDefinition";
import { motion } from "framer-motion";
import { Plus, ArrowRight, RefreshCw, Pencil, Trash2, X, AlertTriangle, Play, Calendar, Info, InfoIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DatabaseIcon } from "../components/common/Helper";
import { Dialog, Transition } from '@headlessui/react';


const ConfirmationModal = ({ isOpen, onClose, onConfirm, definitionName }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, definitionName: string | undefined }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-60" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900 dark:text-slate-50 flex items-center">
                                    <AlertTriangle className="text-red-500 mr-2" />
                                    Confirm Deletion
                                </Dialog.Title>
                                <div className="mt-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Are you sure you want to delete the definition <span className="font-semibold text-slate-800 dark:text-slate-200">{definitionName}</span>? This action cannot be undone.
                                    </p>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-slate-100 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-50 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                        onClick={onConfirm}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

const RunConfirmationModal = ({ isOpen, onClose, onConfirm, definitionName }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, definitionName: string | undefined }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-60" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900 dark:text-slate-50 flex items-center">
                                    <InfoIcon className="text-blue-500 mr-2" />
                                    Confirm Run
                                </Dialog.Title>
                                <div className="mt-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Are you sure you want to run the migration <span className="font-semibold text-slate-800 dark:text-slate-200">{definitionName}</span>?
                                    </p>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-slate-100 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-50 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                        onClick={onConfirm}
                                    >
                                        Run
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};


const DefinitionCard = ({ def, onDelete, onRun }: { def: JobDefinition, onDelete: (id: string) => void, onRun: (id: string) => void }) => {
    const navigate = useNavigate();

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <div
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
                        className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        aria-label="Edit definition"
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        onClick={(e) => handleActionClick(e, () => onRun(def.id))}
                        className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        aria-label="Run migration"
                    >
                        <Play size={18} />
                    </button>
                    <button
                        onClick={(e) => handleActionClick(e, () => onDelete(def.id))}
                        className="p-2 text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                        aria-label="Delete definition"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};


const MigrationDefinitionsList = () => {
    const [definitions, setDefinitions] = useState<JobDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [definitionToDelete, setDefinitionToDelete] = useState<JobDefinition | null>(null);
    const [definitionToRun, setDefinitionToRun] = useState<JobDefinition | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        apiClient.getJobDefinitions().then((data) => {
            setDefinitions(data);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load definitions", err);
            setLoading(false);
        });
    }, []);

    const openDeleteModal = (id: string) => {
        const definition = definitions.find(d => d.id === id);
        if (definition) {
            setDefinitionToDelete(definition);
        }
    };

    const openRunModal = (id: string) => {
        const definition = definitions.find(d => d.id === id);
        if (definition) {
            setDefinitionToRun(definition);
        }
    };

    const closeDeleteModal = () => {
        setDefinitionToDelete(null);
    };

    const handleDeleteDefinition = async () => {
        if (!definitionToDelete) return;

        try {
            // Assuming your apiClient has a method like this.
            // You might need to implement it.
            await apiClient.deleteJobDefinition(definitionToDelete.id);

            // Update state to remove the deleted definition
            setDefinitions(prevDefinitions =>
                prevDefinitions.filter(d => d.id !== definitionToDelete.id)
            );

        } catch (error) {
            console.error("Failed to delete definition:", error);
            // Here you could show an error notification to the user
            alert("Error: Could not delete the definition.");
        } finally {
            closeDeleteModal();
        }
    };


    return (
        <>
            <ConfirmationModal
                isOpen={!!definitionToDelete}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteDefinition}
                definitionName={definitionToDelete?.name}
            />
            <RunConfirmationModal
                isOpen={!!definitionToRun}
                onClose={() => setDefinitionToRun(null)}
                onConfirm={() => {
                    if (definitionToRun) {
                        apiClient.runJob(definitionToRun.id).then(() => {
                            alert("Migration started successfully!");
                        }).catch(err => {
                            console.error("Failed to run migration:", err);
                            alert("Error: Could not start the migration.");
                        });
                    }
                    setDefinitionToRun(null);
                }}
                definitionName={definitionToRun?.name}
            />
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
                        layout
                        variants={{ visible: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        {definitions.length > 0 ? (
                            definitions.map((def) => <DefinitionCard key={def.id} def={def} onDelete={openDeleteModal} onRun={openRunModal} />)
                        ) : (
                            <div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400">
                                <p className="font-semibold text-lg">No definitions found.</p>
                                <p className="mt-2">Click "Create Definition" to get started.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </>
    );
}

export default MigrationDefinitionsList;
