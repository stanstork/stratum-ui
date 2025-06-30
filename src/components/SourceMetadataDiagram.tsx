import React, { useRef, useState, useEffect, useMemo } from "react";
import { KeyRound, Link2, Columns } from "lucide-react";
import { TableMetadata } from "../types/Metadata";

interface SourceMetadataDiagramProps {
    metadata: Record<string, TableMetadata>;
}

const SourceMetadataDiagram: React.FC<SourceMetadataDiagramProps> = ({ metadata }) => {
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(500);

    useEffect(() => {
        const observer = new ResizeObserver(entries => { if (entries[0]) { setContainerWidth(entries[0].contentRect.width); } });
        if (containerRef.current) { observer.observe(containerRef.current); }
        return () => { if (containerRef.current) { observer.unobserve(containerRef.current); } };
    }, []);

    const layout = useMemo(() => {
        const positions: {
            [tableName: string]: {
                x: number;
                y: number;
                width: number;
                height: number;
                columns: { [colName: string]: { y: number } };
            };
        } = {};
        const tableOrder = Object.keys(metadata);
        const tableWidth = 250;
        const tableHeight = 32;
        const columnHeight = 20;
        const tableGapX = 40;
        const tableGapY = 40;
        let currentX = 0;
        let currentY = 0;
        let maxRowHeight = 0;

        tableOrder.forEach(tableName => {
            const table = metadata[tableName];
            const columns = Object.values(table.columns);
            const height = tableHeight + columns.length * columnHeight;

            if (currentX > 0 && currentX + tableWidth > containerWidth) {
                currentX = 0;
                currentY += maxRowHeight + tableGapY;
                maxRowHeight = 0;
            }

            positions[tableName] = { x: currentX, y: currentY, width: tableWidth, height, columns: {} };
            columns.forEach((col, i) => { positions[tableName].columns[col.name] = { y: currentY + tableHeight + (i * columnHeight) + (columnHeight / 2) }; });

            currentX += tableWidth + tableGapX;
            if (height > maxRowHeight) maxRowHeight = height;
        });

        return { positions, totalHeight: currentY + maxRowHeight };
    }, [metadata, containerWidth]);

    if (!metadata || Object.keys(metadata).length === 0) { return <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">Load metadata to see source schema.</div>; }

    return (
        <div className="p-2 overflow-x-auto" ref={containerRef}>
            <svg
                width="100%"
                height={layout.totalHeight}
                className="font-sans"
            >
                {Object.values(metadata).map((table) => {
                    const pos = layout.positions[table.name];
                    const columns = Object.values(table.columns);
                    return (
                        <g
                            key={table.name}
                            transform={`translate(${pos.x}, ${pos.y})`}
                        >
                            <rect
                                width={pos.width}
                                height={pos.height}
                                rx="8"
                                ry="8"
                                stroke="#e2e8f0"
                                className="fill-slate-50 dark:fill-slate-800 dark:stroke-slate-700"
                            />
                            <rect
                                width={pos.width}
                                height="32"
                                rx="8"
                                ry="8"
                                className="fill-slate-100 dark:fill-slate-700/50"
                            />
                            <text
                                x="12"
                                y="21"
                                fontWeight="600"
                                className="fill-slate-900 dark:fill-slate-200"
                            >
                                {table.name}
                            </text>
                            {columns.map((col, i) => (
                                <g
                                    key={col.name}
                                    transform={`translate(12, ${32 + i * 20})`}
                                >
                                    <KeyRound
                                        size={12}
                                        className="text-amber-500"
                                        y="4"
                                        visibility={
                                            col.isPrimaryKey
                                                ? "visible"
                                                : "hidden"
                                        }
                                    />
                                    {/* <Link2
                                        size={12}
                                        className="text-sky-500"
                                        y="4"
                                        visibility={
                                            col.is_foreign_key
                                                ? "visible"
                                                : "hidden"
                                        }
                                    /> */}
                                    <Columns
                                        size={12}
                                        className="text-slate-400"
                                        y="4"
                                        visibility={
                                            !col.isPrimaryKey
                                                ? "visible"
                                                : "hidden"
                                        }
                                    />
                                    <text
                                        x="20"
                                        y="15"
                                        fontSize="13"
                                        className="fill-slate-700 dark:fill-slate-300"
                                    >
                                        {col.name}
                                    </text>
                                    <text
                                        x="150"
                                        y="15"
                                        fontSize="12"
                                        className="fill-slate-500 dark:fill-slate-400"
                                    >
                                        {col.dataType}
                                    </text>
                                </g>
                            ))}
                        </g>
                    );
                })}
                {Object.values(metadata).map((table) => {
                    if (!table.foreignKeys) return null;
                    // Handle both array and single object cases
                    const foreignKeys = Array.isArray(table.foreignKeys)
                        ? table.foreignKeys
                        : [table.foreignKeys];
                    return foreignKeys.map((fk, fkIndex) => {
                        const sourceTablePos = layout.positions[table.name];
                        const targetTablePos =
                            layout.positions[fk.referenced_table];
                        if (!sourceTablePos || !targetTablePos) return null;
                        const sourceCol = fk.columns[0];
                        const targetCol = fk.referenced_columns[0];
                        const sourceY = sourceTablePos.columns[sourceCol]?.y;
                        const targetY = targetTablePos.columns[targetCol]?.y;
                        if (
                            sourceY === undefined ||
                            targetY === undefined
                        )
                            return null;

                        const isSelfReferencing =
                            sourceTablePos === targetTablePos;
                        const startX = isSelfReferencing
                            ? sourceTablePos.x
                            : sourceTablePos.x + sourceTablePos.width;
                        const endX = targetTablePos.x;
                        const controlX1 = startX + 60;
                        const controlX2 = endX - 60;

                        return (
                            <path
                                key={`${table.name}-${fk.referenced_table}-${fkIndex}`}
                                d={`M ${startX},${sourceY} C ${controlX1},${sourceY} ${controlX2},${targetY} ${endX},${targetY}`}
                                stroke="#94a3b8"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    });
                })}
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="0"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon
                            points="0 0, 10 3.5, 0 7"
                            fill="#94a3b8"
                        />
                    </marker>
                </defs>
            </svg>
        </div>
    );
}

export default SourceMetadataDiagram;