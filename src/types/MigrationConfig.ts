import { Connection, emptyConnection, StatusType } from "./Connection";

// Root config
export interface MigrationConfig {
    name: string;
    description: string;
    creation_date: string; // ISO date string
    migration: Migration;
    connections: ConnectionPairInfo;
}

// Connection pair with basic info
export interface ConnectionPairInfo {
    source: ConnectionInfo;
    dest: ConnectionInfo;
}

// Connection info with minimal details
export interface ConnectionInfo {
    id: string;
    name: string;
    status: StatusType;
    database: string;
    dataFormat: string;
    description: string;
}

// Migration section
export interface Migration {
    settings: MigrationSettings;
    migrateItems: MigrateItem[];
}

export interface MigrationDTO {
    settings: MigrationSettingsDTO;
    migrate_items: MigrateItemDTO[];
}

export interface MigrationSettings {
    batchSize: number;
    csvHeader: boolean;
    copyColumns: string;
    inferSchema: boolean;
    csvDelimiter: string;
    csvIdColumn: string | null;
    cascadeSchema: boolean;
    ignoreConstraints: boolean;
    createMissingTables: boolean;
    createMissingColumns: boolean;
}

export interface MigrationSettingsDTO {
    batch_size: number;
    csv_header: boolean;
    copy_columns: string;
    infer_schema: boolean;
    csv_delimiter: string;
    csv_id_column: string | null;
    cascade_schema: boolean;
    ignore_constraints: boolean;
    create_missing_tables: boolean;
    create_missing_columns: boolean;
}

export interface MigrateItem {
    id: Date; // Unique identifier for the migration item
    map: MapStep;
    load: LoadStep;
    filter: Filter;
    source: DataSource;
    settings: MigrationSettings;
    destination: DataSource;
}

export interface MigrateItemDTO {
    id: string; // ISO date string
    map: MapStep;
    load: LoadStep;
    filter: Filter;
    source: DataSource;
    settings: MigrationSettingsDTO;
    destination: DataSource;
}

// Map step
export interface MapStep {
    mappings: Mapping[];
}

export interface Mapping {
    source: Expression;
    target: string;
}

// Load step
export interface LoadStep {
    matches: JoinCondition[];
    entities: string[];
}

export interface LoadStepDTO {
    matches: JoinConditionDTO[];
    entities: string[];
}

export interface JoinCondition {
    left: Expression;
    right: Expression;
}

export interface JoinConditionDTO {
    left: Expression;
    right: Expression;
}

// Filter step
export interface Filter {
    expression: Expression | null; // Expression AST for the filter
}

// Data source (for source & destination)
export interface DataSource {
    kind: string;
    names: string[];
}

// Expression AST
export type Expression =
    | LookupExpr
    | LiteralExpr
    | ArithmeticExpr
    | FunctionCallExpr
    | ConditionExpr
    | IdentifierExpr;

// Lookup
export interface LookupExpr {
    Lookup: {
        key: string | null; // Field name or null for entire entity
        field: string | null;
        entity: string;
    };
}

// Literal (integer, float, string, boolean, etc.)
export interface LiteralExpr {
    Literal: {
        Integer?: number;
        Float?: number;
        String?: string;
        Boolean?: boolean;
    };
}

// Arithmetic operations
export interface ArithmeticExpr {
    Arithmetic: {
        left: Expression;
        right: Expression;
        operator: string;
    };
}

// Function calls in mapping steps
export interface FunctionCallExpr {
    FunctionCall: [string, Expression[]];
}

// Conditional expressions (used in filter.matches or filter.expression)
export interface ConditionExpr {
    Condition: {
        op: string;
        left: Expression;
        right: Expression;
    };
}

export interface IdentifierExpr {
    Identifier: string;
}

export function emptyMigrationConfig(): MigrationConfig {
    return {
        name: '',
        description: '',
        creation_date: new Date().toISOString(),
        migration: {
            settings: {
                batchSize: 1000,
                csvHeader: true,
                copyColumns: 'All',
                inferSchema: true,
                csvDelimiter: ',',
                csvIdColumn: null,
                cascadeSchema: true,
                ignoreConstraints: false,
                createMissingTables: true,
                createMissingColumns: true
            },
            migrateItems: [emptyMigrationItem()]
        },
        connections: emptyConnectionPair()
    };
}

