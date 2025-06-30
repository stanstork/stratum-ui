/** Mirrors Rust’s `TableMetadata` */
export interface TableMetadata {
    name: string;
    schema: string | null;
    columns: Record<string, ColumnMetadata>;
    primaryKeys: string[];
    foreignKeys: Record<string, ForeignKeyMetadata>;
    referencedTables: string[];
    referencingTables: string[];
}

/** Mirrors Rust’s `ColumnMetadata` */
export interface ColumnMetadata {
    ordinal: number;
    name: string;
    dataType: string;
    isNullable: boolean;
    isPrimaryKey: boolean;
    isUnique: boolean;
    isAutoIncrement: boolean;
    referencedTable: string | null;
    referencedColumn: string | null;
}

export interface ForeignKeyMetadata {
    column: string;
    referencedTable: string;
    referencedColumn: string;
}