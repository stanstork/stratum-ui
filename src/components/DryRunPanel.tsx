import { AlertTriangle, ArrowRight, BarChart, CheckCircle, ChevronLeft, ChevronRight, Code2, Copy, CopyIcon, Database, Download, FileOutput, FileText, FunctionSquare, GitBranch, GitMerge, List, Map, Play, RefreshCw, Settings, ShieldAlert, TestTube2, Trash2, TrendingUp, XCircle, Zap } from "lucide-react";
import { DryRunReport, FieldValue, Finding, GeneratedSqlStatement, TransformedRecord } from "../types/DryRun";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./common/Dialog";
import { Badge } from "./common/v2/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "./common/v2/Card";
import { Label } from "./common/v2/Label";
import { Button } from "./common/v2/Button";
import { useEffect, useMemo, useState } from "react";
import Select from "./common/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./common/v2/Tabs";
import { cn } from "../utils/utils";

interface DryRunConfig {
    sampleSize: number;
}

interface DryRunPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    result?: DryRunReport;
    isLoading: boolean;
    onRunDryRun?: (config: DryRunConfig) => void;
    canRunMigration?: boolean;
    onRunMigration?: () => void;
    showConfigChanged?: boolean;
    showControls?: boolean;
}

const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
        case 'error':
            return <XCircle className="w-5 h-5 text-red-500" />;
        case 'warning':
            return <AlertTriangle className="w-5 h-5 text-amber-500" />;
        case 'info':
        default:
            return <CheckCircle className="w-5 h-5 text-blue-500" />;
    }
};

const getSeverityClassNames = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
        case 'error':
            return {
                bg: "bg-red-50 dark:bg-red-900/20",
                border: "border-red-200 dark:border-red-800/50",
                text: "text-red-800 dark:text-red-200",
                icon: "text-red-500",
            };
        case 'warning':
            return {
                bg: "bg-amber-50 dark:bg-amber-900/20",
                border: "border-amber-200 dark:border-amber-800/50",
                text: "text-amber-800 dark:text-amber-200",
                icon: "text-amber-500",
            };
        case 'info':
        default:
            return {
                bg: "bg-blue-50 dark:bg-blue-900/20",
                border: "border-blue-200 dark:border-blue-800/50",
                text: "text-blue-800 dark:text-blue-200",
                icon: "text-blue-500",
            };
    }
};

