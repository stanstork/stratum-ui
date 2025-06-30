import { useEffect, useState } from "react";
import { MigrateItem } from "../types/MigrationConfig";
import RemoveButton from "./common/RemoveButton";
import Select from "./common/Select";
import Input from "./common/Input";
import { TableMetadata } from "../types/Metadata";
import Section from "./common/Section";
import { Globe, Settings } from "lucide-react";
import SourceMetadataDiagram from "./SourceMetadataDiagram";


const FULL_MOCK_METADATA: { [key: string]: TableMetadata } = {
    "users": {
        name: "users",
        schema: "public",
        columns: {
            "id": {
                name: "id",
                dataType: "INT",
                isPrimaryKey: true,
                isNullable: false,
                ordinal: 1,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            },
            "name": {
                name: "name",
                dataType: "VARCHAR(100)",
                isNullable: false,
                isPrimaryKey: false,
                ordinal: 2,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            },
            "email": {
                name: "email",
                dataType: "VARCHAR(100)",
                isNullable: false,
                isPrimaryKey: false,
                ordinal: 3,
                isUnique: true,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            },
            "created_at": {
                name: "created_at",
                dataType: "TIMESTAMP",
                isNullable: true,
                isPrimaryKey: false,
                ordinal: 4,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            }
        },
        primaryKeys: ["id"],
        foreignKeys: {},
        referencedTables: [],
        referencingTables: ["orders"],
    },
    "products": {
        name: "products",
        schema: "public",
        columns: {
            "id": {
                name: "id",
                dataType: "INT",
                isPrimaryKey: true,
                isNullable: false,
                ordinal: 1,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            },
            "name": {
                name: "name",
                dataType: "VARCHAR(100)",
                isNullable: false,
                isPrimaryKey: false,
                ordinal: 2,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            },
            "price": {
                name: "price",
                dataType: "DECIMAL(10,2)",
                isNullable: false,
                isPrimaryKey: false,
                ordinal: 3,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            },
            "stock": {
                name: "stock",
                dataType: "INT",
                isNullable: false,
                isPrimaryKey: false,
                ordinal: 4,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            }
        },
        primaryKeys: ["id"],
        foreignKeys: {},
        referencedTables: [],
        referencingTables: ["order_items"],
    },
    "orders": {
        name: "orders",
        schema: "public",
        columns: {
            "id": {
                name: "id",
                dataType: "INT",
                isPrimaryKey: true,
                isNullable: false,
                ordinal: 1,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            },
            "user_id": {
                name: "user_id",
                dataType: "INT",
                isNullable: false,
                isPrimaryKey: false,
                ordinal: 2,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: "users",
                referencedColumn: "id"
            },
            "order_date": {
                name: "order_date",
                dataType: "TIMESTAMP",
                isNullable: true,
                isPrimaryKey: false,
                ordinal: 3,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            },
            "total": {
                name: "total",
                dataType: "DECIMAL(10,2)",
                isNullable: true,
                isPrimaryKey: false,
                ordinal: 4,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            }
        },
        primaryKeys: ["id"],
        foreignKeys: {
            "user_id": {
                column: "user_id",
                referencedTable: "users",
                referencedColumn: "id"
            }
        },
        referencedTables: ["users"],
        referencingTables: ["order_items"],
    },
    "order_items": {
        name: "order_items",
        schema: "public",
        columns: {
            "id": {
                name: "id",
                dataType: "INT",
                isPrimaryKey: true,
                isNullable: false,
                ordinal: 1,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            },
            "order_id": {
                name: "order_id",
                dataType: "INT",
                isNullable: false,
                isPrimaryKey: false,
                ordinal: 2,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: "orders",
                referencedColumn: "id"
            },
            "product_id": {
                name: "product_id",
                dataType: "INT",
                isNullable: false,
                isPrimaryKey: false,
                ordinal: 3,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: "products",
                referencedColumn: "id"
            },
            "quantity": {
                name: "quantity",
                dataType: "INT",
                isNullable: false,
                isPrimaryKey: false,
                ordinal: 4,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            },
            "price": {
                name: "price",
                dataType: "DECIMAL(10,2)",
                isNullable: false,
                isPrimaryKey: false,
                ordinal: 5,
                isUnique: false,
                isAutoIncrement: false,
                referencedTable: null,
                referencedColumn: null
            }
        },
        primaryKeys: ["id"],
        foreignKeys: {
            "order_id": {
                column: "order_id",
                referencedTable: "orders",
                referencedColumn: "id"
            },
            "product_id": {
                column: "product_id",
                referencedTable: "products",
                referencedColumn: "id"
            }
        },
        referencedTables: ["orders", "products"],
        referencingTables: [],
    }
};

type MigrationItemEditorProps = {
    item: MigrateItem
    onItemChange: (item: MigrateItem) => void;
    onRemoveItem: () => void;
    isNew: boolean;
};

