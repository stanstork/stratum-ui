import { useEffect, useState } from "react";
import { TableMetadata } from "../types/Metadata";
import ReactFlow, { Controls, Background, Node, Edge, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';

const nodeTypes = { custom: CustomNode };

const getNodeId = (table: TableMetadata) => `${table.schema ?? 'public'}.${table.name}`;

// An options object to hide the attribution logo
const proOptions = { hideAttribution: true };

const SchemaDiagram = ({ table, metadata }: { table: TableMetadata, metadata: Record<string, TableMetadata> }) => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    useEffect(() => {
        if (!table || !metadata) return;

        const initialNodes: Node[] = [];
        const initialEdges: Edge[] = [];
        const tablesToRender = new Map<string, TableMetadata>();

        const mainNodeId = getNodeId(table);
        tablesToRender.set(mainNodeId, table);

        if (table.referencedTables) {
            Object.values(table.referencedTables).forEach(t => tablesToRender.set(getNodeId(t), metadata[t.name]));
        }
        if (table.referencingTables) {
            Object.values(table.referencingTables).forEach(t => tablesToRender.set(getNodeId(t), metadata[t.name]));
        }

        const mainTableX = 400;
        const mainTableY = 250;
        let referencedCount = 0;
        let referencingCount = 0;

        tablesToRender.forEach((tableMeta, nodeId) => {
            if (!tableMeta) return;

            let position;
            if (nodeId === mainNodeId) {
                position = { x: mainTableX, y: mainTableY };
            } else if (table.foreignKeys && Object.values(table.foreignKeys).some(fk => fk.referencedTable === tableMeta.name)) {
                position = { x: mainTableX + 400, y: mainTableY - 150 + (referencedCount++ * 350) };
            } else {
                position = { x: mainTableX - 400, y: mainTableY - 150 + (referencingCount++ * 350) };
            }

            initialNodes.push({
                id: nodeId,
                type: 'custom',
                data: tableMeta,
                position,
                draggable: true,
            });
        });

        tablesToRender.forEach((tableMeta, sourceNodeId) => {
            if (!tableMeta || !tableMeta.foreignKeys) return;

            Object.values(tableMeta.foreignKeys).forEach(fk => {
                const targetTable = metadata[fk.referencedTable];
                if (!targetTable) return;

                const targetNodeId = getNodeId(targetTable);

                if (tablesToRender.has(targetNodeId)) {
                    initialEdges.push({
                        id: `e-${sourceNodeId}.${fk.column}-to-${targetNodeId}.${fk.referencedColumn}`,
                        source: sourceNodeId,
                        sourceHandle: fk.column,
                        target: targetNodeId,
                        targetHandle: fk.referencedColumn,
                        animated: true,
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
                        style: { stroke: '#6366f1', strokeWidth: 2 },
                    });
                }
            });
        });

        setNodes(initialNodes);
        setEdges(initialEdges);

    }, [table, metadata]);

    return (
        <div style={{ height: '700px' }} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                proOptions={proOptions} // Hide the logo
            >
                <Controls className="react-flow-controls" />
                {/* The <MiniMap /> component has been removed */}
                <Background gap={12} size={1} />
            </ReactFlow>
        </div>
    );
};

export default SchemaDiagram;