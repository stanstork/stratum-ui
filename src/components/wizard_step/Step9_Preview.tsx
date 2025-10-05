import React, { useState, createContext, useContext } from "react";
import {
    Database, FileText, ArrowRight, Link2, Filter as FilterIcon, Settings as SettingsIcon,
    Map as MapIcon, Table, CheckCircle2, ChevronDown, Check, X
} from "lucide-react";
import { MigrationConfig, MigrateItem, Expression, LookupExpr, LiteralExpr, FunctionCallExpr, ConditionExpr } from "../../types/MigrationConfig";
import { Badge } from "../common/v2/Badge";

/** ---------- Helpers (mostly unchanged) ---------- */
const isLookup = (e?: Expression): e is LookupExpr => !!(e as LookupExpr)?.Lookup;
const isLiteral = (e?: Expression): e is LiteralExpr => !!(e as LiteralExpr)?.Literal;
const isFn = (e?: Expression): e is FunctionCallExpr => Array.isArray((e as FunctionCallExpr)?.FunctionCall);
const isCond = (e?: Expression): e is ConditionExpr => !!(e as ConditionExpr)?.Condition;

function exprToString(expr?: Expression | null): string {
    if (!expr) return "—";
    if (isLookup(expr)) return `@${expr.Lookup.entity || '?'}.${expr.Lookup.key ?? '?'}`;
    if (isLiteral(expr)) {
        if ("String" in expr.Literal) return JSON.stringify(expr.Literal.String);
        if ("Integer" in expr.Literal) return String(expr.Literal.Integer);
        if ("Float" in expr.Literal) return String(expr.Literal.Float);
        if ("Boolean" in expr.Literal) return String(expr.Literal.Boolean);
        return "literal";
    }
    if (isFn(expr)) return `${expr.FunctionCall[0]}(${(expr.FunctionCall[1] || []).map(exprToString).join(', ')})`;
    if (isCond(expr)) return `${exprToString(expr.Condition.left)} ${expr.Condition.op} ${exprToString(expr.Condition.right)}`;
    return "expr";
}

function filterToString(filterExpr?: Expression | null): string {
    if (!filterExpr) return "No filter applied";
    if (isFn(filterExpr)) {
        const [name, args] = filterExpr.FunctionCall;
        return (args || []).map(filterToString).join(` ${(name || "AND").toUpperCase()} `) || "No filter";
    }
    return exprToString(filterExpr);
}

const itemKey = (item: MigrateItem, idx: number) =>
    (item as any).id ?? `${idx}-${item.destination?.names?.[0]}-${item.source?.names?.[0]}`;

/** ---------- New UI Components ---------- */

const AccordionContext = createContext<{ selected: string[], toggle: (val: string) => void }>({ selected: [], toggle: () => { } });
const Accordion: React.FC<{ type: 'single' | 'multiple', children: React.ReactNode, className?: string }> = ({ children, className }) => {
    const [selected, setSelected] = useState<string[]>([]);
    const toggle = (value: string) => setSelected(p => p.includes(value) ? p.filter(v => v !== value) : [...p, value]);
    return <AccordionContext.Provider value={{ selected, toggle }}><div className={className}>{children}</div></AccordionContext.Provider>;
}
const AccordionItem: React.FC<{ value: string, children: React.ReactNode }> = ({ value, children }) => (
    <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">{children}</div>
);
type AccordionTriggerChildProps = { itemKey?: string };

