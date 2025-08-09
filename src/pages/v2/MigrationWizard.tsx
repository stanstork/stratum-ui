import { useEffect, useState } from "react";
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
import React from "react";
import { emptyMigrationConfig, MigrationConfig } from "../../types/MigrationConfig";
import { TableMetadata } from "../../types/Metadata";
import apiClient from "../../services/apiClient";
import Step1_Details from "../../components/wizard_step/Step1_Details";
import Step2_Connections from "../../components/wizard_step/Step2_Connections";
import Step3_SelectTable from "../../components/wizard_step/Step3_SelectTable";
import Step4_Joins from "../../components/wizard_step/Step4_Joins";
import Step5_ColumnMapping from "../../components/wizard_step/Step5_ColumnMapping";
import Step6_Filters from "../../components/wizard_step/Step6_Filters";
import Step7_Settings from "../../components/wizard_step/Step7_Settings";
import Step8_Preview from "../../components/wizard_step/Step8_Preview";
import { Card, CardContent } from "../../components/common/v2/Card";
import { Button } from "../../components/common/v2/Button";

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
    { num: 3, title: "Source", icon: <Table size={18} /> },
    { num: 4, title: "Joins", icon: <Link2 size={18} /> },
    { num: 5, title: "Mapping", icon: <ArrowRight size={18} /> },
    { num: 6, title: "Filters", icon: <Filter size={18} /> },
    { num: 7, title: "Settings", icon: <Settings size={18} /> },
    { num: 8, title: "Preview", icon: <CheckCircle2 size={18} /> },
] as const;

// --------------------------------------------
// Component
// --------------------------------------------

export default function MigrationWizard({ setView, onBack }: MigrationWizardProps) {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [config, setConfig] = useState<MigrationConfig>(emptyMigrationConfig());
    const [isMetadataLoading, setIsMetadataLoading] = useState(false);
    const [metadata, setMetadata] = useState<Record<string, TableMetadata> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

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
        if (stepNum > 3 && !config.migration.migrateItems[0].source.names[0]) return true; // Step 3 must be complete
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
            case 3:
                return !config.migration.migrateItems[0].source.names[0];
            default:
                return false;
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.createJobDefinition(config);
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
                return (
                    <Step3_SelectTable {...props} metadata={metadata} isMetadataLoading={isMetadataLoading} />
                );
            case 4:
                return <Step4_Joins {...props} metadata={metadata} />;
            case 5:
                return <Step5_ColumnMapping {...props} metadata={metadata} />;
            case 6:
                return <Step6_Filters {...props} metadata={metadata} />;
            case 7:
                return <Step7_Settings {...props} />;
            case 8:
                return <Step8_Preview {...props} onEditStep={goToStep} setView={setView} />;
            default:
                return <Step1_Details {...props} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-[32px] font-bold leading-tight text-slate-900 dark:text-white">
                        New Migration Configuration
                    </h1>
                    <p className="text-slate-700 dark:text-slate-300">
                        {config.connections.source.name
                            ? `From ${config.connections.source.name} to ${config.connections.dest.name || "..."}`
                            : "Configure your data transfer job."}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" type="button" onClick={onBack}>Cancel</Button>
                    <Button variant="outline" type="button" onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader size={16} className="animate-spin mr-2" />}
                        Save Draft
                    </Button>
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
                            <Button type="button" onClick={handleSave} disabled={isSaving}>
                                {isSaving && <Loader size={16} className="animate-spin mr-2" />}
                                {isSaving ? "Saving..." : "Confirm & Save"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
