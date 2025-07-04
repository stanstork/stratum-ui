import { useState } from "react";
import Input from "./common/Input";
import Select from "./common/Select";
import { LoaderCircle } from "lucide-react";
import { Connection, createConnectionString, StatusType } from "../types/Connection";
import apiClient from "../services/apiClient";

const dataFormats = ["MySql", "Postgres", "CSV"];

interface ConnectionFormProps {
    connection: Connection;
    onSave: (conn: Connection) => void;
    onCancel: () => void;
    updateConnectionStatus: (connId: string, status: StatusType) => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ connection, onSave, onCancel, updateConnectionStatus }) => {
    const [conn, setConn] = useState(connection || { name: '', format: 'MySql', connStr: '', status: 'untested' });
    const [isTesting, setIsTesting] = useState(false);
    const [testLogs, setTestLogs] = useState<string[]>([]);

    const isNew = !connection.id;
    const handleChange = (field: string, value: string) => setConn(c => ({ ...c, [field]: value }));

    const handleTest = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setIsTesting(true);
        setTestLogs([]);
        try {
            const testResult = await apiClient.testConnection(conn.dataFormat, createConnectionString(conn));
            if (testResult.error) {
                setTestLogs([testResult.error]);
                updateConnectionStatus(conn.id, 'invalid');
                setConn(c => ({ ...c, status: 'invalid' }));
            } else {
                setTestLogs(testResult.logs ? testResult.logs.split('\n') : []);
                updateConnectionStatus(conn.id, 'valid');
                setConn(c => ({ ...c, status: 'valid' }));
            }
        } catch (err: any) {
            setTestLogs([err.message || 'Unknown error occurred']);
            updateConnectionStatus(conn.id, 'invalid');
            setConn(c => ({ ...c, status: 'invalid' }));
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = () => onSave({ ...conn, id: conn.id || `conn-${Date.now()}` });

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{isNew ? 'Create New Connection' : 'Edit Connection'}</h2>
            <Input label="Connection Name" value={conn.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g., Production MySQL" />
            {/*
              Move database options to an array for easier management.
            */}
            <Select
                label="Database Format"
                value={conn.dataFormat}
                onChange={e => handleChange('format', e.target.value)}
            >
                {dataFormats.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </Select>
            <Input label="Connection String" value={createConnectionString(conn)} onChange={e => handleChange('connStr', e.target.value)} placeholder="db://user:pass@host/db" />

            {testLogs.length > 0 && (
                <div className="mt-4">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Test Log</label>
                    <pre className="bg-slate-800 text-slate-200 text-xs p-3 rounded-lg overflow-x-auto h-24 font-mono">{testLogs.join('\n')}</pre>
                </div>
            )}

            <div className="flex justify-between items-center pt-4">
                <button onClick={handleTest} disabled={isTesting} className="px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-slate-700 flex items-center disabled:bg-slate-400">
                    {isTesting && <LoaderCircle size={16} className="animate-spin mr-2" />}
                    Test Connection
                </button>
                <div className="flex space-x-2">
                    <button onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-cyan-500 text-white text-sm font-semibold rounded-lg shadow hover:bg-cyan-600">Save</button>
                </div>
            </div>
        </div>
    );
}

export default ConnectionForm;