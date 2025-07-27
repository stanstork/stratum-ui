import { exitCode } from "process";
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

export interface MigrateItem {
    id: Date; // Unique identifier for the migration item
    map: MapStep;
    load: LoadStep;
    filter: Filter;
    source: DataSource;
    settings: MigrationSettings;
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

export interface JoinCondition {
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
    | ConditionExpr;

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