const AccordionTrigger: React.FC<{ children: React.ReactElement<AccordionTriggerChildProps> }> = ({ children }) => {
    const { selected, toggle } = useContext(AccordionContext);
    const value = children.props.itemKey; // Now typed
    const isOpen = selected.includes(value ?? "");
    return (
        <button onClick={() => toggle(value ?? "")} className="w-full flex justify-between items-center bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
            {React.cloneElement(children, { itemKey: value })}
            <ChevronDown size={20} className={`mr-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
    );
};
const AccordionContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="bg-white dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700/60">{children}</div>;


const TabsContext = createContext<{ active: string, setActive: (val: string) => void }>({ active: '', setActive: () => { } });
const Tabs: React.FC<{ defaultValue: string, children: React.ReactNode }> = ({ defaultValue, children }) => {
    const [active, setActive] = useState(defaultValue);
    return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}
const TabsList: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/60 px-4">{children}</div>;
const TabsTrigger: React.FC<{ value: string, children: React.ReactNode }> = ({ value, children }) => {
    const { active, setActive } = useContext(TabsContext);
    const isActive = active === value;
    return <button onClick={() => setActive(value)} className={`px-3 py-2.5 text-sm font-semibold transition-all border-b-2 ${isActive ? 'text-blue-600 dark:text-blue-400 border-blue-600' : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-t-md'}`}>{children}</button>
}
const TabsContent: React.FC<{ value: string, children: React.ReactNode }> = ({ value, children }) => {
    const { active } = useContext(TabsContext);
    return active === value ? <div className="p-4">{children}</div> : null;
}

/** ---------- Main Preview Component ---------- */

const Step9_Preview: React.FC<{ config: MigrationConfig }> = ({ config }) => {
    const items = config.migration?.migrateItems ?? [];
    const isSingle = items.length === 1;

    const totals = React.useMemo(() => ({
        items: items.length,
        maps: items.reduce((sum, it) => sum + (it.map?.mappings?.length ?? 0), 0),
        joins: items.reduce((sum, it) => sum + (it.load?.entities?.length ?? 0), 0),
    }), [items]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Review & Confirm</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Preview the full configuration before running the migration.
                </p>
            </div>
            {!isSingle && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Totals:</h3>
                    <Badge variant="secondary" className="flex items-center gap-1.5"><Table size={14} /> {totals.items} Items</Badge>
                    <Badge variant="secondary" className="flex items-center gap-1.5"><Link2 size={14} /> {totals.joins} Joins</Badge>
                    <Badge variant="secondary" className="flex items-center gap-1.5"><MapIcon size={14} /> {totals.maps} Mappings</Badge>
                </div>
            )}
            {isSingle ? (
                <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden">
                    <ItemHeader item={items[0]} idx={0} itemKey={itemKey(items[0], 0)} />
                    <ItemBody item={items[0]} />
                </div>
            ) : (
                <Accordion type="multiple">
                    {items.map((item, idx) => (
                        <AccordionItem value={itemKey(item, idx)} key={itemKey(item, idx)}>
                            <AccordionTrigger>
                                <ItemHeader item={item} idx={idx} itemKey={itemKey(item, idx)} />
                            </AccordionTrigger>
                            <AccordionContent><ItemBody item={item} /></AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
};

const ItemHeader: React.FC<{ item: MigrateItem; idx: number; itemKey: string }> = ({ item, idx }) => (
    <div className="flex items-center justify-between gap-3 w-full p-4">
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md">
                {item.destination?.kind === "file" ? <FileText size={20} /> : <Database size={20} />}
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.destination?.names?.[0] || `Item ${idx + 1}`}
                </h3>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {item.source?.names?.[0] || '...'} → {item.destination?.names?.[0] || '...'}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            {Boolean(item.settings?.inferSchema) && <Badge variant="outline">Infer Schema</Badge>}
            {Boolean(item.settings?.cascadeSchema) && <Badge variant="outline">Cascade</Badge>}
        </div>
    </div>
);

const ItemBody: React.FC<{ item: MigrateItem }> = ({ item }) => (
    <div className="p-4 pt-2 space-y-6">
        <div className="flex items-center justify-center gap-4 text-center">
            <FlowBox title="Source" name={item.source?.names?.[0]} kind={item.source?.kind} />
            <ArrowRight size={24} className="text-slate-400 dark:text-slate-500 mt-6 flex-shrink-0" />
            <FlowBox title="Destination" name={item.destination?.names?.[0]} kind={item.destination?.kind} />
        </div>
        <Tabs defaultValue="mappings">
            <TabsList>
                <TabsTrigger value="mappings">Mappings ({item.map?.mappings?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="joins">Joins ({item.load?.matches?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="filter">Filter</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="mappings">
                {item.map?.mappings?.length ? (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto text-sm">
                        {item.map.mappings.map((m, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="font-mono text-sky-700 dark:text-sky-300 truncate">{exprToString(m.source)}</span>
                                <ArrowRight size={14} className="text-slate-400" />
                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{m.target}</span>
                            </div>
                        ))}
                    </div>
                ) : <EmptyState>No mappings defined.</EmptyState>}
            </TabsContent>
            <TabsContent value="joins">
                {item.load?.matches?.length ? (
                    <div className="space-y-1.5 text-sm font-mono">
                        {item.load.matches.map((m, i) => (
                            <div key={i}>
                                <span>{exprToString(m.left)}</span>
                                <span className="mx-2 text-slate-500">=</span>
                                <span>{exprToString(m.right)}</span>
                            </div>
                        ))}
                    </div>
                ) : <EmptyState>No joins defined.</EmptyState>}
            </TabsContent>
            <TabsContent value="filter">
                <p className="text-sm text-slate-700 dark:text-slate-200 font-mono break-words">
                    {filterToString(item.filter?.expression)}
                </p>
            </TabsContent>
            <TabsContent value="settings"><SettingsGrid item={item} /></TabsContent>
        </Tabs>
    </div>
);

const FlowBox: React.FC<{ title: string, name?: string, kind?: string }> = ({ title, name, kind }) => (
    <div className="flex-1 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-base font-semibold font-mono text-slate-800 dark:text-slate-100 mt-1 truncate">{name || '—'}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{kind || 'Table'}</p>
    </div>
);

const SettingsGrid: React.FC<{ item: MigrateItem }> = ({ item }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        <SettingItem label="Create Tables" enabled={item.settings?.createMissingTables} />
        <SettingItem label="Create Columns" enabled={item.settings?.createMissingColumns} />
        <SettingItem label="Infer Schema" enabled={item.settings?.inferSchema} />
        <SettingItem label="Cascade Schema" enabled={item.settings?.cascadeSchema} />
        <SettingItem label="Ignore Constraints" enabled={item.settings?.ignoreConstraints} />
        <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Batch Size:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{item.settings?.batchSize ?? 0}</span>
        </div>
    </div>
);

const SettingItem: React.FC<{ label: string, enabled?: boolean }> = ({ label, enabled }) => (
    <div className="flex items-center gap-2.5 text-sm">
        {enabled ? <Check size={16} className="text-emerald-500 flex-shrink-0" /> : <X size={16} className="text-slate-500 flex-shrink-0" />}
        <span className="text-slate-700 dark:text-slate-200">{label}</span>
    </div>
);

const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="text-center py-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>
    </div>
);

export default Step9_Preview;