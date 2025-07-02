import { useState } from "react";
import Card from "./common/v2/Card";
import CardHeader from "./common/v2/CardHeader";
import Input from "./common/v2/Input";
import Button from "./common/v2/Button";
import { Loader, Wifi } from "lucide-react";
import Select from "./common/v2/Select";
import apiClient from "../services/apiClient";
import { Connection } from "../types/Connection";

type ConnectionWizardProps = {
    onBack: () => void;
};

const ConnectionWizard = ({ onBack }: ConnectionWizardProps) => {
    type ConnDetails = {
        type: string; // 'PostgreSQL' | 'MySQL'
        name: string;
        host: string;
        port: string;
        user: string;
        password: string;
        db: string;
    };

    const [connDetails, setConnDetails] = useState<ConnDetails>({
        type: 'PostgreSQL',
        name: '',
        host: '',
        port: '5432',
        user: '',
        password: '',
        db: ''
    });
    const [testLogs, setTestLogs] = useState<string[]>([]);
    const [isTesting, setIsTesting] = useState(false);
    const [testSucceeded, setTestSucceeded] = useState(false);

    const handleTest = async () => {
        setIsTesting(true);
        setTestSucceeded(false);
        setTestLogs([]);
        
        try {
            let connStr = createConnStr();
            const testResult = await apiClient.testConnection(connDetails.type, connStr);
            if (testResult.error) {
                setTestLogs([testResult.error]);
            } else {
                setTestLogs(testResult.logs ? testResult.logs.split('\n') : []);
                setTestSucceeded(true);
            }
        } catch (err: any) {
            setTestLogs([err.message || 'Unknown error occurred']);
        } finally {
            setIsTesting(false);
        }  
    };

    const createConnStr = ():string => {
        let connStr = "";
        if (connDetails.type === "PostgreSQL") {
            connStr = `postgresql://${connDetails.user}:${connDetails.password}@${connDetails.host}:${connDetails.port}/${connDetails.db}`;
        } else if (connDetails.type === "MySQL") {
            connStr = `mysql://${connDetails.user}:${connDetails.password}@${connDetails.host}:${connDetails.port}/${connDetails.db}`;
        }
        return connStr;
    }
    
    const handleSave = async () => {
        const connStr = createConnStr();
        const newConnection: Connection = {
            id: connDetails.name.toLowerCase().replace(/\s+/g, '-'),
            name: connDetails.name,
            format: connDetails.type,
            connStr: connStr,
            status: testSucceeded ? 'valid' : 'invalid' 
        };
        try {
            await apiClient.createConnection(newConnection);
            alert("Connection saved successfully!");
        } catch (error) {
            console.error("Failed to save connection:", error);
            alert("Failed to save connection. Please try again.");
        }
        onBack();
    };

    return (
         <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl">
                <CardHeader title="Create New Connection" />
                <div className="p-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Connection Name</label><Input value={connDetails.name} onChange={e => setConnDetails({...connDetails, name: e.target.value})} placeholder="e.g., Production Postgres"/></div>
                             <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Database Type</label><Select value={connDetails.type} onChange={e => setConnDetails({...connDetails, type: e.target.value})} options={[{value: 'MySQL', label: 'MySQL'}, {value: 'PostgreSQL', label: 'PostgreSQL'}]} placeholder="Select type..."/></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Host</label><Input value={connDetails.host} onChange={e => setConnDetails({...connDetails, host: e.target.value})} placeholder="e.g., db.example.com"/></div>
                             <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Port</label><Input value={connDetails.port} onChange={e => setConnDetails({...connDetails, port: e.target.value})} placeholder="e.g., 5432"/></div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Username</label><Input value={connDetails.user} onChange={e => setConnDetails({...connDetails, user: e.target.value})} placeholder="e.g., admin"/></div>
                             <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Password</label><Input type="password" value={connDetails.password} onChange={e => setConnDetails({...connDetails, password: e.target.value})} /></div>
                        </div>
                         <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Database Name</label><Input value={connDetails.db} onChange={e => setConnDetails({...connDetails, db: e.target.value})} placeholder="e.g., production_db"/></div>
                    </div>
                    {testLogs.length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Test Results</h4>
                            <div className="bg-slate-800 text-white font-mono text-xs rounded-lg p-4 h-40 overflow-y-auto">
                                {testLogs.map((log, i) => (
                                    <p key={i} className={`flex gap-2 ${log.includes('ERROR') ? 'text-red-400' : 'text-slate-300'}`}>
                                        <span>{log}</span>
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl flex justify-between items-center">
                    <Button onClick={onBack} variant="secondary">Cancel</Button>
                    <div className="flex gap-3">
                         <Button onClick={handleTest} variant="secondary" disabled={isTesting}>
                            {isTesting ? <Loader size={16} className="animate-spin mr-2"/> : <Wifi size={16} className="mr-2"/>}
                            Test Connection
                        </Button>
                        <Button onClick={() => handleSave()} variant="primary" disabled={!testSucceeded}>Save Connection</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ConnectionWizard;