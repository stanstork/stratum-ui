import { Edit, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import Modal from "../components/common/Modal";
import ConnectionForm from "../components/ConnectionForm";
import { Connection, emptyConnection, StatusType } from "../types/Connection";
import apiClient from "../services/apiClient";
import { Spinner } from "../components/common/Helper";

const ConnectionManagement = () => {
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingConn, setEditingConn] = useState<Connection | undefined>(undefined);
    const [connections, setConnections] = useState<Connection[]>([]);

    const handleCreate = () => {
        setEditingConn(emptyConnection());
        setIsFormOpen(true);
    };

    const handleEdit = (conn: React.SetStateAction<Connection | undefined>) => { setEditingConn(conn); setIsFormOpen(true); };
    const handleDelete = (connId: string) => setConnections(connections.filter(c => c.id !== connId));
    const updateConnectionStatus = (connId: string, status: StatusType) => {
        setConnections(prevConns => prevConns.map(c => c.id === connId ? { ...c, status } : c));
    };

    const handleSave = async (connToSave: Connection) => {
        const exists = connections.some(c => c.id === connToSave.id);
        try {
            if (exists) {
                const updatedConn = await apiClient.updateConnection(connToSave);
                setConnections(connections.map(c => c.id === connToSave.id ? updatedConn : c));
            } else {
                const createdConn = await apiClient.createConnection(connToSave);
                setConnections([...connections, createdConn]);
            }
        } catch (error) {
            // Optionally handle error (e.g., show notification)
        } finally {
            setIsFormOpen(false);
            setEditingConn(undefined);
        }
    };

    const StatusIndicator = ({ status }: { status: StatusType }) => {
        const styles: Record<StatusType, string> = {
            valid: 'bg-green-500',
            invalid: 'bg-red-500',
            testing: 'bg-yellow-500 animate-pulse',
            untested: 'bg-slate-400'
        };
        return <div className={`w-2.5 h-2.5 rounded-full ${styles[status]}`} title={`Status: ${status}`} />;
    };

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const connections = await apiClient.listConnections();
                setConnections(connections);
            } finally {
                setLoading(false);
            }
        }

        fetchConnections();
    }, []);


    if (loading) {
        return <Spinner />;
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Connection Management</h1>
                <button onClick={handleCreate} className="px-4 py-2 bg-cyan-500 text-white font-semibold rounded-lg shadow hover:bg-cyan-600 transition-all flex items-center"><Plus size={18} className="mr-2" /> Create New</button>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-xl shadow-lg shadow-slate-900/5 p-4 space-y-3">
                {connections.map(conn => (
                    <div key={conn.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <StatusIndicator status={conn.status} />
                            <div><p className="font-semibold text-slate-800 dark:text-slate-200">{conn.name}</p><p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{conn.format} - {conn.connStr}</p></div>
                        </div>
                        <div className="flex items-center space-x-3"><button onClick={() => handleEdit(conn)} className="text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"><Edit size={18} /></button><button onClick={() => handleDelete(conn.id)} className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={18} /></button></div>
                    </div>
                ))}
                {connections.length === 0 && <p className="text-center text-slate-500 py-8">No connections defined. Click "Create New" to add one.</p>}
            </div>
            {isFormOpen && editingConn && (
                <Modal onClose={() => setIsFormOpen(false)}>
                    <ConnectionForm
                        connection={editingConn}
                        onSave={handleSave}
                        onCancel={() => setIsFormOpen(false)}
                        updateConnectionStatus={updateConnectionStatus}
                    />
                </Modal>
            )}
        </>
    );
}

export default ConnectionManagement;