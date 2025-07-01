interface TableMetadataWrapper {
    Table: TableMetadataDTO;
}

export interface TableMetadataDTO {
    name: string;
    schema: string | null;
    columns: Record<string, ColumnMetadataDTO>;
    primary_keys: string[];
    foreign_keys: Record<string, ForeignKeyMetadataDTO>;
    referenced_tables: Record<string, TableMetadataDTO>;
    referencing_tables: Record<string, TableMetadataDTO>;
}

export interface TableMetadata {
    name: string;
    schema: string | null;
    columns: Record<string, ColumnMetadata>;
    primaryKeys: string[];
    foreignKeys: Record<string, ForeignKeyMetadata>;
    referencedTables: Record<string, TableMetadata>;
    referencingTables: Record<string, TableMetadata>;
}

export function mapTableMetadata(dto: TableMetadataDTO): TableMetadata {
    return {
        name: dto.name,
        schema: dto.schema,
        columns: Object.fromEntries(Object.entries(dto.columns).map(([key, col]) => [key, mapColumnMetadata(col)])),
        primaryKeys: dto.primary_keys,
        foreignKeys: Object.fromEntries(Object.entries(dto.foreign_keys).map(([key, fk]) => [key, mapForeignKeyMetadata(fk)])),
        referencedTables: Object.fromEntries(Object.entries(dto.referenced_tables).map(([key, table]) => [key, mapTableMetadata(table)])),
        referencingTables: Object.fromEntries(Object.entries(dto.referencing_tables).map(([key, table]) => [key, mapTableMetadata(table)])),
    };
}

export interface ColumnMetadataDTO {
    ordinal: number;
    name: string;
    data_type: string;
    is_nullable: boolean;
    is_primary_key: boolean;
    is_unique: boolean;
    is_auto_increment: boolean;
    referenced_table: string | null;
    referenced_column: string | null;
}

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

export function mapColumnMetadata(dto: ColumnMetadataDTO): ColumnMetadata {
    return {
        ordinal: dto.ordinal,
        name: dto.name,
        dataType: dto.data_type,
        isNullable: dto.is_nullable,
        isPrimaryKey: dto.is_primary_key,
        isUnique: dto.is_unique,
        isAutoIncrement: dto.is_auto_increment,
        referencedTable: dto.referenced_table,
        referencedColumn: dto.referenced_column,
    };
}

export interface ForeignKeyMetadataDTO {
    column: string;
    referenced_table: string;
    referenced_column: string;
}

export interface ForeignKeyMetadata {
    column: string;
    referencedTable: string;
    referencedColumn: string;
}

export function mapForeignKeyMetadata(dto: ForeignKeyMetadataDTO): ForeignKeyMetadata {
    return {
        column: dto.column,
        referencedTable: dto.referenced_table,
        referencedColumn: dto.referenced_column,
    };
}

export interface MetadataResponse {
    [tableName: string]: TableMetadataWrapper;
}

export function mapMetadataResponse(response: MetadataResponse): { [key: string]: TableMetadata } {
    const metadata: { [key: string]: TableMetadata } = {};
    for (const tableName in response) {
        metadata[tableName] = mapTableMetadata(response[tableName].Table);
    }
    return metadata;
}