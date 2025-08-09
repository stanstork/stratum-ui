import {
    ArrowLeft,
    Database,
    Server,
    Settings,
    FileText,
    Play,
    Calendar,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Clock,
    Eye,
    Edit,
    Table,
    FileStackIcon,
    TableIcon,
    ColumnsIcon,
    Table2Icon,
    BrickWall,
    BrickWallIcon,
    ConstructionIcon,
    TableConfigIcon
} from "lucide-react";
import { format } from "date-fns";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArithmeticExpr, ConditionExpr, Expression, FunctionCallExpr, getMigrationItem, IdentifierExpr, LiteralExpr, LookupExpr, MigrateItemDTO, MigrationConfig } from "../../types/MigrationConfig";
import apiClient from "../../services/apiClient";
import { Button } from "../../components/common/v2/Button";
import { JobDefinition } from "../../types/JobDefinition";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/common/v2/Card";
import { Badge } from "../../components/common/v2/Badge";
import { cn } from "../../utils/utils";
import { getConnectionIcon } from "../../components/common/Helper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/common/v2/Tabs";
import { StatusType } from "../../types/Connection";
import { dataFormatLabels } from "../Connections";

const isLookup = (expr: Expression): expr is LookupExpr => !!(expr as LookupExpr)?.Lookup;
const isLiteral = (expr: Expression): expr is LiteralExpr => !!(expr as LiteralExpr)?.Literal;
const isFunctionCall = (expr: Expression): expr is FunctionCallExpr => Array.isArray((expr as FunctionCallExpr)?.FunctionCall);
const isArithmetic = (expr: Expression): expr is ArithmeticExpr => !!(expr as ArithmeticExpr)?.Arithmetic;
const isCondition = (expr: Expression): expr is ConditionExpr => !!(expr as ConditionExpr)?.Condition;
const isIdentifier = (expr: Expression): expr is IdentifierExpr => typeof (expr as IdentifierExpr).Identifier === 'string';

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

const statusText = (status: StatusType) => {
    switch (status) {
        case "valid":
            return "Valid";
        case "invalid":
            return "Invalid";
        case "testing":
            return "Testing";
        case "untested":
            return "Untested";
        default:
            return "Unknown";
    }
};

const getStatusBadge = (status: StatusType) => {
    switch (status) {
        case "valid":
            return "text-green-800 dark:text-green-300";
        case "invalid":
            return "text-red-800 dark:text-red-300";
        case "testing":
            return "text-blue-800 dark:text-blue-300";
        case "untested":
            return "text-slate-800 dark:text-slate-300";
        default:
            return "text-gray-800 dark:text-gray-300";
    }
};

const getStatusIndicator = (status: StatusType) => {
    switch (status) {
        case "valid":
            return "bg-green-500 rounded-full";
        case "invalid":
            return "bg-red-500 rounded-full";
        case "testing":
            return "bg-blue-500 rounded-full";
        case "untested":
            return "bg-slate-500 rounded-full";
        default:
            return "bg-gray-500 rounded-full";
    }
};