const DryRunPanel: React.FC<DryRunPanelProps> = ({
    open,
    onOpenChange,
    result,
    isLoading,
    onRunDryRun,
    canRunMigration = true,
    onRunMigration,
    showConfigChanged = false,
    showControls = true
}) => {
    const [config, setConfig] = useState<DryRunConfig>({ sampleSize: 10 });
    const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
    const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

    const itemNames = useMemo(() => (result ? Object.keys(result) : []), [result]);

    useEffect(() => {
        // When a new report comes in, select the first item by default
        if (itemNames.length > 0 && !itemNames.includes(selectedItemName || '')) {
            setSelectedItemName(itemNames[0]);
        } else if (itemNames.length === 0) {
            setSelectedItemName(null);
        }
        setCurrentRecordIndex(0); // Reset record index on new report
    }, [result]);

    const handleRunDryRun = () => {
        setCurrentRecordIndex(0);
        onRunDryRun?.(config);
    };

    const handleItemChange = (newItemName: string) => {
        setSelectedItemName(newItemName);
        setCurrentRecordIndex(0); // Reset to first record when switching items
    };

    const reportEntity = useMemo(() => {
        if (!result || !selectedItemName) return null;
        return result[selectedItemName];
    }, [result, selectedItemName]);

    const findings = useMemo(() => {
        if (!reportEntity?.schemaValidation?.findings) return { errors: [], warnings: [], infos: [] };
        const errors = reportEntity.schemaValidation.findings.filter(f => f.severity === 'error');
        const warnings = reportEntity.schemaValidation.findings.filter(f => f.severity === 'warning');
        const infos = reportEntity.schemaValidation.findings.filter(f => f.severity === 'info');
        return { errors, warnings, infos };
    }, [reportEntity]);

    const hasErrors = (findings.errors?.length ?? 0) > 0;

    const { hasAnyErrorsInReport, totalErrorCount } = useMemo(() => {
        if (!result) {
            return { hasAnyErrorsInReport: false, totalErrorCount: 0 };
        }
        let totalErrors = 0;
        for (const entity of Object.values(result)) {
            const errorCount = entity.schemaValidation?.findings?.filter(f => f.severity === 'error').length ?? 0;
            totalErrors += errorCount;
        }
        return {
            hasAnyErrorsInReport: totalErrors > 0,
            totalErrorCount: totalErrors,
        };
    }, [result]);

    const { schemaStatements, dataStatements } = useMemo(() => {
        const statements = reportEntity?.generatedSql.statements ?? [];
        return {
            schemaStatements: statements.filter(s => s.kind === 'schema'),
            dataStatements: statements.filter(s => s.kind === 'data'),
        }
    }, [reportEntity]);

    const currentRecord = reportEntity?.transform?.sample?.[currentRecordIndex];

    const downloadJson = () => {
        if (!result) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "dry_run_report.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl">
                <DialogHeader className="flex-shrink-0 p-6 pb-4 bg-slate-50 dark:bg-slate-900 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <TestTube2 className="w-6 h-6 text-primary" />
                            <span>Dry Run Analysis</span>
                            {showConfigChanged && (
                                <Badge
                                    variant="outline"
                                    className="border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                                >
                                    Configuration changed since last dry run
                                </Badge>
                            )}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="space-y-6">
                        {showControls && (
                            <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center space-x-2 text-slate-900 dark:text-white">
                                        <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                        <span>Analysis Configuration</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sample-size" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Sample Size
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={config.sampleSize.toString()}
                                                    onChange={(e) => setConfig((prev) => ({ ...prev, sampleSize: parseInt(e.target.value, 10) }))}
                                                    options={[
                                                        { value: "10", label: "10 records" },
                                                        { value: "50", label: "50 records" },
                                                        { value: "100", label: "100 records" }
                                                    ]}
                                                />
                                                <Button onClick={handleRunDryRun} disabled={isLoading} variant="primary">
                                                    {isLoading ? (
                                                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running...</>
                                                    ) : (
                                                        <><Play className="w-4 h-4 mr-2" /> Run Dry Run</>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center space-y-3">
                                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                                    <p className="text-lg font-medium">Analyzing migration configuration...</p>
                                    <p className="text-sm text-gray-600">This may take a few moments</p>
                                </div>
                            </div>
                        )}

                        {/* Results Section */}
                        {result && !isLoading && (
                            <>
                                {itemNames.length > 1 && (
                                    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                                        <CardHeader><CardTitle className="text-lg flex items-center space-x-2 text-slate-900 dark:text-white"><FileText className="w-5 h-5" /><span>Select Migration Item</span></CardTitle></CardHeader>
                                        <CardContent>
                                            <Select
                                                value={selectedItemName || ''}
                                                onChange={(e) => handleItemChange(e.target.value)}
                                                options={itemNames.map(name => ({ value: name, label: name }))}
                                            />
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Select an item to view its detailed dry run report.</p>
                                        </CardContent>
                                    </Card>
                                )}
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                                            {hasErrors ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                                        </CardHeader>
                                        <CardContent>
                                            <div className={`text-2xl font-bold ${hasErrors ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                {(reportEntity?.summary?.status === 'failure' || hasErrors) ? 'Failure' : 'Success'}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Source → Destination</CardTitle>
                                            <Database className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-lg font-bold">
                                                {reportEntity
                                                    ? `${reportEntity.summary.source.database.dialect} → ${reportEntity.summary.destination.database.dialect}`
                                                    : "N/A"}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {reportEntity
                                                    ? `${reportEntity.summary.recordsSampled} records sampled`
                                                    : ""}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Mapping</CardTitle>
                                            <Map className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {reportEntity?.mapping?.totals?.entities ?? 0} {reportEntity?.mapping?.totals?.entities === 1 ? "entity" : "entities"}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {reportEntity?.mapping?.totals?.mappedFields ?? 0} mapped
                                                {reportEntity?.mapping?.totals?.mappedFields === 1 ? " field" : " fields"}
                                                {reportEntity?.mapping?.totals?.computedFields
                                                    ? `, ${reportEntity.mapping.totals.computedFields} computed`
                                                    : ""}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Schema Actions</CardTitle>
                                            <GitBranch className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{reportEntity?.schema?.actions?.length ?? 0}</div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">changes will be executed</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Detailed Tabs */}
                                <Tabs defaultValue="findings" className="space-y-6">
                                    <TabsList className="w-fit rounded-xl bg-slate-200/60 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                                        {[
                                            { value: "findings", label: `Findings (${findings.errors.length + findings.warnings.length + findings.infos.length})` },
                                            { value: "mapping", label: `Mapping (${reportEntity?.mapping?.entities?.length ?? 0})` },
                                            { value: "sql", label: "Generated SQL" },
                                            { value: "transform", label: "Transform Sample" },
                                        ].map(({ value, label }) => (
                                            <TabsTrigger key={value} value={value}
                                                className={cn(
                                                    "px-3.5 text-sm font-medium rounded-lg transition-all",
                                                    "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
                                                    "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900",
                                                    "data-[state=active]:text-slate-900 dark:data-[state=active]:text-white",
                                                    "data-[state=active]:shadow-sm"
                                                )}>
                                                {label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    <TabsContent value="findings">
                                        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                                                    <ShieldAlert
                                                        className={`w-5 h-5 ${findings.errors.length + findings.warnings.length + findings.infos.length > 0
                                                            ? "text-yellow-600 dark:text-yellow-400"
                                                            : "text-green-600 dark:text-green-400"
                                                            }`}
                                                    />
                                                    <span>Schema Validation Findings</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {findings.errors.length === 0 && findings.warnings.length === 0 && findings.infos.length === 0 ? (
                                                        <div className="text-center py-8">
                                                            <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
                                                            <p className="mt-2 text-lg font-semibold text-green-700 dark:text-green-400">
                                                                No schema validation findings detected.
                                                            </p>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                Your migration configuration passed all checks.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {findings.errors.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <h3 className="font-semibold text-red-600 dark:text-red-400">Errors ({findings.errors.length})</h3>
                                                                    {findings.errors.map((finding, i) => <FindingCard key={i} finding={finding} />)}
                                                                </div>
                                                            )}
                                                            {findings.warnings.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <h3 className="font-semibold text-amber-600 dark:text-amber-400">Warnings ({findings.warnings.length})</h3>
                                                                    {findings.warnings.map((finding, i) => <FindingCard key={i} finding={finding} />)}
                                                                </div>
                                                            )}
                                                            {findings.infos.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <h3 className="font-semibold text-blue-600 dark:text-blue-400">Info ({findings.infos.length})</h3>
                                                                    {findings.infos.map((finding, i) => <FindingCard key={i} finding={finding} />)}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="mapping" className="space-y-6">
                                        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                                                    <Map className="w-5 h-5 text-primary" />
                                                    <span>Entity Mapping Details</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                                    <StatBox value={reportEntity?.mapping.totals.entities ?? 0} label="Entities" icon={<Database className="w-5 h-5" />} />
                                                    <StatBox value={reportEntity?.mapping.totals.mappedFields ?? 0} label="Renames" icon={<BarChart className="w-5 h-5" />} />
                                                    <StatBox value={reportEntity?.mapping.totals.computedFields ?? 0} label="Computed Fields" icon={<FunctionSquare className="w-5 h-5" />} />
                                                    <StatBox value={reportEntity?.mapping.totals.lookupCount ?? 0} label="Lookups" icon={<GitMerge className="w-5 h-5" />} />
                                                </div>

                                                <div className="space-y-4 mt-4">
                                                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                                        <Database className="w-5 h-5 text-primary" />
                                                        <span>Entity Mappings</span>
                                                    </h3>
                                                    {reportEntity?.mapping?.entities
                                                        ?.filter(entity => entity.mappedFields > 0 || (entity.computed?.length ?? 0) > 0 || (entity.renames?.length ?? 0) > 0 || (entity.oneToOne?.length ?? 0) > 0 || (entity.omittedSourceColumns?.length ?? 0) > 0)
                                                        .map((entity, i) => (
                                                            <Card key={i} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
                                                                <div className="p-4">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <Badge variant="outline" className="bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-300">{entity.sourceEntity}</Badge>
                                                                                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                                                <Badge variant="outline" className="bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-300">{entity.destEntity}</Badge>
                                                                            </div>
                                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                                                {entity.mappedFields} mapped fields &bull; {entity.computed?.length ?? 0} computed fields &bull; {entity.renames?.length ?? 0} renames &bull; {entity.oneToOne?.length ?? 0} direct copies &bull; {entity.omittedSourceColumns?.length ?? 0} omitted fields
                                                                            </p>
                                                                        </div>
                                                                        <Badge variant="secondary">Copy Policy: {entity.copyPolicy}</Badge>
                                                                    </div>
                                                                    {(entity.renames?.length > 0 || entity.computed?.length > 0 || entity.oneToOne?.length > 0 || entity.omittedSourceColumns?.length > 0) && (
                                                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/60 space-y-3">
                                                                            {entity.oneToOne?.length > 0 && (
                                                                                <div>
                                                                                    <h5 className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                                                                        <CopyIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                                                                        Direct Copies
                                                                                    </h5>
                                                                                    <div className="flex flex-wrap gap-1.5">
                                                                                        {entity.oneToOne.map(col => (
                                                                                            <div key={col} className="px-2 py-1 rounded-md bg-teal-50 dark:bg-teal-900/20 font-mono text-xs text-teal-900 dark:text-teal-200 border border-teal-100 dark:border-teal-800/50">
                                                                                                {col}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {entity.renames?.length > 0 && (
                                                                                <div>
                                                                                    <h5 className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                                                                        <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                                                                        Field Renames
                                                                                    </h5>
                                                                                    <div className="space-y-1">
                                                                                        {entity.renames.map(r => (
                                                                                            <div key={r.from} className="px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/20 font-mono text-xs text-amber-900 dark:text-amber-200 border border-amber-100 dark:border-amber-800/50">
                                                                                                {r.from} <span className="text-amber-500 mx-1">→</span> {r.to}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {entity.computed?.length > 0 && (
                                                                                <div>
                                                                                    <h5 className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                                                                        <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                                                                        Computed Fields
                                                                                    </h5>
                                                                                    <div className="space-y-1">
                                                                                        {entity.computed.map(c => (
                                                                                            <div key={c.name} className="px-3 py-2 rounded-md bg-purple-50 dark:bg-purple-900/20 font-mono text-xs text-purple-900 dark:text-purple-200 border border-purple-100 dark:border-purple-800/50">
                                                                                                <p className="font-bold">{c.name}</p>
                                                                                                <p className="text-purple-600 dark:text-purple-300">{c.expressionPreview}</p>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {entity.omittedSourceColumns?.length > 0 && (
                                                                                <div>
                                                                                    <h5 className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                                                                        <Trash2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                                                                        Omitted Columns
                                                                                    </h5>
                                                                                    <div className="flex flex-wrap gap-1.5">
                                                                                        {entity.omittedSourceColumns.map(col => (
                                                                                            <div key={col} className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                                                {col}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Card>
                                                        ))}
                                                </div>

                                                {/* <div className="space-y-4">
                                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                                <Search className="w-5 h-5 text-primary" />
                                                <span>Lookup Operations</span>
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {reportEntity?.mapping?.lookups?.map((lookup, i) => (
                                                    <div key={i} className="p-4 rounded-lg bg-green-50/60 dark:bg-green-900/20 border border-green-200 dark:border-green-700/60 text-sm">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant="outline" className="bg-white border-green-200 text-green-800 dark:bg-slate-800 dark:border-green-800/50 dark:text-green-300">{lookup.sourceEntity}</Badge>
                                                            <ArrowRight className="w-4 h-4 text-green-500" />
                                                            <Badge variant="outline" className="bg-white border-green-200 text-green-800 dark:bg-slate-800 dark:border-green-800/50 dark:text-green-300">{lookup.entity}</Badge>
                                                        </div>
                                                        <div className="font-mono text-xs text-green-900 dark:text-green-200 space-y-1">
                                                            <p><span className="text-slate-500 dark:text-slate-400">Key:</span> {lookup.key}</p>
                                                            <p><span className="text-slate-500 dark:text-slate-400">Target:</span> {lookup.target}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div> */}

                                                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/60">
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Mapping Hash</p>
                                                    <p className="font-mono text-xs text-slate-500 dark:text-slate-500 mt-1 break-all bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                                                        {reportEntity?.mapping?.mappingHash ?? "N/A"}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                    </TabsContent>
                                    <TabsContent value="sql">
                                        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                                                    <Code2 className="w-5 h-5 text-primary" />
                                                    <span>Generated SQL Statements</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <Tabs defaultValue="schema" className="w-full">
                                                    <TabsList className="w-fit rounded-xl bg-slate-200/60 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                                                        <TabsTrigger value="schema" className={cn(
                                                            "px-3.5 text-sm font-medium rounded-lg transition-all",
                                                            "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
                                                            "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900",
                                                            "data-[state=active]:text-slate-900 dark:data-[state=active]:text-white",
                                                            "data-[state=active]:shadow-sm"
                                                        )}>Schema DDL</TabsTrigger>
                                                        <TabsTrigger value="data" className={cn(
                                                            "px-3.5 text-sm font-medium rounded-lg transition-all",
                                                            "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
                                                            "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900",
                                                            "data-[state=active]:text-slate-900 dark:data-[state=active]:text-white",
                                                            "data-[state=active]:shadow-sm"
                                                        )}>Data Queries</TabsTrigger>
                                                    </TabsList>
                                                    <TabsContent value="schema" className="mt-4 space-y-4">
                                                        {schemaStatements.length > 0 ? (
                                                            schemaStatements.map((stmt, i) => <SqlStatement key={i} statement={stmt} />)
                                                        ) : (
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No Schema DDL statements were generated.</p>
                                                        )}
                                                    </TabsContent>
                                                    <TabsContent value="data" className="mt-4 space-y-4">
                                                        {dataStatements.length > 0 ? (
                                                            dataStatements.map((stmt, i) => <SqlStatement key={i} statement={stmt} />)
                                                        ) : (
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No Data Query statements were generated.</p>
                                                        )}
                                                    </TabsContent>
                                                </Tabs>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                    <TabsContent value="transform">
                                        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <CardTitle>
                                                        <TrendingUp className="w-5 h-5 text-primary inline-block mr-2" />
                                                        Transform Sample
                                                        <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
                                                            {reportEntity?.transform?.sample
                                                                ? `Showing record ${currentRecordIndex + 1} of ${reportEntity.transform.sample.length}`
                                                                : "No transformation sample available"}
                                                        </p>
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="icon" onClick={() => setCurrentRecordIndex(p => Math.max(0, p - 1))} disabled={currentRecordIndex === 0}>
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() =>
                                                                setCurrentRecordIndex(p =>
                                                                    Math.min(
                                                                        ((reportEntity?.transform?.sample?.length ?? 1) - 1),
                                                                        p + 1
                                                                    )
                                                                )
                                                            }
                                                            disabled={currentRecordIndex === ((reportEntity?.transform?.sample?.length ?? 1) - 1)}
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {currentRecord && <TransformRecordView record={currentRecord} />}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}
                    </div>

                    <div className="flex-shrink-0 flex items-center justify-between space-x-4 mt-6">
                        <Button variant="ghost" onClick={downloadJson} disabled={!result}>
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                        </Button>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" onClick={handleRunDryRun} disabled={isLoading}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? 'Running...' : 'Re-run Analysis'}
                            </Button>
                            <Button
                                variant={hasAnyErrorsInReport ? "destructive" : "primary"}
                                onClick={onRunMigration}
                                disabled={!canRunMigration || hasAnyErrorsInReport}
                                title={hasAnyErrorsInReport ? "Cannot run migration due to errors in the dry run." : ""}
                            >
                                <Play className="w-4 h-4 mr-2" />
                                {hasAnyErrorsInReport ? `Cannot Run (${totalErrorCount} errors)` : 'Run Migration'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog >

    );
};

const StatBox: React.FC<{ value: number; label: string; icon: React.ReactNode }> = ({ value, label, icon }) => (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="text-blue-600 dark:text-blue-400 mb-2">{icon}</div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
);

const FindingCard: React.FC<{ finding: Finding }> = ({ finding }) => {
    const classes = getSeverityClassNames(finding.severity);
    return (
        <div className={cn("p-4 rounded-lg border flex items-start gap-4", classes.bg, classes.border)}>
            <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(finding.severity)}</div>
            <div className="flex-1">
                <p className={cn("font-semibold", classes.text)}>{finding.code}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{finding.message}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kind: {finding.kind}</p>
            </div>
        </div>
    );
};

const SqlStatement: React.FC<{ statement: GeneratedSqlStatement }> = ({ statement }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        let textToCopy = statement.sql;
        if (statement.params) {
            textToCopy += `\n\nParameters: ${JSON.stringify(statement.params)}`;
        }
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700/60">
                <Badge variant="outline">{statement.dialect}</Badge>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
            </div>
            <div className="p-4">
                <pre className="text-sm font-mono text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-all">
                    <code>{statement.sql}</code>
                </pre>
                {statement.params && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-pre-wrap break-all">
                        Parameters: {JSON.stringify(statement.params)}
                    </p>
                )}
            </div>
        </div>
    );
};

const TransformRecordView: React.FC<{ record: TransformedRecord }> = ({ record }) => {
    const outputFields = record.output.fieldValues;

    return (
        <div>
            <div className="mb-6">
                <Database className="w-5 h-5 text-primary inline-block mr-2" />
                <span className="text-lg font-bold text-slate-900 dark:text-white">{record.output.entity}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outputFields.map(field => {
                    return (
                        <FieldRow
                            key={field.name}
                            field={field}
                            bgColor={"bg-slate-50 dark:bg-slate-800/50"}
                            isNew={false}
                        />
                    );
                })}
            </div>
        </div>
    );
}

const FieldRow: React.FC<{ field: FieldValue; bgColor: string; isNew?: boolean }> = ({ field, bgColor, isNew = false }) => {
    // field.value is always { type: actualValue }
    const entries = Object.entries(field.value || {});
    const [type, val] = entries.length > 0 ? entries[0] : ["Unknown", ""];

    return (
        <div key={field.name} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-[1.005] duration-200 transition-all">
            <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{field.name}</span>
                <Badge variant="outline" className="text-xs">
                    {field.dataType}
                </Badge>
            </div>
            <p className="font-mono text-sm text-slate-700 dark:text-slate-300 truncate">
                {val === null || val === undefined ? <span className="text-slate-400 italic">null</span> : String(val)}
            </p>
        </div>
    );
};

export default DryRunPanel;