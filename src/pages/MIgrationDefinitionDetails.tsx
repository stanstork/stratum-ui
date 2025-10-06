import {
    ArrowLeft,
    Database,
    FileText,
    Calendar,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Clock,
    Edit,
    Table,
    TestTube2,
    Link2,
    Map,
    Layers,
    ChevronRight,
    Filter,
    FilterIcon,
    MapIcon
} from "lucide-react";
import { format } from "date-fns";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArithmeticExpr, ConditionExpr, countFilterConditions, Expression, FunctionCallExpr, IdentifierExpr, LiteralExpr, LookupExpr, MigrateItem, MigrationConfig } from "../types/MigrationConfig";
import apiClient from "../services/apiClient";
import { Button } from "../components/common/v2/Button";
import { getMigrationConfig, JobDefinition } from "../types/JobDefinition";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/v2/Card";
import { Badge } from "../components/common/v2/Badge";
import { cn } from "../utils/utils";
import { getConnectionIcon } from "../components/common/Helper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/common/v2/Tabs";
import { StatusType } from "../types/Connection";
import { dataFormatLabels } from "./Connections";
import { DryRunReport } from "../types/DryRun";
import DryRunPanel from "../components/DryRunPanel";
import { exprToString, Section, SettingsGrid } from "../components/wizard_step/Step9_Preview";

export const isLookup = (expr: Expression): expr is LookupExpr => !!(expr as LookupExpr)?.Lookup;
export const isLiteral = (expr: Expression): expr is LiteralExpr => !!(expr as LiteralExpr)?.Literal;
export const isFunctionCall = (expr: Expression): expr is FunctionCallExpr => Array.isArray((expr as FunctionCallExpr)?.FunctionCall);
export const isArithmetic = (expr: Expression): expr is ArithmeticExpr => !!(expr as ArithmeticExpr)?.Arithmetic;
export const isCondition = (expr: Expression): expr is ConditionExpr => !!(expr as ConditionExpr)?.Condition;
export const isIdentifier = (expr: Expression): expr is IdentifierExpr => typeof (expr as IdentifierExpr).Identifier === 'string';

const COMPARATOR_MAP: Record<string, string> = {
    'Equal': '=', 'NotEqual': '!=', 'GreaterThan': '>', 'GreaterThanOrEqual': '>=', 'LessThan': '<', 'LessThanOrEqual': '<='
};

const ARITHMETIC_OPERATORS: Record<string, string> = {
    'Add': '+', 'Subtract': '-', 'Multiply': '*', 'Divide': '/'
};

const renderExpression = (expr?: Expression | null): string => {
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
    if (isArithmetic(expr)) return `(${renderExpression(expr.Arithmetic.left)} ${ARITHMETIC_OPERATORS[expr.Arithmetic.operator]} ${renderExpression(expr.Arithmetic.right)})`;
    if (isFunctionCall(expr)) return `${expr.FunctionCall[0]}(${expr.FunctionCall[1].map(renderExpression).join(', ')})`;
    if (isCondition(expr)) return `(${renderExpression(expr.Condition.left)} ${COMPARATOR_MAP[expr.Condition.op]} ${renderExpression(expr.Condition.right)})`;
    if (isIdentifier(expr)) return expr.Identifier;

    return 'Unknown Expression';
};

export const statusText = (status: StatusType) => {
    switch (status) {
        case "valid": return "Valid";
        case "invalid": return "Invalid";
        case "testing": return "Testing";
        case "untested": return "Untested";
        default: return "Unknown";
    }
};

export const getStatusBadge = (status: StatusType) => {
    switch (status) {
        case "valid": return "text-green-800 dark:text-green-300";
        case "invalid": return "text-red-800 dark:text-red-300";
        case "testing": return "text-blue-800 dark:text-blue-300";
        case "untested": return "text-slate-800 dark:text-slate-300";
        default: return "text-gray-800 dark:text-gray-300";
    }
};

export const getStatusIndicator = (status: StatusType) => {
    switch (status) {
        case "valid": return "bg-green-500 rounded-full";
        case "invalid": return "bg-red-500 rounded-full";
        case "testing": return "bg-blue-500 rounded-full";
        case "untested": return "bg-slate-500 rounded-full";
        default: return "bg-gray-500 rounded-full";
    }
};

export const getLookupParts = (expr: Expression) => {
    if (isLookup(expr)) {
        return {
            table: expr.Lookup.entity ?? "",
            column: expr.Lookup.key ?? "",
            raw: `${expr.Lookup.entity}.${expr.Lookup.key ?? "?"}`,
            isLookup: true,
        };
    }
    return {
        table: "",
        column: "",
        raw: renderExpression(expr),
        isLookup: false,
    };
};