const getLookupParts = (expr: Expression) => {
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

const JoinIcon = () => (
    <div className="w-10 h-10 rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    </div>
);

const pillBase =
    "px-2.5 py-1 rounded-md text-sm font-medium whitespace-nowrap";
const tablePill =
    "bg-blue-500 text-white dark:bg-blue-500/30";
const fieldPill =
    "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100";
const opText = "text-slate-500 dark:text-slate-400 text-sm mx-1";

const highlightBooleanOps = (text: string) => {
    // split but keep the delimiters
    const parts = text.split(/(\bAND\b|\bOR\b)/gi);
    return parts.map((p, i) => {
        const up = p.toUpperCase();
        if (up === "AND") {
            return (
                <span key={i} className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold">
                    AND
                </span>
            );
        }
        if (up === "OR") {
            return (
                <span key={i} className="text-amber-600 dark:text-amber-400 font-semibold">
                    OR
                </span>
            );
        }
        return <span key={i}>{p}</span>;
    });
};


export default function DefinitionDetails() {
    const { definitionId } = useParams<{ definitionId: string }>();
    const [config, setConfig] = useState<MigrationConfig | null>(null);
    const [definition, setDefinition] = useState<JobDefinition | null>(null);
    const [loading, setLoading] = useState(true);
    const [mappingQuery, setMappingQuery] = useState("");

    useEffect(() => {
        const fetchDefinition = async () => {
            if (!definitionId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const data = await apiClient.getJobDefinition(definitionId);
                const migrationItem = JSON.parse(data.ast)['migration']['migrate_items'][0] as MigrateItemDTO;

                const migrationConfig: MigrationConfig = {
                    name: data.name,
                    description: data.description,
                    migration: {
                        settings: {
                            batchSize: migrationItem.settings.batch_size,
                            csvHeader: migrationItem.settings.csv_header,
                            copyColumns: migrationItem.settings.copy_columns,
                            inferSchema: migrationItem.settings.infer_schema,
                            csvDelimiter: migrationItem.settings.csv_delimiter,
                            csvIdColumn: migrationItem.settings.csv_id_column,
                            cascadeSchema: migrationItem.settings.cascade_schema,
                            ignoreConstraints: migrationItem.settings.ignore_constraints,
                            createMissingTables: migrationItem.settings.create_missing_tables,
                            createMissingColumns: migrationItem.settings.create_missing_columns
                        },
                        migrateItems: [getMigrationItem(migrationItem)],
                    },
                    connections: {
                        source: {
                            id: data.sourceConnection.id,
                            name: data.sourceConnection.name,
                            dataFormat: data.sourceConnection.dataFormat,
                            database: data.sourceConnection.dbName,
                            status: data.sourceConnection.status,
                            host: data.sourceConnection.host,
                            port: data.sourceConnection.port,
                            user: data.sourceConnection.username,
                            description: `${data.sourceConnection.dataFormat} - ${data.sourceConnection.host}:${data.sourceConnection.port}`
                        },
                        dest: {
                            id: data.destinationConnection.id,
                            name: data.destinationConnection.name,
                            dataFormat: data.destinationConnection.dataFormat,
                            database: data.destinationConnection.dbName,
                            status: data.destinationConnection.status,
                            host: data.destinationConnection.host,
                            port: data.destinationConnection.port,
                            user: data.destinationConnection.username,
                            description: `${data.destinationConnection.dataFormat} - ${data.destinationConnection.host}:${data.destinationConnection.port}`
                        }
                    },
                    creation_date: data.createdAt instanceof Date ? data.createdAt.toISOString() : new Date(data.createdAt).toISOString(),
                };
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active":
                return <CheckCircle className="text-green-600 dark:text-green-400" size={20} />;
            case "inactive":
                return <XCircle className="text-red-600 dark:text-red-400" size={20} />;
            case "paused":
                return <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />;
            default:
                return <Clock className="text-slate-600 dark:text-slate-400" size={20} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
            case "inactive":
                return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
            case "paused":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
            default:
                return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400";
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
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Migration Definition Not Found
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    The requested migration definition could not be found.
                </p>
                <Link to="/definitions">
                    <Button>
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Definitions
                    </Button>
                </Link>
            </div>
        );
    }

    const sourceConnection = definition.sourceConnection;
    const destinationConnection = definition.destinationConnection;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/definitions">
                        <Button variant="ghost">
                            <ArrowLeft size={16} className="mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-[24px] font-bold leading-tight text-slate-900 dark:text-white">
                            {definition.name}
                        </h1>
                        <p className="text-slate-700 dark:text-slate-300">
                            Migration Definition Details
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Link to={`/wizard?edit=${definition.id}`}>
                        <Button variant="primary">
                            <Edit size={16} className="mr-2" />
                            Edit Definition
                        </Button>
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
                        <div className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                            {"active"}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Current state
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Source</CardTitle>
                        {sourceConnection && getConnectionIcon(sourceConnection.dataFormat)}
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                            {sourceConnection?.name || "Not configured"}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            {sourceConnection?.dataFormat || "No connection"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Destination</CardTitle>
                        {destinationConnection && getConnectionIcon(destinationConnection.dataFormat)}
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                            {destinationConnection?.name || "Not configured"}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            {destinationConnection?.dataFormat || "No connection"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Created</CardTitle>
                        <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                            {definition.createdAt ? format(new Date(definition.createdAt), "MMM d") : "Unknown"}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            {definition.createdAt ? format(new Date(definition.createdAt), "yyyy") : ""}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Information */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList
                    className={cn(
                        "w-fit rounded-xl bg-slate-100 dark:bg-slate-800 p-1",
                        "border border-slate-200 dark:border-slate-700"
                    )}
                >
                    {[
                        { value: "overview", label: "Overview" },
                        { value: "source", label: "Source" },
                        { value: "mapping", label: "Mapping" },
                        { value: "settings", label: "Settings" },
                    ].map(({ value, label }) => (
                        <TabsTrigger
                            key={value}
                            value={value}
                            data-testid={`tab-${value}`}
                            className={cn(
                                "px-3.5 text-sm font-medium rounded-xl transition-all",
                                "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
                                "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900",
                                "data-[state=active]:text-slate-900 dark:data-[state=active]:text-white",
                                "data-[state=active]:shadow-sm"
                            )}
                        >
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="overview">
                    {/* Description */}
                    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2 font-semibold">
                                <FileText className="text-slate-600 dark:text-slate-400" size={20} />
                                <span>Description</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700 dark:text-slate-300">
                                {definition.description || "No description provided"}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Connection Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 ">
                        <Card className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800/50 p-4">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    {getConnectionIcon(sourceConnection?.dataFormat || "MySQL")}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{sourceConnection?.name || "mysql sakila"}</h3>
                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded font-medium">
                                                {dataFormatLabels[sourceConnection?.dataFormat || "MySQL"]}
                                            </span>
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
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
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
                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded font-medium">
                                                {dataFormatLabels[destinationConnection?.dataFormat || "MySQL"]}
                                            </span>
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
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">User:</span>
                                        <span className="text-sm text-slate-900 dark:text-white font-mono">user</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Migration Statistics */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Source Tables</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{(config?.migration.migrateItems[0].load?.entities?.length ?? 0) + 1}</p>
                                        <p className="text-xs text-slate-500 mt-1">Primary: {config?.migration.migrateItems[0].source.names[0]}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                        </svg>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Column Mappings</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {(config?.migration.migrateItems[0].map?.mappings.length ?? 0) + 1}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">Across {(config?.migration.migrateItems[0].load?.entities?.length ?? 0) + 1} tables</p>
                                    </div>
                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Joins</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{config?.migration.migrateItems[0].load?.entities?.length}</p>
                                        <p className="text-xs text-slate-500 mt-1">Related tables</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="source">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60">
                            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 flex items-center gap-2 rounded-md border border-blue-100 dark:border-blue-800">
                                <Table className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="font-medium text-blue-700 dark:text-blue-300">
                                    {config?.migration.migrateItems[0].source?.names[0]}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">Primary Table</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                    Filters: {config?.migration.migrateItems[0].filter.expression ? 1 : 0}
                                </Badge>
                                <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                    Joins: {config?.migration.migrateItems[0].load?.matches?.length ?? 0}
                                </Badge>
                            </div>
                        </div>
                        <div className="p-4 md:p-5 space-y-6">
                            {/* Filters */}
                            <section>
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters</h5>
                                </div>

                                {config?.migration.migrateItems[0].filter.expression ? (
                                    <div className="relative rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                                        <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-500 rounded-l-lg" />
                                        <div className="pl-4 pr-3 py-3 md:pl-5">
                                            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                                                Where
                                            </div>
                                            <pre className="text-sm font-mono text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words">
                                                {highlightBooleanOps(renderExpression(config.migration.migrateItems[0].filter.expression))}
                                            </pre>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400">
                                        No filters defined.
                                    </div>
                                )}
                            </section>

                            {/* Joins */}
                            <section>
                                <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Joins</h5>

                                {config?.migration.migrateItems[0].load?.matches?.length ? (
                                    <div className="space-y-2">
                                        {config.migration.migrateItems[0].load.matches.map((join, idx) => {
                                            const L = getLookupParts(join.left);
                                            const R = getLookupParts(join.right);
                                            const leftField = L.isLookup ? (L.column || L.raw) : L.raw;
                                            const rightField = R.isLookup ? (R.column || R.raw) : R.raw;

                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2 flex-wrap rounded-lg px-3 py-2 border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/20"
                                                >
                                                    {/* table A */}
                                                    <span className={`${pillBase} ${tablePill}`} title={L.table || leftField}>
                                                        {L.table || leftField}
                                                    </span>

                                                    {/* join icon */}
                                                    <JoinIcon />

                                                    {/* table B */}
                                                    <span className={`${pillBase} ${tablePill}`} title={R.table || rightField}>
                                                        {R.table || rightField}
                                                    </span>

                                                    <span className={opText}>where</span>

                                                    {/* condition */}
                                                    <span className={`${pillBase} ${fieldPill}`} title={leftField}>
                                                        {leftField}
                                                    </span>
                                                    <span className="text-rose-500 dark:text-rose-400 font-semibold mx-1">=</span>
                                                    <span className={`${pillBase} ${fieldPill}`} title={rightField}>
                                                        {rightField}
                                                    </span>

                                                    {/* optional: join type tag (default INNER) */}
                                                    <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                        INNER
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400">
                                        No joins configured.
                                    </div>
                                )}
                            </section>

                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="mapping">
                    <div className="space-y-6">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                    >
                                        {config?.migration.migrateItems[0].source.names[0]}
                                    </Badge>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Column Mappings
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {(config?.migration.migrateItems[0].map?.mappings?.length ?? 0)} total
                                    </span>
                                </div>

                                {/* Search */}
                                <div className="relative">
                                    <input
                                        value={mappingQuery}
                                        onChange={(e) => setMappingQuery(e.target.value)}
                                        placeholder="Search columns…"
                                        className="h-8 w-52 rounded-md bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-3 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <colgroup>
                                        <col className="w-[45%]" />
                                        <col className="w-[10%]" />
                                        <col className="w-[45%]" />
                                    </colgroup>

                                    <thead className="sticky top-0 z-[1] bg-gray-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                                                Source Column
                                            </th>
                                            <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">
                                                {/* arrow col */}
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                                                Destination Column
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {(Object.entries(config?.migration.migrateItems[0].map.mappings ?? [])
                                            .filter(([_, m]) => {
                                                const src = renderExpression(m.source).toLowerCase();
                                                const dst = (m.target ?? "").toLowerCase();
                                                const q = mappingQuery.trim().toLowerCase();
                                                return !q || src.includes(q) || dst.includes(q);
                                            }) as Array<[string, { source: Expression; target: string }]>).map(
                                                ([key, m], idx) => (
                                                    <tr
                                                        key={key ?? idx}
                                                        className="hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-colors"
                                                    >
                                                        <td className="px-4 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                {/* tiny badge to hint if it's derived (function/arithmetic/condition) */}
                                                                {!isLookup(m.source) && !isIdentifier(m.source) && !isLiteral(m.source) ? (
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                                                                        Expr
                                                                    </span>
                                                                ) : null}
                                                                <span
                                                                    title={renderExpression(m.source)}
                                                                    className="font-mono text-slate-700 dark:text-slate-300 block truncate"
                                                                >
                                                                    {renderExpression(m.source)}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-2.5 text-center text-slate-400">→</td>

                                                        <td className="px-4 py-2.5">
                                                            <span
                                                                title={m.target}
                                                                className="font-mono font-medium text-slate-900 dark:text-white block truncate"
                                                            >
                                                                {m.target}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                    </tbody>
                                </table>

                                {/* Empty state on filter */}
                                {mappingQuery &&
                                    (Object.entries(config?.migration.migrateItems[0].map.mappings ?? []).filter(([_, m]) => {
                                        const src = renderExpression(m.source).toLowerCase();
                                        const dst = (m.target ?? "").toLowerCase();
                                        const q = mappingQuery.trim().toLowerCase();
                                        return !q || src.includes(q) || dst.includes(q);
                                    }).length === 0) && (
                                        <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
                                            No mappings match “{mappingQuery}”.
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="settings">
                    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-[20px] font-semibold">
                                <Settings className="text-slate-600 dark:text-slate-400" size={20} />
                                <span>Migration Settings</span>
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            {(() => {
                                const s = config?.migration.migrateItems[0].settings;
                                const rows =
                                    s
                                        ? [
                                            {
                                                key: "batchSize",
                                                label: "Batch Size",
                                                value: `${s.batchSize} rows`,
                                                desc:
                                                    "Number of records processed in each batch. Larger batches improve performance but use more memory.",
                                                icon: (
                                                    <FileStackIcon size={14} />
                                                ),
                                            },
                                            {
                                                key: "copyColumns",
                                                label: "Copy Columns",
                                                value: s.copyColumns === "All" ? "All" : "Mapped Only",
                                                desc: "Controls which columns are copied to the target system.",
                                                icon: (
                                                    <ColumnsIcon size={14} />
                                                ),
                                            },
                                            {
                                                key: "inferSchema",
                                                label: "Infer Schema",
                                                value: s.inferSchema,
                                                desc: "Automatically infer the database schema from the source data.",
                                                icon: (
                                                    <Table2Icon size={14} />
                                                ),
                                            },
                                            {
                                                key: "cascadeSchema",
                                                label: "Cascade Schema",
                                                value: s.cascadeSchema,
                                                desc: "Automatically create related tables in the target schema.",
                                                icon: (
                                                    <BrickWallIcon size={14} />
                                                ),
                                            },
                                            {
                                                key: "ignoreConstraints",
                                                label: "Ignore Constraints",
                                                value: s.ignoreConstraints,
                                                desc: "Ignore database constraints during migration.",
                                                icon: (
                                                    <ConstructionIcon size={14} />
                                                ),
                                            },
                                            {
                                                key: "createMissingTables",
                                                label: "Create Missing Tables",
                                                value: s.createMissingTables,
                                                desc: "Create tables in the target schema if they don't exist.",
                                                icon: (
                                                    <TableConfigIcon size={14} />
                                                ),
                                            },
                                        ]
                                        : [];

                                const BoolPill = ({ on }: { on: boolean }) => (
                                    <span
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border",
                                            on
                                                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                                                : "bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                        )}
                                    >
                                        <span className={cn("w-1.5 h-1.5 rounded-full", on ? "bg-green-500" : "bg-slate-500")} />
                                        {on ? "Enabled" : "Disabled"}
                                    </span>
                                );

                                return (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {rows.map((r) => (
                                            <div
                                                key={r.key}
                                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
                                            >
                                                <dl className="space-y-1.5">
                                                    <dt className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                                        <span className="text-slate-500 dark:text-slate-400">{r.icon}</span>
                                                        {r.label}
                                                    </dt>
                                                    <dd className="text-base font-mono font-medium">
                                                        {typeof r.value === "boolean" ? (
                                                            <BoolPill on={r.value} />
                                                        ) : (
                                                            <span className="text-blue-700 dark:text-blue-300">{r.value}</span>
                                                        )}
                                                    </dd>
                                                    <dd className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{r.desc}</dd>
                                                </dl>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}