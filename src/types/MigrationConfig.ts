import { ConnectionPair } from "../components/ConnectionEditor";
import { Connection } from "./Connection";

// Root config
export interface MigrationConfig {
    name: string;
    description: string;
    creation_date: string; // ISO date string
    migration: Migration;
    connections: ConnectionPair;
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
    filter: FilterStep;
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
export interface FilterStep {
    expression: Expression;
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
        key: string;
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
    FunctionCall: {
        name: string;
        arguments: Expression[];
    };
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
            migrateItems: []
        },
        connections: {
            source: {
                id: '',
                name: '',
                format: '',
                connStr: '',
                status: 'untested'
            },
            dest: {
                id: '',
                name: '',
                format: '',
                connStr: '',
                status: 'untested'
            }
        }
    };
}

export function emptyMigrationItem(): MigrateItem {
    return {
        id: new Date(),
        map: { mappings: [] },
        load: { matches: [], entities: [] },
        filter: { expression: { FunctionCall: { name: 'AND', arguments: [] } } },
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