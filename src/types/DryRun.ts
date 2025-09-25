export interface DryRunReportEntityDTO {
    run_id: string;
    engine_version: string;
    config_hash: string;
    summary: {
        status: "success" | "failure" | "warning";
        timestamp: string;
        source: {
            database: {
                dialect: string;
            };
        };
        destination: {
            database: {
                dialect: string;
            };
        };
        records_sampled: number;
    };
    mapping: {
        totals: {
            entities: number;
            mapped_fields: number;
            computed_fields: number;
            lookup_count: number;
        };
        entities: Array<{
            source_entity: string;
            dest_entity: string;
            copy_policy: string;
            mapped_fields: number;
            created_fields: number;
            renames: Array<{ from: string; to: string }>;
            computed: Array<{ name: string; expression_preview: string }>;
        }>;
        lookups: Array<{
            source_entity: string;
            entity: string;
            key: string;
            target: string | null;
        }>;
        mapping_hash: string;
    };
    schema: {
        actions: Array<{
            code: string;
            message: string;
            entity: string;
        }>;
    };
    schema_validation: {
        findings: Array<{
            code: string;
            message: string;
            severity: "error" | "warning" | "info";
            kind: string;
        }>;
    };
    generated_sql: {
        statements: Array<{
            dialect: string;
            kind: "schema" | "data";
            sql: string;
            params?: Array<any>;
        }>;
    };
    transform: {
        ok: number;
        failed: number;
        sample: Array<{
            input: {
                entity: string;
                field_values: Array<{
                    name: string;
                    value: any;
                    data_type: string;
                }>;
            };
            output: {
                entity: string;
                field_values: Array<{
                    name: string;
                    value: any;
                    data_type: string;
                }>;
            };
        }>;
    };
}

export interface DryRunReportEntity {
    runId: string;
    engineVersion: string;
    configHash: string;
    summary: {
        status: "success" | "failure" | "warning";
        timestamp: string;
        source: {
            database: {
                dialect: string;
            };
        };
        destination: {
            database: {
                dialect: string;
            };
        };
        recordsSampled: number;
    };
    mapping: {
        totals: {
            entities: number;
            mappedFields: number;
            computedFields: number;
            lookupCount: number;
        };
        entities: Array<{
            sourceEntity: string;
            destEntity: string;
            copyPolicy: string;
            mappedFields: number;
            createdFields: number;
            renames: Array<{ from: string; to: string }>;
            computed: Array<{ name: string; expressionPreview: string }>;
        }>;
        lookups: Array<{
            sourceEntity: string;
            entity: string;
            key: string;
            target: string | null;
        }>;
        mappingHash: string;
    };
    schema: {
        actions: Array<{
            code: string;
            message: string;
            entity: string;
        }>;
    };
    schemaValidation: {
        findings: Array<{
            code: string;
            message: string;
            severity: "error" | "warning" | "info";
            kind: string;
        }>;
    };
    generatedSql: {
        statements: Array<{
            dialect: string;
            kind: "schema" | "data";
            sql: string;
            params?: Array<any>;
        }>;
    };
    transform: {
        ok: number;
        failed: number;
        sample: Array<{
            input: {
                entity: string;
                fieldValues: Array<{
                    name: string;
                    value: any;
                    dataType: string;
                }>;
            };
            output: {
                entity: string;
                fieldValues: Array<{
                    name: string;
                    value: any;
                    dataType: string;
                }>;
            };
        }>;
    };
}

export function mapDryRunReport(dto: Record<string, DryRunReportEntityDTO>): Record<string, DryRunReportEntity> {
    const result: Record<string, DryRunReportEntity> = {};
    for (const [key, entity] of Object.entries(dto)) {
        result[key] = {
            runId: entity.run_id,
            engineVersion: entity.engine_version,
            configHash: entity.config_hash,
            summary: {
                status: entity.summary.status,
                timestamp: entity.summary.timestamp,
                source: {
                    database: {
                        dialect: entity.summary.source.database.dialect,
                    },
                },
                destination: {
                    database: {
                        dialect: entity.summary.destination.database.dialect,
                    },
                },
                recordsSampled: entity.summary.records_sampled,
            },
            mapping: {
                totals: {
                    entities: entity.mapping.totals.entities,
                    mappedFields: entity.mapping.totals.mapped_fields,
                    computedFields: entity.mapping.totals.computed_fields,
                    lookupCount: entity.mapping.totals.lookup_count,
                },
                entities: entity.mapping.entities.map(e => ({
                    sourceEntity: e.source_entity,
                    destEntity: e.dest_entity,
                    copyPolicy: e.copy_policy,
                    mappedFields: e.mapped_fields,
                    createdFields: e.created_fields,
                    renames: (e.renames ?? []).map(r => ({ from: r.from, to: r.to })),
                    computed: (e.computed ?? []).map(c => ({ name: c.name, expressionPreview: c.expression_preview })),
                })),
                lookups: (entity.mapping.lookups ?? []).map(l => ({
                    sourceEntity: l.source_entity,
                    entity: l.entity,
                    key: l.key,
                    target: l.target,
                })),
                mappingHash: entity.mapping.mapping_hash,
            },
            schema: {
                actions: (entity.schema.actions ?? []).map(a => ({
                    code: a.code,
                    message: a.message,
                    entity: a.entity,
                })),
            },
            schemaValidation: {
                findings: (entity.schema_validation.findings ?? []).map(f => ({
                    code: f.code,
                    message: f.message,
                    severity: f.severity,
                    kind: f.kind,
                })),
            },
            generatedSql: {
                statements: (entity.generated_sql.statements ?? []).map(s => ({
                    dialect: s.dialect,
                    kind: s.kind,
                    sql: s.sql,
                    params: s.params,
                })),
            },
            transform: {
                ok: entity.transform.ok,
                failed: entity.transform.failed,
                sample: (entity.transform.sample ?? []).map(s => ({
                    input: {
                        entity: s.input.entity,
                        fieldValues: s.input.field_values.map(fv => ({
                            name: fv.name,
                            value: fv.value,
                            dataType: fv.data_type,
                        })),
                    },
                    output: {
                        entity: s.output.entity,
                        fieldValues: (s.output.field_values ?? []).map(fv => ({
                            name: fv.name,
                            value: fv.value,
                            dataType: fv.data_type,
                        })),
                    },
                })),
            },
        };
    }
    return result;
}

export type DryRunReport = Record<string, DryRunReportEntity>;