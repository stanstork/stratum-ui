import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    Check,
    CheckCircle2,
    Database,
    FileText,
    Filter,
    Link2,
    Loader,
    Settings,
    Table,
} from "lucide-react";
import { emptyMigrationConfig, MigrationConfig } from "../types/MigrationConfig";
import { TableMetadata } from "../types/Metadata";
import apiClient from "../services/apiClient";
import Step1_Details from "../components/wizard_step/Step1_Details";
import Step2_Connections from "../components/wizard_step/Step2_Connections";
import Step4_SelectTable from "../components/wizard_step/Step4_SelectTable";
import Step5_Joins from "../components/wizard_step/Step5_Joins";
import Step6_ColumnMapping from "../components/wizard_step/Step6_ColumnMapping";
import Step7_Filters from "../components/wizard_step/Step7_Filters";
import Step8_Settings from "../components/wizard_step/Step8_Settings";
import Step9_Preview from "../components/wizard_step/Step9_Preview";
import { Card, CardContent } from "../components/common/v2/Card";
import { Button } from "../components/common/v2/Button";
import { useSearchParams } from "react-router-dom";
import { getMigrationConfig } from "../types/JobDefinition";
import Step3_MigrationItems from "../components/wizard_step/Step3_MigrationItems";
import { ItemScopedHeader } from "../components/ItemScopedHeader";
import { useAuth } from "../context/AuthContext";

// --------------------------------------------
// Wizard metadata
// --------------------------------------------

type MigrationWizardProps = {
    setView: (view: string, params?: any) => void;
    onBack: () => void;
};

const steps = [
    { num: 1, title: "Details", icon: <FileText size={18} /> },
    { num: 2, title: "Connections", icon: <Database size={18} /> },
    { num: 3, title: "Items", icon: <Table size={18} /> },
    { num: 4, title: "Source", icon: <Table size={18} /> },
    { num: 5, title: "Joins", icon: <Link2 size={18} /> },
    { num: 6, title: "Mapping", icon: <ArrowRight size={18} /> },
    { num: 7, title: "Filters", icon: <Filter size={18} /> },
    { num: 8, title: "Settings", icon: <Settings size={18} /> },
    { num: 9, title: "Preview", icon: <CheckCircle2 size={18} /> },
] as const;

// --------------------------------------------
// Component
// --------------------------------------------

