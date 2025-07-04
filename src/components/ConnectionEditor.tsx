import React, { ChangeEvent, useState, useEffect } from "react";
import Input from "./common/Input";
import Select from "./common/Select";
import { Connection, createConnectionString } from "../types/Connection";

export interface ConnectionPair {
    source: Connection;
    dest: Connection;
}

type ConnectionEditorProps = {
    connections: Connection[];
    onConnectionsChange: (connections: ConnectionPair) => void;
};

const ConnectionEditor: React.FC<ConnectionEditorProps> = ({
    connections,
    onConnectionsChange,
}) => {
    // Determine default types based on first two connections
    const initialSourceType =
        connections[0]?.dataFormat === "CsvFile" ? "CsvFile" : "Database";
    const initialDestType =
        connections[1]?.dataFormat === "CsvFile" ? "CsvFile" : "Database";

    const [sourceType, setSourceType] = useState<"Database" | "CsvFile">(
        initialSourceType
    );
    const [destType, setDestType] = useState<"Database" | "CsvFile">(
        initialDestType
    );

    // Keep track of the actual pair
    const [connectionPair, setConnectionPair] = useState<ConnectionPair>({
        source: connections[0],
        dest: connections[1] || connections[0],
    });

    // Notify parent whenever the pair changes
    useEffect(() => {
        onConnectionsChange(connectionPair);
    }, [connectionPair, onConnectionsChange]);

    // Helper to filter by type
    const filterConnections = (type: "Database" | "CsvFile") =>
        type === "CsvFile"
            ? connections.filter((c) => c.dataFormat === "CsvFile")
            : connections.filter((c) =>
                ["mysql", "postgres", "pg"].includes(c.dataFormat.toLowerCase())
            );

    const handleTypeChange = (
        side: "source" | "dest",
        newType: "Database" | "CsvFile"
    ) => {
        // update the type
        if (side === "source") setSourceType(newType);
        else setDestType(newType);

        // pick the first of that type
        const list = filterConnections(newType);
        const pick = list[0] || connections[0];
        setConnectionPair((prev) => ({ ...prev, [side]: pick }));
    };

    const handleConnChange = (side: "source" | "dest", id: string) => {
        const sel = connections.find((c) => c.id === id);
        if (sel) setConnectionPair((prev) => ({ ...prev, [side]: sel }))
    };

    const sourceOptions = filterConnections(sourceType);
    const destOptions = filterConnections(destType);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
            {/* Source */}
            <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">
                    Source
                </h4>
                <Select
                    label="Source Type"
                    value={sourceType}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        handleTypeChange("source", e.target.value as any)
                    }
                >
                    <option value="Database">Database</option>
                    <option value="CsvFile">File</option>
                </Select>
                <Select
                    label="Source Connection"
                    value={connectionPair.source.id}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        handleConnChange("source", e.target.value)
                    }
                >
                    {sourceOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </Select>
                <Input
                    label="Connection String"
                    value={createConnectionString(connectionPair.source)}
                    readOnly
                />
            </div>

            {/* Destination */}
            <div className="space-y-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">
                    Destination
                </h4>
                <Select
                    label="Destination Type"
                    value={destType}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        handleTypeChange("dest", e.target.value as any)
                    }
                >
                    <option value="Database">Database</option>
                </Select>
                <Select
                    label="Destination Connection"
                    value={connectionPair.dest.id}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        handleConnChange("dest", e.target.value)
                    }
                >
                    {destOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </Select>
                <Input
                    label="Connection String"
                    value={createConnectionString(connectionPair.dest)}
                    readOnly
                />
            </div>
        </div>
    );
};

export default ConnectionEditor;