export function emptyMigrationItem(): MigrateItem {
    return {
        id: new Date(),
        map: { mappings: [] },
        load: { matches: [], entities: [] },
        filter: { expression: { FunctionCall: ["AND", []] } },
        source: { kind: '', names: [] },
        settings: {
            batchSize: 1000,
            csvHeader: true,
            copyColumns: 'All',
            inferSchema: true,
            csvDelimiter: ',',
            csvIdColumn: null,
            cascadeSchema: true,
            ignoreConstraints: false,
            createMissingTables: true,
            createMissingColumns: true
        },
        destination: { kind: '', names: [] }
    };
}

export function emptyConnectionPair(): ConnectionPairInfo {
    return {
        source: emptyConnectionInfo(),
        dest: emptyConnectionInfo()
    };
}

export function emptyConnectionInfo(): ConnectionInfo {
    return {
        id: '',
        name: '',
        status: 'untested', // Default status
        database: '',
        dataFormat: '',
        description: ''
    };
}

export function getConnectionInfo(connection: Connection): ConnectionInfo {
    return {
        id: connection.id,
        name: connection.name,
        database: connection.dbName,
        status: connection.status,
        dataFormat: connection.dataFormat,
        description: `${connection.dataFormat} - ${connection.host}:${connection.port}`
    };
}

export function getMigrationItemDTO(item: MigrateItem): MigrateItemDTO {
    return {
        id: item.id.toISOString(),
        map: item.map,
        load: getLoadStepDTO(item.load),
        filter: item.filter,
        source: item.source,
        settings: getSettingsDTO(item.settings),
        destination: item.destination
    };
}

export function getMigrationDTO(config: MigrationConfig): MigrationDTO {
    return convertMigrationConfig({
        settings: getSettingsDTO(config.migration.settings),
        migrate_items: config.migration.migrateItems.map(getMigrationItemDTO)
    });
}

export function getSettingsDTO(settings: MigrationSettings): MigrationSettingsDTO {
    return {
        batch_size: settings.batchSize,
        csv_header: settings.csvHeader,
        copy_columns: settings.copyColumns,
        infer_schema: settings.inferSchema,
        csv_delimiter: settings.csvDelimiter,
        csv_id_column: settings.csvIdColumn,
        cascade_schema: settings.cascadeSchema,
        ignore_constraints: settings.ignoreConstraints,
        create_missing_tables: settings.createMissingTables,
        create_missing_columns: settings.createMissingColumns
    };
}

export function getLoadStepDTO(step: LoadStep): LoadStepDTO {
    return {
        matches: step.matches.map(match => ({
            left: match.right,
            right: match.left
        })),
        entities: step.entities
    };
}

function convertMigrationConfig(config: MigrationDTO): MigrationDTO {
    // Deep clone the config to avoid modifying the original object
    const newConfig = JSON.parse(JSON.stringify(config));

    for (const item of newConfig.migrate_items) {
        // Determine the primary source entity name for the current item
        const sourceEntityName = item.source.names[0];

        // If a source entity is defined, process its mappings
        if (sourceEntityName) {
            for (const mapping of item.map.mappings) {
                // Recursively transform the source expression for each mapping
                mapping.source = transformExpression(mapping.source, sourceEntityName);
            }
        }
    }

    return newConfig;
}

function transformExpression(expression: Expression, sourceEntityName: string): Expression | IdentifierExpr {
    if ('Lookup' in expression) {
        // If the lookup's entity matches the item's source, convert to Identifier
        if (expression.Lookup.entity === sourceEntityName) {
            return { Identifier: expression.Lookup.key! };
        }
    }

    if ('Arithmetic' in expression) {
        // Recursively transform nested expressions in an arithmetic operation
        expression.Arithmetic.left = transformExpression(expression.Arithmetic.left, sourceEntityName);
        expression.Arithmetic.right = transformExpression(expression.Arithmetic.right, sourceEntityName);
    }

    if ('FunctionCall' in expression) {
        // Recursively transform all argument expressions in a function call
        expression.FunctionCall[1] = expression.FunctionCall[1].map(arg =>
            transformExpression(arg, sourceEntityName)
        );
    }

    // Return the expression (either transformed or unchanged)
    return expression;
}