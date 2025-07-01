import React, { useRef, useState, useEffect, useMemo } from "react";
import { KeyRound, Columns } from "lucide-react";
import { ForeignKeyMetadata, TableMetadata } from "../types/Metadata";

interface SourceMetadataDiagramProps {
    metadata: Record<string, TableMetadata>;
}

const SourceMetadataDiagram: React.FC<SourceMetadataDiagramProps> = ({ metadata }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(500);

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                setContainerWidth(entries[0].contentRect.width);
            }
        });
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, []);

    const layout = useMemo(() => {
        type Pos = {
            x: number;
            y: number;
            width: number;
            height: number;
            columns: Record<string, { y: number }>;
        };
        const positions: Record<string, Pos> = {};
        const tableOrder = Object.keys(metadata);
        const tableWidth = 250;
        const tableHeaderHeight = 32;
        const columnHeight = 20;
        const gapX = 40;
        const gapY = 40;

        let currentX = 0;
        let currentY = 0;
        let maxRowH = 0;

        tableOrder.forEach(name => {
            const table = metadata[name];
            const cols = Object.values(table.columns);
            const h = tableHeaderHeight + cols.length * columnHeight;

            if (currentX > 0 && currentX + tableWidth > containerWidth) {
                currentX = 0;
                currentY += maxRowH + gapY;
                maxRowH = 0;
            }

            positions[name] = {
                x: currentX,
                y: currentY,
                width: tableWidth,
                height: h,
                columns: {}
            };

            cols.forEach((col, i) => {
                positions[name].columns[col.name] = {
                    y: currentY + tableHeaderHeight + i * columnHeight + columnHeight / 2,
                };
            });

            currentX += tableWidth + gapX;
            maxRowH = Math.max(maxRowH, h);
        });

        return { positions, totalHeight: currentY + maxRowH };
    }, [metadata, containerWidth]);

    if (!metadata || Object.keys(metadata).length === 0) {
        return (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Load metadata to see source schema.
            </div>
        );
    }

    return (
        <div className="p-2 overflow-x-auto" ref={containerRef}>
            <svg width="100%" height={layout.totalHeight} className="font-sans">
                {/* Tables */}
                {Object.values(metadata).map(table => {
                    const pos = layout.positions[table.name];
                    const cols = Object.values(table.columns);
                    return (
                        <g key={table.name} transform={`translate(${pos.x}, ${pos.y})`}>
                            <rect
                                width={pos.width}
                                height={pos.height}
                                rx={8}
                                ry={8}
                                stroke="#e2e8f0"
                                className="fill-slate-50 dark:fill-slate-800 dark:stroke-slate-700"
                            />
                            <rect
                                width={pos.width}
                                height={32}
                                rx={8}
                                ry={8}
                                className="fill-slate-100 dark:fill-slate-700/50"
                            />
                            <text x={12} y={21} fontWeight="600" className="fill-slate-900 dark:fill-slate-200">
                                {table.name}
                            </text>
                            {cols.map((col, i) => (
                                <g key={col.name} transform={`translate(12, ${32 + i * 20})`}>
                                    <KeyRound
                                        size={12}
                                        className="text-amber-500"
                                        y={4}
                                        visibility={col.isPrimaryKey ? "visible" : "hidden"}
                                    />
                                    <Columns
                                        size={12}
                                        className="text-slate-400"
                                        y={4}
                                        visibility={!col.isPrimaryKey ? "visible" : "hidden"}
                                    />
                                    <text x={20} y={15} fontSize={13} className="fill-slate-700 dark:fill-slate-300">
                                        {col.name}
                                    </text>
                                    <text x={150} y={15} fontSize={12} className="fill-slate-500 dark:fill-slate-400">
                                        {col.dataType}
                                    </text>
                                </g>
                            ))}
                        </g>
                    );
                })}

                {/* Foreign-key arrows */}
                {Object.entries(metadata).flatMap(([srcName, table]) => {
                    // Normalize foreignKeys to always be ForeignKeyMetadata[]
                    let fks: ForeignKeyMetadata[] = [];
                    if (Array.isArray(table.foreignKeys)) {
                        // Could be ForeignKeyMetadata[] or Record<string, ForeignKeyMetadata>[]
                        if (table.foreignKeys.length > 0 && typeof table.foreignKeys[0] === "object" && !("column" in table.foreignKeys[0])) {
                            // Array of Record<string, ForeignKeyMetadata>
                            fks = table.foreignKeys.flatMap((fkObj: any) => Object.values(fkObj));
                        } else {
                            // Array of ForeignKeyMetadata
                            fks = table.foreignKeys as ForeignKeyMetadata[];
                        }
                    } else if (table.foreignKeys && typeof table.foreignKeys === "object") {
                        if ("column" in table.foreignKeys) {
                            // Single ForeignKeyMetadata object or Record<string, ForeignKeyMetadata>
                            fks = Object.values(table.foreignKeys as Record<string, ForeignKeyMetadata>);
                        } else {
                            // Record<string, ForeignKeyMetadata>
                            fks = Object.values(table.foreignKeys as Record<string, ForeignKeyMetadata>);
                        }
                    }

                    return fks.map((fk, idx) => {
                        const srcPos = layout.positions[srcName];
                        const tgtPos = layout.positions[fk.referencedTable];
                        if (!srcPos || !tgtPos) return null;

                        const y1 = srcPos.columns[fk.column]?.y;
                        const y2 = tgtPos.columns[fk.referencedColumn]?.y;
                        if (y1 == null || y2 == null) return null;

                        const startX = srcPos.x + srcPos.width;
                        const endX = tgtPos.x;
                        const cx1 = startX + 60;
                        const cx2 = endX - 60;

                        return (
                            <path
                                key={`${srcName}-${fk.referencedTable}-${idx}`}
                                d={`M ${startX},${y1} C ${cx1},${y1} ${cx2},${y2} ${endX},${y2}`}
                                stroke="#94a3b8"
                                strokeWidth={2}
                                fill="none"
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    });
                })}

                <defs>
                    <marker id="arrowhead" markerWidth={10} markerHeight={7} refX={0} refY={3.5} orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                </defs>
            </svg>
        </div>
    );
};

export default SourceMetadataDiagram;
