import React, { useMemo } from "react";
import {
    FileText,
    ArrowRight,
    Link2,
    Filter as FilterIcon,
    Settings as SettingsIcon,
    Map as MapIcon,
    Table,
    Check,
    X,
} from "lucide-react";
import {
    MigrationConfig,
    MigrateItem,
    Expression,
    LookupExpr,
    LiteralExpr,
    FunctionCallExpr,
    ConditionExpr,
    ArithmeticExpr,
    IdentifierExpr,
} from "../../types/MigrationConfig";
import { Card, CardContent } from "../common/v2/Card";
import { Badge } from "../common/v2/Badge";

const isLookup = (e?: Expression): e is LookupExpr => !!(e as LookupExpr)?.Lookup;
const isLiteral = (e?: Expression): e is LiteralExpr => !!(e as LiteralExpr)?.Literal;
const isFn = (e?: Expression): e is FunctionCallExpr => Array.isArray((e as FunctionCallExpr)?.FunctionCall);
const isCond = (e?: Expression): e is ConditionExpr => !!(e as ConditionExpr)?.Condition;
export const isFunctionCall = (expr: Expression): expr is FunctionCallExpr => Array.isArray((expr as FunctionCallExpr)?.FunctionCall);
export const isArithmetic = (expr: Expression): expr is ArithmeticExpr => !!(expr as ArithmeticExpr)?.Arithmetic;
export const isCondition = (expr: Expression): expr is ConditionExpr => !!(expr as ConditionExpr)?.Condition;
export const isIdentifier = (expr: Expression): expr is IdentifierExpr => typeof (expr as IdentifierExpr).Identifier === 'string';
const COMPARATOR_MAP: Record<string, string> = { 'Equal': '=', 'NotEqual': '!=', 'GreaterThan': '>', 'GreaterThanOrEqual': '>=', 'LessThan': '<', 'LessThanOrEqual': '<=' };
const ARITHMETIC_OPERATORS: Record<string, string> = { 'Add': '+', 'Subtract': '-', 'Multiply': '*', 'Divide': '/' };

export function exprToString(expr?: Expression | null): string {
    if (!expr) return 'N/A';
    if (isLookup(expr)) return `${expr.Lookup.entity}.${expr.Lookup.key || '?'}`;
    if (isLiteral(expr)) {
        const literal = expr.Literal;
        if (literal.String !== undefined) return `'${literal.String}'`;
        if (literal.Integer !== undefined) return literal.Integer.toString();
        if (literal.Float !== undefined) return literal.Float.toString();
        if (literal.Boolean !== undefined) return literal.Boolean.toString().toUpperCase();
        return 'NULL';
    }
    if (isArithmetic(expr)) return `(${exprToString(expr.Arithmetic.left)} ${ARITHMETIC_OPERATORS[expr.Arithmetic.operator]} ${exprToString(expr.Arithmetic.right)})`;
    if (isFunctionCall(expr)) return `${expr.FunctionCall[0]}(${expr.FunctionCall[1].map(exprToString).join(', ')})`;
    if (isCondition(expr)) return `(${exprToString(expr.Condition.left)} ${COMPARATOR_MAP[expr.Condition.op]} ${exprToString(expr.Condition.right)})`;
    if (isIdentifier(expr)) return expr.Identifier;
    return 'Unknown Expression';
}

export const highlightBooleanOps = (text: string) => {
    if (text == 'N/A') return <span>No filters defined</span>;

    const parts = text.split(/(\bAND\b|\bOR\b)/gi);
    return parts.map((p, i) => {
        const up = p.toUpperCase();
        if (up === "AND") return <span key={i} className="text-sky-600 dark:text-sky-400 font-semibold">AND</span>;
        if (up === "OR") return <span key={i} className="text-amber-600 dark:text-amber-400 font-semibold">OR</span>;
        return <span key={i}>{p}</span>;
    });
};

function itemKey(item: MigrateItem, idx: number) {
    const id: string | undefined = (item as any).id;
    return id ?? `${idx}-${item.destination?.names?.[0] ?? "dest"}-${item.source?.names?.[0] ?? "src"}`;
}

export const getLookupParts = (expr: Expression) => {
    if (isLookup(expr)) {
        return { table: expr.Lookup.entity ?? "", column: expr.Lookup.key ?? "", raw: `${expr.Lookup.entity}.${expr.Lookup.key ?? "?"}`, isLookup: true };
    }
    return { table: "", column: "", raw: exprToString(expr), isLookup: false };
};

type Step9PreviewProps = { config: MigrationConfig };

const Step9_Preview: React.FC<Step9PreviewProps> = ({ config }) => {
    const items = config.migration?.migrateItems ?? [];
    const isSingle = items.length === 1;
    const totals = useMemo(() => {
        let maps = 0, joins = 0;
        items.forEach((it) => {
            maps += it.map?.mappings?.length ?? 0;
            joins += it.load?.entities?.length ?? 0;
        });
        return { items: items.length, maps, joins };
    }, [items]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Review & Confirm</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Preview the configuration before running the migration.
                    </p>
                </div>
                {!isSingle && (
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">{totals.items} items</Badge>
                        <Badge variant="secondary">{totals.joins} joins</Badge>
                        <Badge variant="secondary">{totals.maps} mappings</Badge>
                    </div>
                )}
            </div>
            {isSingle ? (
                <ItemCard item={items[0]} idx={0} dense />
            ) : (
                <div className="space-y-6">
                    {items.map((item, idx) => (
                        <ItemCard key={itemKey(item, idx)} item={item} idx={idx} />
                    ))}
                </div>
            )}
        </div>
    );
};

