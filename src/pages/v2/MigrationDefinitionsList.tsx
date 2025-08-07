import { useEffect, useState, Fragment } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowRight, RefreshCw, Pencil, Trash2, X, AlertTriangle, Play, Calendar, Info, InfoIcon, Eye, Edit, FileText, BarChart3, CheckCircle, XCircle, Activity, Clock, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from '@headlessui/react';
import { JobDefinition } from "../../types/JobDefinition";
import apiClient from "../../services/apiClient";
import { getConnectionIcon } from "../../components/common/Helper";
import { Link } from "react-router-dom";
import { Button } from "../../components/common/v2/Button";
import { Card, CardContent } from "../../components/common/v2/Card";
import { formatDistanceToNow } from "date-fns";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, definitionName }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, definitionName: string | undefined }) => {
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
        <div className="space-y-4">
            <Card
                key={def.id}
                className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] rounded-[12px] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] bg-white dark:bg-slate-800"
            >
                <CardContent className="p-6">
                    {/* Main content section */}
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                                <FileText className="text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {def.name}
                                </h3>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    Updated {def.updatedAt
                                        ? formatDistanceToNow(new Date(def.updatedAt), { addSuffix: true })
                                        : "unknown"
                                    }
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {def.description || "No description provided"}
                            </p>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 my-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 my-6 text-center">
                            <div>
                                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-2">
                                    <BarChart3 className="text-blue-600 dark:text-blue-400" size={16} />
                                </div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">3</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider">Total Runs</p>
                            </div>
                            <div>
                                <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto mb-2">
                                    <CheckCircle className="text-green-600 dark:text-green-400" size={16} />
                                </div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">Succeeded</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider">Last Run</p>
                            </div>
                            <div>
                                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg mx-auto mb-2">
                                    <Database className="text-purple-600 dark:text-purple-400" size={16} />
                                </div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">1.2 GB</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider">Processed</p>
                            </div>
                            <div>
                                <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg mx-auto mb-2">
                                    <Clock className="text-orange-600 dark:text-orange-400" size={16} />
                                </div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">3m 14s</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider">Avg Duration</p>
                            </div>
                        </div>
                    </div>

                    {/* Border separator */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <div className="flex items-center justify-between">
                            {/* Connection Flow */}
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    {getConnectionIcon(def.sourceConnection.dataFormat)}
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {def.sourceConnection.name}
                                    </span>
                                </div>
                                <div className="flex items-center px-2 text-slate-400">
                                    <span className="text-lg">→</span>
                                </div>
                                <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    {getConnectionIcon(def.destinationConnection.dataFormat)}
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {def.destinationConnection.name}
                                    </span>
                                </div>
                            </div>

                            {/* Action buttons section */}
                            <div className="flex items-center space-x-1">
                                <Link to={`/definitions/${def.id}`}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 w-9 p-0 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50"
                                        onClick={(e) => handleActionClick(e, () => navigate(`/definitions/${def.id}`))}>
                                        < Eye size={16} />
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40"
                                    onClick={(e) => handleActionClick(e, () => onRun(def.id))}>
                                    <Play size={16} />
                                </Button>
                                <Link to={`/wizard/${def.id}`}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 w-9 p-0 text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700/50"
                                        onClick={(e) => handleActionClick(e, () => navigate(`/wizard/${def.id}`))}>
                                        <Edit size={16} />
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0 text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
                                    onClick={(e) => handleActionClick(e, () => onDelete(def.id))}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};

const MigrationDefinitionsList = () => {
    const [definitions, setDefinitions] = useState<JobDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [definitionToDelete, setDefinitionToDelete] = useState<JobDefinition | null>(null);
    const [definitionToRun, setDefinitionToRun] = useState<JobDefinition | null>(null);

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

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <DeleteConfirmationModal
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-[32px] font-bold leading-tight text-slate-900 dark:text-white">
                            Migration Definitions
                        </h1>
                        <p className="mt-3 text-slate-700 dark:text-slate-300">
                            Create and manage reusable migration templates
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <Link to="/wizard">
                            <Button className="flex items-center space-x-2" variant="primary">
                                <Plus size={16} />
                                <span>New Definition</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="space-y-4">
                    {definitions.length > 0 ? (
                        definitions.map((def) => <DefinitionCard key={def.id} def={def} onDelete={openDeleteModal} onRun={openRunModal} />)
                    ) : (
                        <div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400">
                            <p className="font-semibold text-lg">No definitions found.</p>
                            <p className="mt-2">Click "Create Definition" to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default MigrationDefinitionsList;
