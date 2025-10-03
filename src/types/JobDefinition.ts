import { Connection, ConnectionDTO, mapConnection } from "./Connection";
import { getConnectionInfo, getMigrationItem, MigrateItemDTO, MigrationConfig } from "./MigrationConfig";

/**
 * Raw API response shape for a Job Definition
 */
export interface JobDefinitionDTO {
    id: string;
    tenant_id: string;
    name: string;
    description: string;
    ast: unknown;                       // Parsed AST JSON
    source_connection: ConnectionDTO;         // Connection object
    destination_connection: ConnectionDTO;    // Connection object
    created_at: string;                 // ISO timestamp
    updated_at: string;                 // ISO timestamp
}

export interface JobDefinitionCreateDTO {
    name: string;
    description: string;
    ast: unknown;                       // Parsed AST JSON
    source_connection_id: string;       // ID of the source connection
    destination_connection_id: string;  // ID of the destination connection
}

/**
 * Frontend-friendly model (camelCase keys)
 */
export interface JobDefinition {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    ast: string;                       // Parsed AST JSON
    sourceConnection: Connection;         // Connection object
    destinationConnection: Connection;    // Connection object
    createdAt: Date;                 // ISO timestamp
    updatedAt: Date;                 // ISO timestamp
}

/**
 * Helper to map DTO to frontend model
 */
export function mapJobDefinition(dto: JobDefinitionDTO): JobDefinition {
    return {
        id: dto.id,
        tenantId: dto.tenant_id,
        name: dto.name,
        description: dto.description,
        ast: JSON.stringify(dto.ast),  // Ensure AST is a string
        sourceConnection: mapConnection(dto.source_connection),
        destinationConnection: mapConnection(dto.destination_connection),
        createdAt: new Date(dto.created_at),
        updatedAt: new Date(dto.updated_at)
    };
}

export function getMigrationConfig(dto: JobDefinition): MigrationConfig {
    const migrationItem = JSON.parse(dto.ast as string)['migration']['migrate_items'][0] as MigrateItemDTO;
    return {
        name: dto.name,
        description: dto.description,
        connections: {
            source: getConnectionInfo(dto.sourceConnection),
            dest: getConnectionInfo(dto.destinationConnection)
        },
        migration: {
            settings: {
                batchSize: migrationItem.settings.batch_size,
                csvHeader: migrationItem.settings.csv_header,
                copyColumns: migrationItem.settings.copy_columns,
                inferSchema: migrationItem.settings.infer_schema,
                csvDelimiter: migrationItem.settings.csv_delimiter,
                csvIdColumn: migrationItem.settings.csv_id_column,
                cascadeSchema: migrationItem.settings.cascade_schema,
                ignoreConstraints: migrationItem.settings.ignore_constraints,
                createMissingTables: migrationItem.settings.create_missing_tables,
                createMissingColumns: migrationItem.settings.create_missing_columns
            },
            migrateItems: [getMigrationItem(migrationItem)],
        },
        creation_date: dto.createdAt.toISOString(),
        activeItemIndex: 0 // Default to first item
    };
}