export default function MigrationWizard({ setView, onBack }: MigrationWizardProps) {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [config, setConfig] = useState<MigrationConfig>(emptyMigrationConfig());
    const [isMetadataLoading, setIsMetadataLoading] = useState(false);
    const [metadata, setMetadata] = useState<Record<string, TableMetadata> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // --- Edit mode detection ---
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("edit")?.trim() || null;
    const isEditing = useMemo(() => !!editId, [editId]);
    const [isConfigLoading, setIsConfigLoading] = useState(false);

    // Load existing config when ?edit=... is present
    useEffect(() => {
        const fetchExisting = async (id: string) => {
            setIsConfigLoading(true);
            try {
                const existing = await apiClient.getJobDefinition(id);
                const config = getMigrationConfig(existing);

                if (existing) {
                    setConfig((prev) => ({
                        // Keep a safe baseline, then overlay fetched config
                        ...emptyMigrationConfig(),
                        ...config,
                    }));
                } else {
                    console.warn("No config returned for edit id:", id);
                }
            } catch (e) {
                console.error("Failed to load config for editing:", e);
            } finally {
                setIsConfigLoading(false);
            }
        };

        if (editId) fetchExisting(editId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId]);

    // Fetch metadata when source connection changes
    useEffect(() => {
        const loadMetadata = async () => {
            const sourceId = config.connections.source?.id;
            if (!sourceId) {
                setMetadata(null);
                return;
            }
            setIsMetadataLoading(true);
            try {
                const fetched = await apiClient.getMetadata(sourceId);
                setMetadata(fetched);
            } catch (e) {
                console.error("Failed to load metadata", e);
                setMetadata(null);
            } finally {
                setIsMetadataLoading(false);
            }
        };
        loadMetadata();
    }, [config.connections.source?.id]);

    // Step gating
    const isStepDisabled = (stepNum: number) => {
        if (stepNum === 1) return false;
        if (!config.name) return true; // Step 1 must be complete
        if (stepNum > 2 && (!config.connections.source?.id || !config.connections.dest?.id)) return true; // Step 2 must be complete
        if (stepNum > 4 && !config.migration.migrateItems[0].source.names[0]) return true; // Step 4 must be complete
        return false;
    };

    const goToStep = (stepNum: number) => {
        if (!isStepDisabled(stepNum)) setCurrentStep(stepNum);
    };

    const handleNext = () => {
        if (currentStep < steps.length) {
            const next = currentStep + 1;
            if (!isStepDisabled(next)) setCurrentStep(next);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const isNextDisabled = () => {
        switch (currentStep) {
            case 1:
                return !config.name;
            case 2:
                return !config.connections.source?.id || !config.connections.dest?.id;
            case 4:
                return !config.migration.migrateItems[0].source.names[0];
            default:
                return false;
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (isEditing && editId) {
                await apiClient.updateJobDefinition(editId, config);
            } else {
                await apiClient.createJobDefinition(config);
            }
            setView("definitions");
        } finally {
            setIsSaving(false);
        }
    };

    // Step content
    const renderStep = () => {
        const props = { config, setConfig, migrateItem: config.migration.migrateItems[0] } as const;
        switch (currentStep) {
            case 1:
                return <Step1_Details {...props} />;
            case 2:
                return <Step2_Connections {...props} />;
            case 3:
                return <Step3_MigrationItems config={config} setConfig={setConfig} />;
            case 4:
                return (
                    <>
                        {<ItemScopedHeader config={config} setConfig={setConfig} />}
                        {<Step4_SelectTable
                            config={config}
                            migrateItem={config.migration.migrateItems[config.activeItemIndex]}
                            metadata={metadata}
                            isMetadataLoading={isMetadataLoading}
                            setConfig={setConfig}
                        />}
                    </>
                );
            case 5:
                return (
                    <>
                        {<ItemScopedHeader config={config} setConfig={setConfig} />}
                        {<Step5_Joins
                            config={config}
                            migrateItem={config.migration.migrateItems[config.activeItemIndex]}
                            metadata={metadata}
                            setConfig={setConfig}
                        />}
                    </>
                );
            case 6:
                return (
                    <>
                        {<ItemScopedHeader config={config} setConfig={setConfig} />}
                        {<Step6_ColumnMapping
                            config={config}
                            migrateItem={config.migration.migrateItems[config.activeItemIndex]}
                            metadata={metadata}
                            setConfig={setConfig}
                        />}
                    </>
                )
            case 7:
                return (
                    <>
                        {<ItemScopedHeader config={config} setConfig={setConfig} />}
                        {<Step7_Filters
                            config={config}
                            migrateItem={config.migration.migrateItems[config.activeItemIndex]}
                            metadata={metadata}
                            setConfig={setConfig}
                        />}
                    </>
                )
            case 8:
                return (
                    <>
                        {<ItemScopedHeader config={config} setConfig={setConfig} />}
                        {<Step8_Settings
                            config={config}
                            migrateItem={config.migration.migrateItems[config.activeItemIndex]}
                            setConfig={setConfig}
                        />}
                    </>
                );
            case 9:
                return <Step9_Preview {...props} />;
            default:
                return <Step1_Details {...props} />;
        }
    };

    if (!isEditing && user?.isViewerOnly) {
        return (
            <div className="py-10">
                <Card className="max-w-3xl mx-auto bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-sm">
                    <CardContent className="p-8 space-y-4 text-center">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">View Only Access</h2>
                        <p className="text-slate-600 dark:text-slate-300">
                            Your account has viewer permissions. Creating new migration configurations is disabled.
                        </p>
                        <Button variant="primary" type="button" onClick={onBack}>
                            Return to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {isConfigLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm bg-white/40 dark:bg-slate-900/30">
                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                        <Loader className="animate-spin" size={18} /> Loading configuration...
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-[32px] font-bold leading-tight text-slate-900 dark:text-white">
                        {isEditing ? "Edit Migration Configuration" : "New Migration Configuration"}
                    </h1>
                    <p className="text-slate-700 dark:text-slate-300">
                        {config.connections.source.name
                            ? `From ${config.connections.source.name} to ${config.connections.dest.name || "..."}`
                            : isEditing
                                ? "Loaded existing configuration."
                                : "Configure your data transfer job."}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" type="button" onClick={onBack}>Cancel</Button>
                    {!isEditing && <Button variant="outline">Save Draft</Button>}
                </div>
            </div>

            {/* Stepper */}
            <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center w-full">
                        {steps.map((step, index) => {
                            const disabled = isStepDisabled(step.num);
                            const completed = currentStep > step.num && !disabled;
                            const active = currentStep === step.num;

                            return (
                                <div key={step.title} className="flex items-center flex-1">
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => goToStep(step.num)}
                                            disabled={disabled}
                                            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all text-sm font-medium ${completed || active
                                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                                : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                                                } ${disabled ? "cursor-not-allowed" : "hover:scale-105"}`}
                                        >
                                            {completed && !active ? <Check size={14} /> : <span>{step.num}</span>}
                                        </button>
                                        <div className="ml-3">
                                            <div
                                                className={`text-sm font-medium ${completed || active ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                                                    }`}
                                            >
                                                {step.title}
                                            </div>
                                        </div>
                                    </div>

                                    {index < steps.length - 1 && (
                                        <div className="flex-1 mx-4">
                                            <div
                                                className={`h-0.5 w-full ${currentStep > step.num ? "bg-slate-900 dark:bg-white" : "bg-slate-200 dark:bg-slate-700"
                                                    }`}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Body + Footer */}
            <div>
                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                    <main className="p-5 sm:p-6">{renderStep()}</main>
                </Card>

                <div className="bg-slate-50/60 dark:bg-slate-900/30 mt-4">
                    <div className="flex items-center justify-between">
                        <Button variant="outline" type="button" onClick={handlePrev} className={currentStep === 1 ? "invisible" : ""}>
                            Previous Step
                        </Button>

                        {currentStep < steps.length ? (
                            <Button type="button" onClick={handleNext} disabled={isNextDisabled()} variant="primary">
                                Next Step <ArrowRight size={16} className="ml-2" />
                            </Button>
                        ) : (
                            <Button type="button" onClick={handleSave} disabled={isSaving} variant="primary">
                                {isSaving && <Loader size={16} className="animate-spin mr-2" />}
                                {isSaving ? (isEditing ? "Updating..." : "Saving...") : isEditing ? "Update" : "Confirm & Save"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
