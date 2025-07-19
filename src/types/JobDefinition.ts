import { Connection, ConnectionDTO, mapConnection } from "./Connection";

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