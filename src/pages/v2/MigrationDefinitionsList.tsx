import { useEffect, useState, Fragment } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowRight, RefreshCw, Pencil, Trash2, X, AlertTriangle, Play, Calendar, Info, InfoIcon, Eye, Edit, FileText, BarChart3, CheckCircle, XCircle, Activity, Clock, Database, Search, Grid3X3, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from '@headlessui/react';
import { JobDefinition } from "../../types/JobDefinition";
import apiClient from "../../services/apiClient";
import { getConnectionIcon } from "../../components/common/Helper";
import { Link } from "react-router-dom";
import { Button } from "../../components/common/v2/Button";
import { Card, CardContent } from "../../components/common/v2/Card";
import { formatDistanceToNow } from "date-fns";
import Input from "../../components/common/Input";
import { cn } from "../../utils/utils";

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
                            <div className="flex items-start justify-between mb-1">
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                    {def.name}
                                </h3>
                                <span className="text-sm text-gray-500 text-right ml-4">
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
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 my-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4 my-2 text-center">
                            <div>
                                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-1">
                                    <BarChart3 className="text-blue-600 dark:text-blue-400" size={16} />
                                </div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white py-2">3</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider py-2">Total Runs</p>
                            </div>
                            <div>
                                <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto mb-1">
                                    <CheckCircle className="text-green-600 dark:text-green-400" size={16} />
                                </div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize py-2">Succeeded</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider py-2">Last Run</p>
                            </div>
                            <div>
                                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg mx-auto mb-1">
                                    <Database className="text-purple-600 dark:text-purple-400" size={16} />
                                </div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white py-2">1.2 GB</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider py-2">Processed</p>
                            </div>
                            <div>
                                <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg mx-auto mb-1">
                                    <Clock className="text-orange-600 dark:text-orange-400" size={16} />
                                </div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white py-2">3m 14s</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider py-2">Avg Duration</p>
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

const DefinitionRow = ({ def, onDelete, onRun }: { def: JobDefinition, onDelete: (id: string) => void, onRun: (id: string) => void }) => {
    // Placeholder data
    const stats = {
        status: "Active",
        lastRun: "Completed",
        totalRuns: 12,
        dataProcessed: "2.3M records",
        avgDuration: "4m 32s"
    };

    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                        <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{def.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{def.description || "No description"}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center">
                    <CheckCircle className="mr-1.5 h-4 w-4 text-green-500" />
                    {stats.lastRun}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{stats.totalRuns}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{stats.dataProcessed}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{stats.avgDuration}</td>
            <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                <div>
                    <Button asChild variant="ghost" size="icon"><Link to={`/definitions/${def.id}`}><Eye size={18} /></Link></Button>
                    <Button asChild variant="ghost" size="icon"><Link to={`/wizard/${def.id}`}><Edit size={18} /></Link></Button>
                    <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40" onClick={() => onRun(def.id)}><Play size={18} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-500 dark:text-red-400 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40" onClick={() => onDelete(def.id)}><Trash2 size={18} /></Button>
                </div>
            </td>
        </tr>
    );
};

const DefinitionTable = ({ definitions, onDelete, onRun }: { definitions: JobDefinition[], onDelete: (id: string) => void, onRun: (id: string) => void }) => (
    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
        <CardContent className="p-0">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Last Run</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Total Runs</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Data Processed</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Avg Duration</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {definitions.map((def) => (
                            <DefinitionRow key={def.id} def={def} onDelete={onDelete} onRun={onRun} />
                        ))}
                    </tbody>
                </table>
            </div>
        </CardContent>
    </Card>
);

const MigrationDefinitionsList = () => {
    const [definitions, setDefinitions] = useState<JobDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [definitionToDelete, setDefinitionToDelete] = useState<JobDefinition | null>(null);
    const [definitionToRun, setDefinitionToRun] = useState<JobDefinition | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [viewMode, setViewMode] = useState<"list" | "table">("list");

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

    // Filter pills
    const filterOptions = [
        { value: "all", label: "All", count: definitions?.length || 0 },
        // { value: "active", label: "Active", count: definitions?.filter(d => d.status === "active").length || 0 },
        // { value: "inactive", label: "Inactive", count: definitions?.filter(d => d.status === "inactive").length || 0 },
        // { value: "paused", label: "Paused", count: definitions?.filter(d => d.status === "paused").length || 0 },
        // { value: "draft", label: "Draft", count: definitions?.filter(d => d.status === "draft").length || 0 }
    ];

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

                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            type="text"
                            placeholder="Search definitions by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full md:w-80"
                            data-testid="search-definitions"
                        />
                    </div>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-md transition-colors", viewMode === "list" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white")} data-testid="view-toggle-list">
                            <Grid3X3 size={16} />
                        </button>
                        <button onClick={() => setViewMode("table")} className={cn("p-2 rounded-md transition-colors", viewMode === "table" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white")} data-testid="view-toggle-table">
                            <List size={16} />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {definitions.length > 0 ? (
                        viewMode === "list" ? (
                            definitions.map((def) => (
                                <DefinitionCard key={def.id} def={def} onDelete={openDeleteModal} onRun={openRunModal} />
                            ))
                        ) : (
                            <DefinitionTable definitions={definitions} onDelete={openDeleteModal} onRun={openRunModal} />
                        )
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
