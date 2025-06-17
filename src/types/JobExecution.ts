/**
 * Raw API response shape for a Job Execution
 */
export interface JobExecutionDTO {
    id: string;
    job_definition_id: string;
    status: string;
    created_at: string;                // ISO timestamp
    updated_at: string;                // ISO timestamp
    run_started_at: string | null;     // ISO timestamp or null
    run_completed_at: string | null;   // ISO timestamp or null
    error_message: string | null;
    logs: string | null;
}


/**
 * Frontend-friendly model (camelCase keys)
 */
export interface JobExecution {
    id: string;
    jobDefinitionId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    runStartedAt?: Date;
    runCompletedAt?: Date;
    errorMessage?: string;
    logs?: string;
}

/**
 * Helper to map API DTO to frontend model
 */
export function mapJobExecution(dto: JobExecutionDTO): JobExecution {
    return {
        id: dto.id,
        jobDefinitionId: dto.job_definition_id,
        status: dto.status,
        createdAt: new Date(dto.created_at),
        updatedAt: new Date(dto.updated_at),
        runStartedAt: dto.run_started_at ? new Date(dto.run_started_at) : undefined,
        runCompletedAt: dto.run_completed_at ? new Date(dto.run_completed_at) : undefined,
        errorMessage: dto.error_message ?? undefined,
        logs: dto.logs ?? undefined,
    };
}
