import { useMemo } from 'react';
import { MigrateItem } from '../../types/MigrationConfig';
import { TableMetadata } from '../../types/Metadata';

interface AllAvailableTablesProviderProps {
    migrateItem: MigrateItem | null;
    metadata: Record<string, TableMetadata> | null;
    children: (tables: TableMetadata[]) => React.ReactNode;
}

const AllAvailableTablesProvider = ({
    migrateItem,
    metadata,
    children,
}: AllAvailableTablesProviderProps) => {
    const allAvailableTables = useMemo<TableMetadata[]>(() => {
        // Return an empty array if essential data is missing.
        if (!migrateItem || !metadata) {
            return [];
        }

        const resultMap = new Map<string, TableMetadata>();

        // Get the primary source table.
        const sourceTableName = migrateItem.source.names[0];
        if (sourceTableName && metadata[sourceTableName]) {
            resultMap.set(sourceTableName, metadata[sourceTableName]);
        }

        // Get all tables from the joins.
        if (migrateItem.load?.entities) {
            for (const joinedTableName of migrateItem.load.entities) {
                if (joinedTableName && metadata[joinedTableName]) {
                    resultMap.set(joinedTableName, metadata[joinedTableName]);
                }
            }
        }

        // Return a unique list of table metadata objects.
        return Array.from(resultMap.values());
    }, [migrateItem, metadata]); // Dependencies are now the actual props.

    // Call the children function with the calculated list of tables.
    return <>{children(allAvailableTables)}</>;
};

export default AllAvailableTablesProvider;