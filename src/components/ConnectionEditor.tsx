import React, { ChangeEvent, useState, useEffect } from "react";
import Input from "./common/Input";
import Select from "./common/Select";
import { Connection } from "../types/Connection";

export interface ConnectionPair {
    source: Connection;
    dest: Connection;
}

type ConnectionEditorProps = {
    onConnectionsChange: (connections: ConnectionPair) => void;
};

const INITIAL_MOCK_CONNECTIONS: Connection[] = [
    { id: 'prod-mysql', name: 'Production MySQL', format: 'MySql', connStr: 'mysql://user:prod_pass@prod.db/sales', status: 'untested' },
    { id: 'dev-pg', name: 'Development Postgres', format: 'Postgres', connStr: 'postgres://user:dev_pass@localhost:5432/devdb', status: 'untested' },
    { id: 'data-warehouse', name: 'Data Warehouse (Postgres)', format: 'Postgres', connStr: 'postgres://reporter:wh_pass@analytics.db/warehouse', status: 'untested' },
    { id: 'staging-sql', name: 'Staging SQL Server', format: 'SqlServer', connStr: 'sqlserver://user:stage_pass@staging.server/stagedb', status: 'untested' }
];

const ConnectionEditor: React.FC<ConnectionEditorProps> = ({ onConnectionsChange }) => {
    const [availableConnections] = useState<Connection[]>(INITIAL_MOCK_CONNECTIONS);
    const [connectionPair, setConnectionPair] = useState<ConnectionPair>({
        source: availableConnections[0],
        dest: availableConnections[1] || availableConnections[0],
    });

    // Notify parent on change
    useEffect(() => {
        onConnectionsChange(connectionPair);
    }, [connectionPair, onConnectionsChange]);

    const handleTypeChange = (type: 'source' | 'dest', newType: string) => {
        if (newType === 'CsvFile') {
            setConnectionPair(prev => ({
                ...prev,
                [type]: { id: '', name: '', format: 'CsvFile', conn_str: '' }
            }));
        } else {
            const fallback = availableConnections[0];
            setConnectionPair(prev => ({ ...prev, [type]: fallback }));
        }
    };

    const handleDbConnChange = (type: 'source' | 'dest', connId: string) => {
        const selected = availableConnections.find(c => c.id === connId);
        if (!selected) return;
        setConnectionPair(prev => ({ ...prev, [type]: selected }));
    };

    const sourceType = connectionPair.source.format === 'CsvFile' ? 'CsvFile' : 'Database';
    const destType = connectionPair.dest.format === 'CsvFile' ? 'CsvFile' : 'Database';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
            {/* Source */}
            <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">Source</h4>
                <Select label="Source Type" value={sourceType} onChange={(e: ChangeEvent<HTMLSelectElement>) => handleTypeChange('source', e.target.value)}>
                    <option value="Database">Database</option>
                    <option value="CsvFile">CSV File</option>
                </Select>
                <Select label="Source Connection" value={connectionPair.source.id} onChange={(e: ChangeEvent<HTMLSelectElement>) => handleDbConnChange('source', e.target.value)}>
                    <option value="">Select a connection...</option>
                    {availableConnections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Input label="Connection String" value={connectionPair.source.connStr} readOnly />
            </div>

            {/* Destination */}
            <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">Destination</h4>
                <Select label="Destination Type" value={destType} onChange={(e: ChangeEvent<HTMLSelectElement>) => handleTypeChange('dest', e.target.value)}>
                    <option value="Database">Database</option>
                    <option value="CsvFile">CSV File</option>
                </Select>
                <Select label="Destination Connection" value={connectionPair.dest.id} onChange={(e: ChangeEvent<HTMLSelectElement>) => handleDbConnChange('dest', e.target.value)}>
                    <option value="">Select a connection...</option>
                    {availableConnections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Input label="Connection String" value={connectionPair.dest.connStr} readOnly />
            </div>
        </div>
    );
}

export default ConnectionEditor;
