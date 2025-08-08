import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Cloud,
    Database as DbIcon,
    FolderOpen,
    Globe,
    HardDrive,
    Settings,
    Zap,
} from "lucide-react";
import { Connection, createConnectionString, StatusType } from "../../types/Connection";
import apiClient from "../../services/apiClient";
import Input from "../../components/common/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/common/v2/Card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/common/v2/Select";
import { Button } from "../../components/common/v2/Button";
import { Badge } from "../../components/common/v2/Badge";
import { Label } from "../../components/common/v2/Label";

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between">
                <Label htmlFor={htmlFor}>{label}</Label>
                {hint && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
            </div>
            {children}
        </div>
    );
}

function FieldRow({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function TextField({ id, label, placeholder, value, onChange, type = "text", hint }: any) {
    return (
        <Field label={label} htmlFor={id} hint={hint}>
            <Input id={id} type={type} placeholder={placeholder} value={value} onChange={(e) => onChange((e.target as HTMLInputElement).value)} />
        </Field>
    );
}

function NumberField({ id, label, placeholder, value, onChange, hint }: any) {
    return (
        <Field label={label} htmlFor={id} hint={hint}>
            <Input id={id} type="number" placeholder={placeholder} value={String(value ?? "")} onChange={(e) => onChange(parseInt((e.target as HTMLInputElement).value || "0", 10))} />
        </Field>
    );
}

function PasswordField(props: any) {
    return <TextField {...props} type="password" />;
}

function SelectField({ id, label, value, onValueChange, children, hint }: any) {
    return (
        <Field label={label} htmlFor={id} hint={hint}>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger id={id} className="h-11 px-3 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 focus:border-blue-500 focus:ring-blue-500/20 transition-colors">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-slate-200 dark:border-slate-700">
                    {children}
                </SelectContent>
            </Select>
        </Field>
    );
}

interface ConnectionCategory {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    types: Array<{
        value: string;
        label: string;
        icon: React.ReactNode;
        defaultPort: number;
    }>;
}

const connectionCategories: ConnectionCategory[] = [
    {
        id: "database",
        name: "Database",
        description: "Connect to SQL and NoSQL databases",
        icon: <DbIcon size={20} />,
        types: [
            { value: "mysql", label: "MySQL", icon: <DbIcon className="text-orange-500" size={16} />, defaultPort: 3306 },
            { value: "pg", label: "PostgreSQL", icon: <DbIcon className="text-blue-500" size={16} />, defaultPort: 5432 },
            { value: "oracle", label: "Oracle", icon: <DbIcon className="text-red-500" size={16} />, defaultPort: 1521 },
            { value: "mongodb", label: "MongoDB", icon: <DbIcon className="text-green-500" size={16} />, defaultPort: 27017 },
        ],
    },
    {
        id: "storage",
        name: "Cloud Storage",
        description: "Connect to cloud storage services",
        icon: <Cloud size={20} />,
        types: [
            { value: "s3", label: "Amazon S3", icon: <Cloud className="text-orange-500" size={16} />, defaultPort: 443 },
            { value: "azure", label: "Azure Blob", icon: <Cloud className="text-blue-500" size={16} />, defaultPort: 443 },
            { value: "gcs", label: "Google Cloud Storage", icon: <Cloud className="text-green-500" size={16} />, defaultPort: 443 },
        ],
    },
    {
        id: "file",
        name: "File Transfer",
        description: "Connect via FTP/SFTP/FTPS and file protocols",
        icon: <FolderOpen size={20} />,
        types: [
            { value: "ftp", label: "FTP", icon: <Globe className="text-blue-500" size={16} />, defaultPort: 21 },
            { value: "sftp", label: "SFTP", icon: <HardDrive className="text-green-500" size={16} />, defaultPort: 22 },
            { value: "ftps", label: "FTPS", icon: <Globe className="text-purple-500" size={16} />, defaultPort: 990 },
        ],
    },
];

interface WizardStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    completed: boolean;
}

export default function AddConnection() {
    // Wizard state
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<ConnectionCategory["id"]>("database");
    const [formData, setFormData] = useState<Connection>({
        id: "",
        name: "",
        dataFormat: "mysql", // keep in sync with categories' values
        host: "",
        port: 3306,
        username: "",
        password: "",
        dbName: "",
        status: "untested",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    const [testLogs, setTestLogs] = useState<string[]>([]);
    const [isTesting, setIsTesting] = useState(false);
    const [testSucceeded, setTestSucceeded] = useState(false);
    const [testStatus, setTestStatus] = useState<StatusType>("untested");

    const categoriesById = useMemo(() => Object.fromEntries(connectionCategories.map((c) => [c.id, c])), []);
    const currentCategory = categoriesById[selectedCategory];

    // Steps
    const steps: WizardStep[] = [
        { id: "select-type", title: "Select Type", description: "Choose your connection type", icon: <DbIcon size={20} />, completed: !!formData.dataFormat && !!selectedCategory },
        { id: "enter-details", title: "Enter Details", description: "Configure connection settings", icon: <Settings size={20} />, completed: !!formData.name && !!formData.host && !!formData.dataFormat },
        { id: "test-save", title: "Test & Save", description: "Verify and create connection", icon: <CheckCircle size={20} />, completed: testSucceeded || isTesting },
    ];

    // Derived flags
    const isFileCategory = selectedCategory === "file";

    // Actions
    const handleCategoryChange = (categoryId: ConnectionCategory["id"]) => {
        setSelectedCategory(categoryId);
        const category = categoriesById[categoryId];
        if (category && category.types.length > 0) {
            const first = category.types[0];
            setFormData((prev) => ({ ...prev, dataFormat: first.value, port: first.defaultPort }));
        }
    };

    const handleTypeChange = (value: string) => {
        const t = currentCategory?.types.find((x) => x.value === value);
        setFormData((prev) => ({ ...prev, dataFormat: value, port: t?.defaultPort ?? prev.port }));
    };

    const canGoTo = (idx: number) => (idx === 0 ? true : idx === 1 ? steps[0].completed : steps[0].completed && steps[1].completed);

    const createConnection = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Connection = {
            ...formData,
            id: "", // server generated
            status: testSucceeded ? ("valid" as StatusType) : ("untested" as StatusType),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        try {
            await apiClient.createConnection(payload);
            alert("Connection saved successfully!");
        } catch (error) {
            console.error("Failed to save connection:", error);
            alert("Failed to save connection. Please try again.");
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestSucceeded(false);
        setTestLogs([]);
        setTestStatus("testing");
        try {
            const connStr = createConnectionString(formData);
            const result = await apiClient.testConnection(formData.dataFormat, connStr);
            if ((result as any)?.error) {
                setTestLogs([(result as any).error]);
                setTestStatus("invalid");
            } else {
                setTestLogs(((result as any)?.logs || "").split("\n").filter(Boolean));
                setTestSucceeded(true);
                setTestStatus("valid");
            }
        } catch (err: any) {
            setTestLogs([err?.message || "Unknown error occurred"]);
            setTestStatus("invalid");
        } finally {
            setIsTesting(false);
        }
    };

    const testStatusBadgeClass = () =>
        testStatus === "valid"
            ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
            : testStatus === "invalid"
                ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                : testStatus === "testing"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";

    const renderSelectTypeStep = () => (
        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <CardHeader className="p-6 pb-3">
                <CardTitle className="text-xl">Choose Connection Type</CardTitle>
                <p className="text-slate-600 dark:text-slate-400">Select the type of connection you want to create</p>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {connectionCategories.map((cat) => (
                        <button
                            type="button"
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`group text-left p-4 rounded-xl border transition-all ${selectedCategory === cat.id
                                    ? "border-slate-900 dark:border-white bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/60"
                                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`h-10 w-10 rounded-xl flex items-center justify-center ring-1 ${selectedCategory === cat.id
                                            ? "ring-slate-900 dark:ring-white bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                            : "ring-slate-200 dark:ring-slate-700 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        }`}
                                >
                                    {cat.icon}
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">{cat.name}</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">{cat.description}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    <Label className="text-base font-semibold text-slate-900 dark:text-white">Specific Type</Label>
                    <SelectField id="dataFormat" label="" value={formData.dataFormat} onValueChange={handleTypeChange}>
                        {currentCategory.types.map((t) => (
                            <SelectItem key={t.value} value={t.value} label={t.label} className="h-11 px-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">{t.icon}</div>
                                    <div>
                                        <div className="font-medium">{t.label}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Port {t.defaultPort}</div>
                                    </div>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectField>
                </div>
            </CardContent>
        </Card>
    );

    const renderEnterDetailsStep = () => (
        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <CardHeader className="p-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <DbIcon />
                    <span>Connection Details</span>
                </CardTitle>
                <p className="text-slate-600 dark:text-slate-400">Configure your {selectedCategory.replace("_", " ").toLowerCase()} connection settings</p>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
                <TextField id="name" label="Connection Name *" placeholder="Production DB" value={formData.name} onChange={(v: string) => setFormData((p) => ({ ...p, name: v }))} />

                {isFileCategory ? (
                    <>
                        <FieldRow>
                            <TextField id="host" label="Host *" placeholder="ftp.example.com" value={formData.host} onChange={(v: string) => setFormData((p) => ({ ...p, host: v }))} />
                            <NumberField id="port" label="Port *" placeholder="21" value={formData.port} onChange={(v: number) => setFormData((p) => ({ ...p, port: v }))} />
                        </FieldRow>
                        <FieldRow>
                            <TextField id="username" label="Username *" placeholder="username" value={formData.username} onChange={(v: string) => setFormData((p) => ({ ...p, username: v }))} />
                            <PasswordField id="password" label="Password *" placeholder="••••••••" value={formData.password} onChange={(v: string) => setFormData((p) => ({ ...p, password: v }))} />
                        </FieldRow>
                        <TextField id="dir" label="Initial Directory" placeholder="/home/user (optional)" value={formData.dbName} onChange={(v: string) => setFormData((p) => ({ ...p, dbName: v }))} />
                    </>
                ) : (
                    <>
                        <FieldRow>
                            <TextField id="host" label="Host *" placeholder="localhost" value={formData.host} onChange={(v: string) => setFormData((p) => ({ ...p, host: v }))} />
                            <NumberField id="port" label="Port *" placeholder="3306" value={formData.port} onChange={(v: number) => setFormData((p) => ({ ...p, port: v }))} />
                        </FieldRow>
                        <TextField id="db" label="Database Name *" placeholder="app_prod" value={formData.dbName} onChange={(v: string) => setFormData((p) => ({ ...p, dbName: v }))} />
                        <FieldRow>
                            <TextField id="username" label="Username *" placeholder="db_user" value={formData.username} onChange={(v: string) => setFormData((p) => ({ ...p, username: v }))} />
                            <PasswordField id="password" label="Password *" placeholder="••••••••" value={formData.password} onChange={(v: string) => setFormData((p) => ({ ...p, password: v }))} />
                        </FieldRow>
                    </>
                )}
            </CardContent>
        </Card>
    );

    const renderTestSaveStep = () => (
        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
            <CardHeader className="p-6 pb-3">
                <CardTitle className="text-xl">Test & Save Connection</CardTitle>
                <p className="text-slate-600 dark:text-slate-400">Test your connection and save it to proceed with migrations</p>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-4">Connection Summary</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Name</span>
                                <span className="text-slate-900 dark:text-white font-semibold">{formData.name || "—"}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Host</span>
                                <span className="text-slate-900 dark:text-white font-semibold">{formData.host || "—"}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Type</span>
                                <span className="text-slate-900 dark:text-white font-semibold">{formData.dataFormat.toUpperCase()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Port</span>
                                <span className="text-slate-900 dark:text-white font-semibold">{formData.port}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Test Connection</Label>
                        <Badge className={`text-sm ${testStatusBadgeClass()}`}>{testStatus.charAt(0).toUpperCase() + testStatus.slice(1)}</Badge>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleTest}
                        disabled={isTesting || !formData.host || (!isFileCategory && !formData.dbName)}
                        className="w-full h-12"
                    >
                        <Zap size={16} />
                        <span className="ml-2">{isTesting ? "Testing..." : "Test Connection"}</span>
                    </Button>

                    {testLogs.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Test Logs</Label>
                            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 max-h-64 overflow-y-auto border border-slate-700/60">
                                <div className="font-mono text-sm space-y-1 text-slate-100">
                                    {testLogs.map((log, i) => (
                                        <div key={i}>{log}</div>
                                    ))}
                                    {isTesting && (
                                        <div className="flex items-center gap-2 text-blue-400">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                            <span>Running...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6" data-testid="add-connection-page">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/connections">
                    <Button type="button" variant="ghost" size="sm" data-testid="back-button">
                        <ArrowLeft size={16} />
                        <span className="ml-2">Back</span>
                    </Button>
                </Link>
                <div>
                    <h1 className="text-[32px] font-bold leading-tight text-slate-900 dark:text-white">Add Connection</h1>
                    <p className="text-slate-700 dark:text-slate-300">Create a new connection in {steps.length} simple steps</p>
                </div>
            </div>

            {/* Stepper */}
            <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center w-full">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => canGoTo(index) && setCurrentStep(index)}
                                        disabled={!canGoTo(index)}
                                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all text-sm font-medium ${step.completed || index === currentStep
                                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                                : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                                            } ${canGoTo(index) ? "hover:scale-105" : "cursor-not-allowed"}`}
                                    >
                                        {step.completed && index !== currentStep ? <CheckCircle size={14} /> : <span>{index + 1}</span>}
                                    </button>
                                    <div className="ml-3">
                                        <div className={`text-sm font-medium ${step.completed || index === currentStep ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                                            }`}>{step.title}</div>
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="flex-1 mx-4">
                                        <div className={`h-0.5 w-full ${steps[index].completed ? "bg-slate-900 dark:bg-white" : "bg-slate-200 dark:bg-slate-700"}`} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Steps */}
            <form onSubmit={createConnection} className="space-y-6">
                {currentStep === 0 && renderSelectTypeStep()}
                {currentStep === 1 && renderEnterDetailsStep()}
                {currentStep === 2 && renderTestSaveStep()}

                {/* Nav */}
                <div className="flex justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0} data-testid="button-previous">
                        <ArrowLeft size={16} />
                        <span className="ml-2">Previous</span>
                    </Button>
                    <div className="flex items-center gap-3">
                        <Link to="/connections">
                            <Button type="button" variant="outline" data-testid="button-cancel">Cancel</Button>
                        </Link>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} disabled={!steps[currentStep].completed} variant="primary">
                                Next
                                <ArrowRight size={16} className="ml-2" />
                            </Button>
                        ) : (
                            <Button type="submit" disabled={!steps[currentStep].completed} data-testid="button-create-connection">
                                Create Connection
                                <CheckCircle size={16} className="ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
