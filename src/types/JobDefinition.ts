/**
 * Raw API response shape for a Job Definition
 */
export interface JobDefinitionDTO {
    id: string;
    tenant_id: string;
    name: string;
    ast: unknown;                       // Parsed AST JSON
    source_connection: unknown;        // Connection config (shape may vary)
    destination_connection: unknown;   // Connection config (shape may vary)
    engine_settings: unknown;          // Engine settings (shape may vary)
    created_at: string;                // ISO timestamp
    updated_at: string;                // ISO timestamp
}

/**
 * Frontend-friendly model (camelCase keys)
 */
export interface JobDefinition {
    id: string;
    tenantId: string;
    name: string;
    ast: unknown;
    sourceConnection: unknown;
    destinationConnection: unknown;
    engineSettings: unknown;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Helper to map DTO to frontend model
 */
export function mapJobDefinition(dto: JobDefinitionDTO): JobDefinition {
    return {
        id: dto.id,
        tenantId: dto.tenant_id,
        name: dto.name,
        ast: dto.ast,
        sourceConnection: dto.source_connection,
        destinationConnection: dto.destination_connection,
        engineSettings: dto.engine_settings,
        createdAt: new Date(dto.created_at),
        updatedAt: new Date(dto.updated_at),
    };
}