import { Database, FileJson, FileText } from "lucide-react";
import Section from "../components/common/Section";
import JobDetailsEditor from "../components/JobDetailsEditor";
import { useNavigate } from "react-router-dom";
import ConnectionEditor from "../components/ConnectionEditor";

const INITIAL_CONFIG = {
    "name": "Untitled Migration Job",
    "description": "",
    "creation_date": "Thursday, June 12, 2025 at 1:11 PM BST",
    "author_location": "United Kingdom",
    "connections": { "source": { "conn_type": "Source", "format": "", "conn_str": "" }, "dest": { "conn_type": "Dest", "format": "", "conn_str": "" } },
    "migration": { "migrate_items": [], "settings": { "batch_size": 1000 } }
};


const DefinitionCanvas = () => {
    const config = INITIAL_CONFIG; // Replace with actual config prop
    const navigate = useNavigate();

    function handleDetailChange(field: string, value: string): void {
        // This function should handle changes to the job details
        // For example, you might want to update the state or send it to an API
        console.log(`Detail changed: ${field} = ${value}`);
    }

    function handleConnectionsChange(connections: any): void {
        // This function should handle changes to the connections object
        // For example, you might want to update the state or send it to an API
        console.log("Connections updated:", connections);
    }

    return (
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
                <div className="space-y-8 xl:col-span-5">
                    <Section title="Job Details" icon={
                        <FileText size={20} />
                    }>
                        <JobDetailsEditor name={config.name} description={config.description} creation_date={config.creation_date} onDetailChange={handleDetailChange} />
                    </Section>
                    <Section title="Connections" icon={
                        <Database size={20} />
                    } topRightContent={<button onClick={() => navigate('connections')} className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">Manage</button>}>
                        <ConnectionEditor onConnectionsChange={handleConnectionsChange} />
                    </Section>
                </div>
                <div className="sticky top-24 h-fit space-y-8 xl:col-span-5">
                    <Section title="Live Configuration JSON" icon={
                        <FileJson size={20} />
                    }>
                        <pre className="font-mono bg-slate-800 text-slate-200 text-xs p-4 rounded-lg overflow-x-auto max-h-[75vh]"><code>{JSON.stringify(config, null, 2)}</code></pre>
                    </Section>
                </div>
            </div>
        </main>

    );
}

export default DefinitionCanvas;