const MigrationItemEditor: React.FC<MigrationItemEditorProps> = ({ item, onItemChange, onRemoveItem, isNew }) => {
    const [animationClass, setAnimationClass] = useState('');
    const [itemMetadata, setItemMetadata] = useState<{ [key: string]: TableMetadata } | null>(null);

    useEffect(() => {
        if (isNew) {
            setAnimationClass('item-enter');
            setTimeout(() => setAnimationClass('item-enter item-enter-active'), 50);
        }
    }, [isNew]);

    if (!item?.source || !item.destination) return null;

    const sourceTable = item.source.names[0];

    const handleFieldChange = (
        part: "source" | "destination",
        key: string,
        val: any
    ) => {
        const newItem = { ...item, [part]: { ...item[part], [key]: val } };
        if (part === 'source' && item.source.names[0] !== val[0]) { setItemMetadata(null); }
        onItemChange(newItem);
    };

    const loadItemMetadata = () => {
        const { settings, load } = item;
        const currentEntities = load?.entities || [];
        let relevantTableNames = new Set([sourceTable, ...currentEntities].filter(Boolean));

        if (settings.inferSchema) {
            Array.from(relevantTableNames).forEach(tableName => {
                getRelatedTables(tableName, FULL_MOCK_METADATA, relevantTableNames);
            });
        }

        const filteredMetadata: { [key: string]: TableMetadata } = {};
        relevantTableNames.forEach(tableName => { if (FULL_MOCK_METADATA[tableName]) { filteredMetadata[tableName] = FULL_MOCK_METADATA[tableName]; } });
        setItemMetadata(filteredMetadata);

        const finalEntities = Array.from(relevantTableNames).filter(t => t !== sourceTable);

        onItemChange({ ...item, load: { ...(item.load || {}), entities: finalEntities } });
    };

    const getRelatedTables = (
        tableName: string,
        allMetadata: Record<string, any>,
        visited: Set<string> = new Set()
    ): Set<string> => {
        if (!tableName || visited.has(tableName) || !allMetadata[tableName]) { return visited; }
        visited.add(tableName);
        const table = allMetadata[tableName];
        if (table.foreign_keys) { table.foreign_keys.forEach((fk: any) => { getRelatedTables(fk.referenced_table, allMetadata, visited); }); }
        return visited;
    };

    return (
        <div
            className={`bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 p-4 rounded-lg shadow-md shadow-slate-900/5 ${animationClass}`}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    Migrate:{" "}
                    <span className="text-cyan-600 dark:text-cyan-400">
                        {sourceTable || "New Item"}
                    </span>
                </h3>
                <RemoveButton onClick={onRemoveItem} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                    label="Source Table"
                    value={sourceTable}
                    onChange={e =>
                        handleFieldChange("source", "names", [e.target.value])
                    }
                >
                    <option value="">Select a source table...</option>
                    {Object.keys(FULL_MOCK_METADATA).map(t => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </Select>
                <Input
                    label="Destination Table"
                    value={item.destination.names[0]}
                    onChange={e =>
                        handleFieldChange("destination", "names", [
                            e.target.value,
                        ])
                    }
                />
            </div>
            <div className="my-4">
                <button
                    onClick={loadItemMetadata}
                    disabled={!sourceTable}
                    className="w-full p-2 bg-cyan-500 text-white font-semibold rounded-md shadow hover:bg-cyan-600 transition-all text-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                    Load Source Metadata
                </button>
            </div>
            {itemMetadata && (
                <Section
                    title="Source Schema"
                    icon={<Globe size={18} />}
                    initialOpen={true}
                >
                    <SourceMetadataDiagram metadata={itemMetadata} />
                </Section>
            )}
            {/* <div className="mt-2 space-y-2">
                <Section
                    title="Settings"
                    icon={<Settings size={18} />}
                    initialOpen={false}
                >
                    <SettingsEditor
                        settings={item.settings}
                        onSettingsChange={s =>
                            onItemChange({ ...item, settings: s })
                        }
                    />
                </Section>
                <Section
                    title="Load & Joins"
                    icon={<Link2 size={18} />}
                    initialOpen={false}
                >
                    <LoadEditor
                        load={item.load}
                        onLoadChange={l =>
                            onItemChange({ ...item, load: l })
                        }
                        allTablesInItem={allTablesInItem}
                    />
                </Section>
                <Section
                    title="Column Mappings"
                    icon={<Map size={18} />}
                    initialOpen={false}
                >
                    <MapEditor
                        map={item.map}
                        onMapChange={m =>
                            onItemChange({ ...item, map: m })
                        }
                        availableTables={allTablesInItem}
                    />
                </Section>
                <Section title="Filter" icon={<Filter size={18} />}>
                    <FilterEditor
                        filter={item.filter}
                        onFilterChange={f =>
                            onItemChange({ ...item, filter: f })
                        }
                        availableTables={allTablesInItem}
                    />
                </Section>
            </div> */}
        </div>
    );
}

export default MigrationItemEditor;