import { Plus } from "lucide-react";
import Button from "../../components/common/v2/Button";
import Card from "../../components/common/v2/Card";
import CardHeader from "../../components/common/v2/CardHeader";
import { useEffect, useState } from "react";
import { Connection } from "../../types/Connection";
import apiClient from "../../services/apiClient";
import { Spinner } from "../../components/common/Helper";

type ConnectionsPageProps = {
    setView: (view: string) => void;
};

const ConnectionsPage = ({ setView }: ConnectionsPageProps) => {
    const [loading, setLoading] = useState(true);
    const [connections, setConnections] = useState<Connection[]>([]);

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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Connections</h1>
                <Button onClick={() => setView('connections/new')}><Plus size={16} className="mr-2" />Add Connection</Button>
            </div>
            <Card>
                <CardHeader title="All Data Connections" subtitle="Manage your source and destination connections." />
                {connections.length === 0 && (
                    <div className="p-6 text-center text-slate-500">No connections defined. Click "Add Connection" to create one.</div>
                )}
                {connections.length > 0 && (
                    <div className="p-2">
                        <table className="w-full text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase"><tr><th className="p-4">Name</th><th className="p-4">Type</th><th className="p-4">Status</th></tr></thead>
                            <tbody className="text-sm">
                                {connections.map(c => (
                                    <tr key={c.id} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{c.name}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">{c.dataFormat}</td>
                                        <td className="p-4"><span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">{c.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </>
    );
};

export default ConnectionsPage;