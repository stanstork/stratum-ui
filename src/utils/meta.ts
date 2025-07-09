import { TableMetadata } from "../types/Metadata";
import { Expression } from "../types/MigrationConfig";

export function flattenTableMetadataMap(
    tables: Record<string, TableMetadata>
): Record<string, TableMetadata> {
    const seen = new Set<string>();
    const result: Record<string, TableMetadata> = {};

    const getId = (t: TableMetadata) =>
        t.schema ? `${t.schema}.${t.name}` : t.name;

    const visit = (table: TableMetadata) => {
        const id = getId(table);
        if (seen.has(id)) return;
        seen.add(id);
        result[id] = table;

        // traverse all tables that this one references
        for (const child of Object.values(table.referencedTables)) {
            visit(child);
        }
        // traverse all tables that reference this one
        for (const parent of Object.values(table.referencingTables)) {
            visit(parent);
        }
    };

    // kick off traversal from every top‐level entry
    for (const tbl of Object.values(tables)) {
        visit(tbl);
    }

    return result;
}

export const getLookupData = (expr: Expression): { entity: string; column: string } => {
    // if (isLookup(expr)) {
    //     return {
    //         entity: expr.Lookup.entity || '',
    //         column: expr.Lookup.field || '',
    //     };
    // }
    return { entity: '', column: '' };
};