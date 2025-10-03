import { Database, FileText, Plus, Trash2 } from "lucide-react";
import { emptyMigrationItem, MigrateItem, MigrationConfig } from "../../types/MigrationConfig";
import { Button } from "../common/v2/Button";
import { Card, CardContent } from "../common/v2/Card";
import { Badge } from "../common/v2/Badge";

interface Step3_MigrationItemsProps {
    config: MigrationConfig;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
}

const Step3_MigrationItems: React.FC<Step3_MigrationItemsProps> = ({
    config,
    setConfig
}) => {
    const handleAddItem = () => {
        const newItem = emptyMigrationItem();
        setConfig(prev => ({
            ...prev,
            migration: {
                ...prev.migration,
                migrateItems: [...prev.migration.migrateItems, newItem],
            },
            activeItemIndex: prev.migration.migrateItems.length, // Switch to the new item
        }));
    };

    const handleDeleteItem = (index: number) => {
        if (config.migration.migrateItems.length === 1) return; // Don't delete the last item

        setConfig(prev => {
            const newItems = prev.migration.migrateItems.filter((_, i) => i !== index);
            const newActiveIndex = prev.activeItemIndex >= newItems.length
                ? newItems.length - 1
                : prev.activeItemIndex > index
                    ? prev.activeItemIndex - 1
                    : prev.activeItemIndex;
            return {
                ...prev,
                migration: {
                    ...prev.migration,
                    migrateItems: newItems,
                },
                activeItemIndex: newActiveIndex,
            };
        });
    };

    const handleSelectItem = (index: number) => {
        setConfig(prev => ({
            ...prev,
            activeItemIndex: index,
        }));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Migration Items
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage multiple items within this migration
                    </p>
                </div>
                <Button
                    onClick={handleAddItem}
                    variant="outline"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                </Button>
            </div>
            <div className="space-y-3">
                {config.migration.migrateItems.map((item, index) => (
                    <Card
                        className={`cursor-pointer transition-all ${index === config.activeItemIndex
                            ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                            : 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        onClick={() => handleSelectItem(index)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                                        {item.destination.kind === 'file' ? (
                                            <FileText className="w-5 h-5 text-white" />
                                        ) : (
                                            <Database className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                {item.destination.names[0] || `Item ${index + 1}`}
                                            </h4>
                                            {index === config.activeItemIndex && (
                                                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    Active
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
                                            {item.source.kind && (
                                                <span>{item.source.kind.toUpperCase()}</span>
                                            )}
                                            {item.source.names.length > 0 && (
                                                <span>Source: {item.source.names.join(', ')}</span>
                                            )}
                                            <span>{item.map.mappings.length} mappings</span>
                                            <span>{item.load.entities.length} joins</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteItem(index)}
                                        disabled={config.migration.migrateItems.length === 1}
                                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default Step3_MigrationItems;