const ItemCard: React.FC<{ item: MigrateItem; idx: number; dense?: boolean }> = ({
    item, idx, dense = false,
}) => {
    const pad = dense ? "p-5" : "p-6";
    const titleSize = dense ? "text-lg" : "text-xl";

    return (
        <Card className="border border-slate-200/75 dark:border-slate-800 rounded-xl shadow-sm">
            <CardContent className={`${pad} space-y-5`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <FileText size={24} className="text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                            <h3 className={`${titleSize} font-bold text-slate-900 dark:text-white`}>
                                {item.destination?.names?.[0] || `Item ${idx + 1}`}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                {item.source?.kind || "SOURCE"} → {item.destination?.kind || "DEST"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {Boolean(item.settings?.inferSchema) && <Badge variant="outline">Infer Schema</Badge>}
                        {Boolean(item.settings?.cascadeSchema) && <Badge variant="outline">Cascade</Badge>}
                    </div>
                </div>

                <Section title="Source → Destination" icon={<Table size={16} />}>
                    <div className="flex items-center gap-3 pt-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{item.source?.kind || "Table"}</Badge>
                            <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{item.source?.names?.[0] || "—"}</span>
                        </div>
                        <ArrowRight size={16} className="text-slate-400 flex-shrink-0" />
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{item.destination?.kind || "Table"}</Badge>
                            <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{item.destination?.names?.[0] || "—"}</span>
                        </div>
                    </div>
                </Section>

                <Section title="Joins" icon={<Link2 size={16} />}>
                    <div className="pt-4 space-y-2">
                        {item.load?.matches?.length ? (
                            item.load.matches.map((m, i) => {
                                const L = getLookupParts(m.left);
                                const R = getLookupParts(m.right);
                                const leftField = L.isLookup ? (L.column || L.raw) : L.raw;
                                const rightField = R.isLookup ? (R.column || R.raw) : R.raw;
                                return (
                                    <div key={i} className="flex items-center gap-2 flex-wrap rounded-lg px-3 py-2 border border-slate-200/75 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                                        <span className={`${pillBase} ${tablePill}`} title={L.table || leftField}>{L.table || leftField}</span>
                                        <JoinIcon />
                                        <span className={`${pillBase} ${tablePill}`} title={R.table || rightField}>{R.table || rightField}</span>
                                        <span className={opText}>on</span>
                                        <span className={`${pillBase} ${fieldPill}`} title={leftField}>{leftField}</span>
                                        <span className="text-pink-500 dark:text-pink-400 font-semibold mx-1">=</span>
                                        <span className={`${pillBase} ${fieldPill}`} title={rightField}>{rightField}</span>
                                        <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">INNER</span>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">No joins defined.</p>
                        )}
                    </div>
                </Section>

                <Section title="Mappings" icon={<MapIcon size={16} />}>
                    <div className="pt-2 -mx-3">
                        <table className="w-full text-sm">
                            <colgroup>
                                <col className="w-[45%]" />
                                <col className="w-[10%]" />
                                <col className="w-[45%]" />
                            </colgroup>
                            <tbody className="divide-y divide-slate-200/75 dark:divide-slate-800">
                                {(item.map.mappings ?? []).map((m, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                {!isLookup(m.source) && !isIdentifier(m.source) && !isLiteral(m.source) && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/30">FX</span>
                                                )}
                                                <span title={exprToString(m.source)} className="font-mono text-slate-600 dark:text-slate-300 block truncate">{exprToString(m.source)}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-center text-slate-400 dark:text-slate-500">→</td>
                                        <td className="px-3 py-2.5">
                                            <span title={m.target} className="font-mono font-semibold text-slate-800 dark:text-slate-100 block truncate">{m.target}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>

                <Section title="Filter" icon={<FilterIcon size={16} />}>
                    <div className="pt-4">
                        <div className="relative rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/75 dark:border-slate-800">
                            <div className="pl-4 pr-3 py-3 md:pl-5">
                                <code className="text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                                    {highlightBooleanOps(exprToString(item.filter.expression))}
                                </code>
                            </div>
                        </div>
                    </div>
                </Section>

                <Section title="Settings" icon={<SettingsIcon size={16} />}>
                    <div className="pt-4"><SettingsGrid item={item} /></div>
                </Section>
            </CardContent>
        </Card>
    );
};

export const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ title, icon, children }) => (
    <div>
        <div className="flex items-center gap-3 border-b border-slate-200/75 dark:border-slate-800 pb-2">
            <div className="text-slate-400 dark:text-slate-500">{icon}</div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h4>
        </div>
        {children}
    </div>
);

export const SettingsGrid: React.FC<{ item: MigrateItem }> = ({ item }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        <SettingItem label="Create Tables" enabled={item.settings?.createMissingTables} />
        <SettingItem label="Create Columns" enabled={item.settings?.createMissingColumns} />
        <SettingItem label="Infer Schema" enabled={item.settings?.inferSchema} />
        <SettingItem label="Cascade Schema" enabled={item.settings?.cascadeSchema} />
        <SettingItem label="Ignore Constraints" enabled={item.settings?.ignoreConstraints} />
        <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Batch Size:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{item.settings?.batchSize ?? 'Default'}</span>
        </div>
    </div>
);

const SettingItem: React.FC<{ label: string, enabled?: boolean }> = ({ label, enabled }) => (
    <div className="flex items-center gap-2.5 text-sm">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        {enabled ? <Check size={16} className="text-green-500 flex-shrink-0" /> : <X size={16} className="text-slate-400 dark:text-slate-600 flex-shrink-0" />}
    </div>
);

export const JoinIcon = () => (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
        <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    </div>
);

export const pillBase = "px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap truncate";
export const tablePill = "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300";
export const fieldPill = "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
export const opText = "text-slate-500 dark:text-slate-400 text-xs mx-1";

export default Step9_Preview;