export const JoinIcon = () => (
    <div className="w-10 h-10 rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    </div>
);

export const pillBase = "px-2.5 py-1 rounded-md text-sm font-medium whitespace-nowrap";
export const tablePill = "bg-blue-500 text-white dark:bg-blue-500/30";
export const fieldPill = "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100";
export const opText = "text-slate-500 dark:text-slate-400 text-sm mx-1";

export const highlightBooleanOps = (text: string) => {
    const parts = text.split(/(\bAND\b|\bOR\b)/gi);
    return parts.map((p, i) => {
        const up = p.toUpperCase();
        if (up === "AND") {
            return <span key={i} className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold">AND</span>;
        }
        if (up === "OR") {
            return <span key={i} className="text-amber-600 dark:text-amber-400 font-semibold">OR</span>;
        }
        return <span key={i}>{p}</span>;
    });
};

export default function DefinitionDetails() {
    const { definitionId } = useParams<{ definitionId: string }>();
    const [config, setConfig] = useState<MigrationConfig | null>(null);
    const [definition, setDefinition] = useState<JobDefinition | null>(null);
    const [loading, setLoading] = useState(true);
    const [dryRunOpen, setDryRunOpen] = useState(false);
    const [dryRunReport, setDryRunReport] = useState<DryRunReport | null>(null);
    const [dryRunLoading, setDryRunLoading] = useState(false);
    const migrationItems = config?.migration.migrateItems ?? [];

    useEffect(() => {
        const fetchDefinition = async () => {
            if (!definitionId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const data = await apiClient.getJobDefinition(definitionId);
                const migrationConfig = getMigrationConfig(data);
                setConfig(migrationConfig);
                setDefinition(data);
            } catch (error) {
                console.error("Failed to fetch migration definition:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDefinition();
    }, [definitionId]);

    const fetchDryRunReport = async () => {
        if (!definitionId) return;
        try {
            setDryRunLoading(true);
            const report = await apiClient.getDryRunReport(definitionId);
            setDryRunReport(report);
            setDryRunOpen(true);
        } catch (error) {
            console.error("Failed to fetch dry run report:", error);
        } finally {
            setDryRunLoading(false);
        }
    };

    const handleDryRunClick = () => {
        fetchDryRunReport();
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active": return <CheckCircle className="text-green-600 dark:text-green-400" size={20} />;
            case "inactive": return <XCircle className="text-red-600 dark:text-red-400" size={20} />;
            case "paused": return <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />;
            default: return <Clock className="text-slate-600 dark:text-slate-400" size={20} />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
            </div>
        );
    }

    if (!definition) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Migration Definition Not Found</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">The requested migration definition could not be found.</p>
                <Link to="/definitions"><Button><ArrowLeft size={16} className="mr-2" />Back to Definitions</Button></Link>
            </div>
        );
    }

    const sourceConnection = definition.sourceConnection;
    const destinationConnection = definition.destinationConnection;

    const totalSourceTables = migrationItems.reduce((sum, item) => sum + (item.load?.entities?.length ?? 0) + 1, 0);
    const totalMappings = migrationItems.reduce((sum, item) => sum + (item.map?.mappings.length ?? 0), 0);
    const totalJoins = migrationItems.reduce((sum, item) => sum + (item.load?.matches?.length ?? 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/definitions">
                        <Button variant="ghost"><ArrowLeft size={16} className="mr-2" />Back</Button>
                    </Link>
                    <div>
                        <h1 className="text-[24px] font-bold leading-tight text-slate-900 dark:text-white">{definition.name}</h1>
                        <p className="text-slate-700 dark:text-slate-300">Migration Definition Details</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={handleDryRunClick} disabled={dryRunLoading}>
                        <TestTube2 size={16} className="mr-2" />
                        {dryRunLoading ? "Running..." : "Dry Run"}
                    </Button>
                    <Link to={`/wizard?edit=${definition.id}`}>
                        <Button variant="primary"><Edit size={16} className="mr-2" />Edit Definition</Button>
                    </Link>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        {getStatusIcon("active")}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{"active"}</div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Current state</p>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Source</CardTitle>
                        {sourceConnection && getConnectionIcon(sourceConnection.dataFormat)}
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">{sourceConnection?.name || "Not configured"}</div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{sourceConnection?.dataFormat || "No connection"}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Destination</CardTitle>
                        {destinationConnection && getConnectionIcon(destinationConnection.dataFormat)}
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">{destinationConnection?.name || "Not configured"}</div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{destinationConnection?.dataFormat || "No connection"}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Created</CardTitle>
                        <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">{definition.createdAt ? format(new Date(definition.createdAt), "MMM d") : "Unknown"}</div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{definition.createdAt ? format(new Date(definition.createdAt), "yyyy") : ""}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Information */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className={cn("w-fit rounded-xl bg-slate-100 dark:bg-slate-800 p-1", "border border-slate-200 dark:border-slate-700")}>
                    {[
                        { value: "overview", label: "Overview" },
                        { value: "items", label: `Migration Items (${migrationItems.length})` },
                        { value: "source", label: "Source Details" },
                        { value: "mapping", label: "Mapping Details" },
                        { value: "settings", label: "Settings" },
                    ].map(({ value, label }) => (
                        <TabsTrigger key={value} value={value} data-testid={`tab-${value}`}
                            className={cn(
                                "px-3.5 text-sm font-medium rounded-xl transition-all",
                                "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
                                "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900",
                                "data-[state=active]:text-slate-900 dark:data-[state=active]:text-white",
                                "data-[state=active]:shadow-sm"
                            )}
                        >{label}</TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="overview">
                    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative mb-6">
                        <CardHeader><CardTitle className="flex items-center space-x-2 font-semibold"><FileText className="text-slate-600 dark:text-slate-400" size={20} /><span>Description</span></CardTitle></CardHeader>
                        <CardContent><p className="text-slate-700 dark:text-slate-300">{definition.description || "No description provided"}</p></CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 ">
                        <Card className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800/50 p-4">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    {getConnectionIcon(sourceConnection?.dataFormat || "MySQL")}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{sourceConnection?.name || "mysql sakila"}</h3>
                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded font-medium">{dataFormatLabels[sourceConnection?.dataFormat || "MySQL"]}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 mt-1">
                                            <div className={`w-2 h-2 ${getStatusIndicator(sourceConnection?.status || "unknown")}`}></div>
                                            <span className={`text-sm ${getStatusBadge(sourceConnection?.status || "unknown")}`}>{statusText(sourceConnection?.status || "unknown")}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <Database className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">Host:</span>
                                        <span className="text-sm text-slate-900 dark:text-white font-mono">{sourceConnection?.host || "host.docker.internal"}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Database className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">Database:</span>
                                        <span className="text-sm text-slate-900 dark:text-white font-mono">{sourceConnection?.dbName || "sakila"}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">User:</span>
                                        <span className="text-sm text-slate-900 dark:text-white font-mono">root</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800/50 p-4">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    {getConnectionIcon(destinationConnection?.dataFormat || "MySQL")}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{destinationConnection?.name || "mysql test db"}</h3>
                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded font-medium">{dataFormatLabels[destinationConnection?.dataFormat || "MySQL"]}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 mt-1">
                                            <div className={`w-2 h-2 ${getStatusIndicator(destinationConnection?.status || "unknown")}`}></div>
                                            <span className={`text-sm ${getStatusBadge(destinationConnection?.status || "unknown")}`}>{statusText(destinationConnection?.status || "unknown")}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <Database className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">Host:</span>
                                        <span className="text-sm text-slate-900 dark:text-white font-mono">{destinationConnection?.host || "mysql_db"}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Database className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">Database:</span>
                                        <span className="text-sm text-slate-900 dark:text-white font-mono">{destinationConnection?.dbName || "testdb"}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">User:</span>
                                        <span className="text-sm text-slate-900 dark:text-white font-mono">user</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Source Tables</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalSourceTables}</p>
                                        <p className="text-xs text-slate-500 mt-1">Across {migrationItems.length} items</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /></svg>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Column Mappings</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalMappings}</p>
                                        <p className="text-xs text-slate-500 mt-1">Across {totalSourceTables} tables</p>
                                    </div>
                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Active Joins</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalJoins}</p>
                                        <p className="text-xs text-slate-500 mt-1">Related tables</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="items">
                    <div className="space-y-6">
                        {migrationItems.map((item, index) => {
                            const primaryTables = item.source.names || [];
                            const joinedTables = (item.load?.matches || []).map(join => getLookupParts(join.left).table).filter(Boolean);
                            const allTables = [...primaryTables, ...joinedTables];
                            const joins = item.load?.matches || [];
                            const columnMappings = item.map.mappings || [];
                            const filters = countFilterConditions(item.filter);

                            const StatBox = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number | string }) => (
                                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                                    <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {icon}
                                        <span className="ml-2">{label}</span>
                                    </div>
                                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                        {value}
                                    </p>
                                </div>
                            );

                            return (
                                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative mb-6">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-600/80 dark:bg-blue-600/30 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                                        {item.destination.names[0]}
                                                    </CardTitle>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                                                        {item.source.names[0]} → {item.destination.names[0]}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Column 1: Source Tables List */}
                                        <div className="lg:col-span-1 space-y-3">
                                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                                                <Database className="w-4 h-4 mr-2" />
                                                <span>Source Tables</span>
                                            </h4>
                                            <div className="space-y-1 pl-1 max-h-32 overflow-y-auto">
                                                {allTables.length > 0 ? (
                                                    allTables.map((table, idx) => (
                                                        <div key={idx} className="text-sm font-mono text-slate-600 dark:text-slate-400 flex items-center">
                                                            <ChevronRight className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                                            <span className="truncate">{table}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-slate-500">None selected</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Column 2: Other Stats */}
                                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <StatBox
                                                icon={<Link2 className="w-4 h-4" />}
                                                label="Joins"
                                                value={joins.length}
                                            />
                                            <StatBox
                                                icon={<Map className="w-4 h-4" />}
                                                label="Mappings"
                                                value={columnMappings.length}
                                            />
                                            <StatBox
                                                icon={<Filter className="w-4 h-4" />}
                                                label="Filters"
                                                value={filters}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="source">
                    <div className="space-y-6">
                        {migrationItems.map((item, index) => (
                            <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative mb-6">
                                <CardHeader className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 p-4">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Table className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                        <span className="font-mono text-slate-900 dark:text-white">{item.destination.names[0]}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 md:p-5 space-y-6">
                                    <Section title="Filter" icon={<FilterIcon size={16} />}>
                                        <div className="pt-3">
                                            <div className="relative rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/75 dark:border-slate-800">
                                                <div className="pl-4 pr-3 py-3 md:pl-5">
                                                    <code className="text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                                                        {highlightBooleanOps(exprToString(item.filter.expression))}
                                                    </code>
                                                </div>
                                            </div>
                                        </div>
                                    </Section>

                                    <Section title="Joins" icon={<Link2 size={16} />}>
                                        <div className="pt-3 space-y-2">
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
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="mapping">
                    <div className="space-y-6">
                        {migrationItems.map((item, index) => (
                            <MappingsCard key={index} item={item} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="settings">
                    <div className="space-y-6">
                        {migrationItems.map((item, index) => (
                            <Card key={index} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                                <CardHeader className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 p-4">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Table className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                        <span className="font-mono text-slate-900 dark:text-white">{item.destination.names[0]}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="pt-4"><SettingsGrid item={item} /></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
            <DryRunPanel open={dryRunOpen} onOpenChange={setDryRunOpen} result={dryRunReport ?? undefined} isLoading={dryRunLoading} onRunDryRun={fetchDryRunReport} canRunMigration={true} onRunMigration={() => { console.log("Run migration clicked"); }} showConfigChanged={false} showControls={true} />
        </div >
    );
}

const MappingsCard: React.FC<{ item: MigrateItem }> = ({ item }) => {
    const [mappingQuery, setMappingQuery] = useState("");

    return (
        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
            <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 p-4">
                <CardTitle className="text-base flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span className="font-mono text-slate-900 dark:text-white">{item.destination.names[0]}</span>
                    <Badge variant="secondary">{item.map.mappings?.length ?? 0}</Badge>
                </CardTitle>
                <div className="relative">
                    <input
                        value={mappingQuery}
                        onChange={(e) => setMappingQuery(e.target.value)}
                        placeholder="Search mappings..."
                        className="h-8 w-full md:w-52 rounded-md bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <colgroup>
                            <col className="w-[45%]" />
                            <col className="w-[10%]" />
                            <col className="w-[45%]" />
                        </colgroup>
                        <thead className="bg-gray-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-200">Source</th>
                                <th className="px-4 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-200" />
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-200">Destination</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/75 dark:divide-slate-800">
                            {(item.map.mappings ?? [])
                                .filter(m => {
                                    const src = exprToString(m.source).toLowerCase();
                                    const dst = (m.target ?? "").toLowerCase();
                                    const q = mappingQuery.trim().toLowerCase();
                                    return !q || src.includes(q) || dst.includes(q);
                                }).map((m, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                {!isLookup(m.source) && !isIdentifier(m.source) && !isLiteral(m.source) && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/30">FX</span>
                                                )}
                                                <span title={exprToString(m.source)} className="font-mono text-slate-600 dark:text-slate-300 block truncate">{exprToString(m.source)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-slate-400 dark:text-slate-500">→</td>
                                        <td className="px-4 py-2.5">
                                            <span title={m.target} className="font-mono font-semibold text-slate-800 dark:text-slate-100 block truncate">{m.target}</span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};