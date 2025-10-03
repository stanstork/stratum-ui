import { Database } from "lucide-react";
import { MigrationConfig } from "../types/MigrationConfig";
import Select from "./common/Select";

interface ItemScopedHeaderProps {
    config: MigrationConfig;
    setConfig: React.Dispatch<React.SetStateAction<MigrationConfig>>;
}

export const ItemScopedHeader: React.FC<ItemScopedHeaderProps> = ({
    config,
    setConfig
}) => {
    // Safely access the items, providing an empty array as a fallback
    const migrateItems = config?.migration?.migrateItems || [];

    // If there are no items, don't render the header to avoid errors and an empty UI
    if (migrateItems.length === 0) {
        return null;
    }

    const activeItem = migrateItems[config.activeItemIndex];

    // This check prevents an error if activeItemIndex is somehow out of bounds
    if (!activeItem) {
        return null;
    }

    const activeItemName = activeItem.destination?.names?.[0] || `Item ${config.activeItemIndex + 1}`;

    return (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3 w-full">
                    <Database className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-blue-900 dark:text-blue-100" title={activeItemName}>
                            Editing: {activeItemName}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            Item {config.activeItemIndex + 1} of {migrateItems.length}
                        </p>
                    </div>
                </div>
                <Select
                    value={config.activeItemIndex.toString()}
                    options={migrateItems.map((item, index) => ({
                        label: item.destination?.names?.[0] || `Item ${index + 1}`,
                        value: index.toString()
                    }))}
                    onChange={(e) => {
                        const index = parseInt(e.target.value, 10);
                        if (!isNaN(index)) {
                            setConfig(prev => ({
                                ...prev,
                                activeItemIndex: index,
                            }));
                        }
                    }}
                />
            </div>
        </div>
    );
};