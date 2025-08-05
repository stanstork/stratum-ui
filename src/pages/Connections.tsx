import { useEffect, useState, Fragment } from "react";
import { Connection, createConnectionString, StatusType } from "../types/Connection";
import apiClient from "../services/apiClient";
import { motion } from "framer-motion";
import { Plus, RefreshCw, Pencil, Trash2, X, AlertTriangle, Zap, Server, Database, User } from "lucide-react";
import { DatabaseIcon, Spinner } from "../components/common/Helper";
import { Dialog, Transition } from '@headlessui/react';

export const dataFormatLabels: { [key: string]: string } = {
    mysql: 'MySQL',
    pg: 'PostgreSQL',
    snowflake: 'Snowflake',
    sqlite: 'SQLite',
    mongodb: 'MongoDB',
    oracle: 'Oracle',
    mssql: 'Microsoft SQL Server'
};

const statusStyles: { [key in StatusType]: { chip: string, dot: string } } = {
    valid: {
        chip: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        dot: 'bg-green-500'
    },
    invalid: {
        chip: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        dot: 'bg-red-500'
    },
    testing: {
        chip: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        dot: 'bg-yellow-500'
    },
    untested: {
        chip: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
        dot: 'bg-slate-500'
    }
};

const statusTextStyles: { [key in StatusType]: string } = {
    valid: 'text-green-700 dark:text-green-400',
    invalid: 'text-red-700 dark:text-red-400',
    testing: 'text-yellow-700 dark:text-yellow-400',
    untested: 'text-slate-600 dark:text-slate-400'
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, connectionName }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, connectionName: string | undefined }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black bg-opacity-60" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-900 dark:text-slate-50 flex items-center">
                                    <AlertTriangle className="text-red-500 mr-2" />
                                    Confirm Deletion
                                </Dialog.Title>
                                <div className="mt-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Are you sure you want to delete the connection <span className="font-semibold text-slate-800 dark:text-slate-200">{connectionName}</span>? This can't be undone.
                                    </p>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-slate-100 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-50 hover:bg-slate-200 dark:hover:bg-slate-600" onClick={onClose}>Cancel</button>
                                    <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700" onClick={onConfirm}>Delete</button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};


const ConnectionCard = ({ conn, onEdit, onDelete, onTest }: { conn: Connection, onEdit: (id: string) => void, onDelete: (id: string) => void, onTest: (id: string) => void }) => {
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    const statusStyle = statusStyles[conn.status] || statusStyles.untested;
    const statusTextStyle = statusTextStyles[conn.status] || statusTextStyles.untested;

    return (
        <motion.div
            layout
            variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
            className="bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
        >
            <div>
                <div className="flex items-center gap-4">
                    <DatabaseIcon type={conn.dataFormat} className="w-8 h-8 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-baseline gap-3">
                            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-50 truncate">{conn.name}</h3>
                            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex-shrink-0">{dataFormatLabels[conn.dataFormat] || conn.dataFormat}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`}></span>
                            <span className={`text-xs font-medium capitalize ${statusTextStyle}`}>{conn.status}</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-3 mt-5 text-sm border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-3">
                            <Server size={16} className="text-slate-400 flex-shrink-0" />
                            <span className="font-medium">Host:</span>
                        </div>
                        <span className="truncate font-mono">{conn.host}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-3">
                            <Database size={16} className="text-slate-400 flex-shrink-0" />
                            <span className="font-medium">Database:</span>
                        </div>
                        <span className="truncate font-mono">{conn.dbName}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-3">
                            <User size={16} className="text-slate-400 flex-shrink-0" />
                            <span className="font-medium">User:</span>
                        </div>
                        <span className="truncate font-mono">{conn.username}</span>
                    </div>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <RefreshCw size={14} />
                    <span>Last checked: {new Date(conn.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => handleActionClick(e, () => onTest(conn.id))} className="p-2 text-blue-500 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors" aria-label="Test connection">
                        <Zap size={18} />
                    </button>
                    <button onClick={(e) => handleActionClick(e, () => onEdit(conn.id))} className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors" aria-label="Edit connection">
                        <Pencil size={18} />
                    </button>
                    <button onClick={(e) => handleActionClick(e, () => onDelete(conn.id))} className="p-2 text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors" aria-label="Delete connection">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

type ConnectionsPageProps = {
    setView: (view: string) => void;
};

const ConnectionsPage = ({ setView }: ConnectionsPageProps) => {
    const [loading, setLoading] = useState(true);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [connectionToDelete, setConnectionToDelete] = useState<Connection | null>(null);

    useEffect(() => {
        apiClient.listConnections().then((data) => {
            setConnections(data);
        }).catch(err => {
            console.error("Failed to load connections", err);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const openDeleteModal = (id: string) => {
        const connection = connections.find(c => c.id === id);
        if (connection) {
            setConnectionToDelete(connection);
        }
    };

    const closeDeleteModal = () => {
        setConnectionToDelete(null);
    };

    const handleDeleteConnection = async () => {
        if (!connectionToDelete) return;
        try {
            await apiClient.deleteConnection(connectionToDelete.id); // Assumes apiClient.deleteConnection exists
            setConnections(prev => prev.filter(c => c.id !== connectionToDelete.id));
        } catch (error) {
            console.error("Failed to delete connection:", error);
            alert("Error: Could not delete the connection.");
        } finally {
            closeDeleteModal();
        }
    };

    const handleEditConnection = (id: string) => {
        setView(`connections/edit/${id}`);
    };

    const handleTestConnection = async (id: string) => {
        setConnections(prev => prev.map(c => c.id === id ? { ...c, status: 'testing' } : c));
        try {
            const result = await apiClient.testConnectionById(id);
            setConnections(prev => prev.map(c => c.id === id ? { ...c, status: result.error ? 'invalid' : 'valid', updatedAt: new Date().toISOString() } : c));
        } catch (error) {
            console.error("Failed to test connection:", error);
            setConnections(prev => prev.map(c => c.id === id ? { ...c, status: 'invalid', updatedAt: new Date().toISOString() } : c));
            alert("Error: Could not test the connection.");
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-indigo-500" size={32} /></div>;
    }

    return (
        <>
            <ConfirmationModal
                isOpen={!!connectionToDelete}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteConnection}
                connectionName={connectionToDelete?.name}
            />
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">Connections</h1>
                    <button onClick={() => setView('connections/new')} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
                        <Plus size={18} /> Add Connection
                    </button>
                </div>

                <motion.div
                    layout
                    variants={{ visible: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    {connections.length > 0 ? (
                        connections.map((conn) => (
                            <ConnectionCard key={conn.id} conn={conn} onEdit={handleEditConnection} onDelete={openDeleteModal} onTest={handleTestConnection} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                            <h3 className="text-lg font-semibold">No Connections Found</h3>
                            <p className="mt-2 text-sm">Click "Add Connection" to get started and connect to your databases.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </>
    );
};

export default ConnectionsPage;
