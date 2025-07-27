import { useEffect, useState } from "react";
import { emptyMigrationConfig, MigrationConfig } from "../types/MigrationConfig";
import { ArrowRight, ArrowRightLeft, Check, CheckCircle2, Database, FileText, Filter, Link2, Loader, Settings, Table } from "lucide-react";
import Button from "../components/common/v2/Button";
import Step1_Details from "../components/wizard_step/Step1_Details";
import Step2_Connections from "../components/wizard_step/Step2_Connections";
import Step3_SelectTable from "../components/wizard_step/Step3_SelectTable";
import Step4_Joins from "../components/wizard_step/Step4_Joins";
import Step5_ColumnMapping from "../components/wizard_step/Step5_ColumnMapping";
import Step6_Filters from "../components/wizard_step/Step6_Filters";
import Step7_Settings from "../components/wizard_step/Step7_Settings";
import { TableMetadata } from "../types/Metadata";
import apiClient from "../services/apiClient";
import Step8_Preview from "../components/wizard_step/Step8_Preview";
import React from "react";

type MigrationWizardProps = {
    setView: (view: string, params?: any) => void;
    onBack: () => void;
};

const MigrationWizard: React.FC<MigrationWizardProps> = ({ setView, onBack }) => {
    const [currentStep, setCurrentStep] = useState(1);
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
                const fetchedMetadata = await apiClient.getMetadata(sourceId);
                setMetadata(fetchedMetadata);
            } catch (error) {
                console.error("Failed to fetch metadata:", error);
                setMetadata(null);
            } finally {
                setIsMetadataLoading(false);
            }
        };
        loadMetadata();
    }, [config.connections.source?.id]);

    const steps = [
        { num: 1, title: 'Details', icon: <FileText size={20} /> },
        { num: 2, title: 'Connections', icon: <Database size={20} /> },
        { num: 3, title: 'Source Table', icon: <Table size={20} /> },
        { num: 4, title: 'Joins', icon: <Link2 size={20} /> },
        { num: 5, title: 'Column Mapping', icon: <ArrowRightLeft size={20} /> },
        { num: 6, title: 'Filters', icon: <Filter size={20} /> },
        { num: 7, title: 'Settings', icon: <Settings size={20} /> },
        { num: 8, title: 'Preview', icon: <CheckCircle2 size={20} /> }
    ];

    const isStepDisabled = (stepNum: number) => {
        if (stepNum === 1) return false;
        if (!config.name) return true; // Step 1 must be complete
        if (stepNum > 2 && (!config.connections.source?.id || !config.connections.dest?.id)) return true; // Step 2 must be complete
        if (stepNum > 3 && !config.migration.migrateItems[0].source.names[0]) return true; // Step 3 must be complete
        return false;
    };

    const handleNext = () => {
        if (currentStep < steps.length) {
            const nextStep = currentStep + 1;
            if (!isStepDisabled(nextStep)) {
                setCurrentStep(nextStep);
            }
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const goToStep = (stepNum: number) => {
        if (!isStepDisabled(stepNum)) {
            setCurrentStep(stepNum);
        }
    }

    const renderStep = () => {
        const props = { config, setConfig, migrateItem: config.migration.migrateItems[0] };
        switch (currentStep) {
            case 1: return <Step1_Details {...props} />;
            case 2: return <Step2_Connections {...props} />;
            case 3: return <Step3_SelectTable {...props} metadata={metadata} isMetadataLoading={isMetadataLoading} />;
            case 4: return <Step4_Joins {...props} metadata={metadata} />;
            case 5: return <Step5_ColumnMapping {...props} metadata={metadata} />;
            case 6: return <Step6_Filters {...props} metadata={metadata} />;
            case 7: return <Step7_Settings {...props} />;
            case 8: return <Step8_Preview {...props} onEditStep={goToStep} setView={setView} />;
            default: return <Step1_Details {...props} />;
        }
    };

    const isNextDisabled = () => {
        switch (currentStep) {
            case 1: return !config.name;
            case 2: return !config.connections.source?.id || !config.connections.dest?.id;
            case 3: return !config.migration.migrateItems[0].source.names[0];
            default: return false;
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            console.log("Saving migration config:", config);
            await apiClient.createJobDefinition(config);
            setView('definitions'); // Navigate on success
        } catch (error) {
            console.error("Failed to save migration:", error);
            // Optionally show an error message to the user
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full">
            <div className="bg-white dark:bg-slate-800/60 rounded-xl shadow-lg">

                {/* Header Zone: Title & Buttons */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700/60">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">New Migration Configuration</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                {config.connections.source.name ? `From ${config.connections.source.name} to ${config.connections.dest.name || '...'}` : 'Configure your data transfer job.'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onBack}>Cancel</Button>
                            <Button variant="outline">Save Draft</Button>
                        </div>
                    </div>
                </div>

                {/* Stepper Zone */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700/60">
                    <ol className="flex items-center w-full">
                        {steps.map((step, index) => {
                            const isDisabled = isStepDisabled(step.num);
                            const isCompleted = currentStep > step.num && !isDisabled;
                            const isActive = currentStep === step.num;
                            return (
                                <React.Fragment key={step.num}>
                                    <li className="relative flex items-center">
                                        <button
                                            onClick={() => goToStep(step.num)}
                                            disabled={isDisabled}
                                            className="flex items-center gap-3 text-sm font-medium transition-colors"
                                        >
                                            <span className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 border-2 ${isActive ? 'bg-indigo-600 border-indigo-600 text-white' : isCompleted ? 'bg-white dark:bg-slate-700 border-indigo-600 text-indigo-600' : isDisabled ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500 hover:border-slate-400'}`}>
                                                {isCompleted ? <Check size={16} /> : <span className="text-xs font-bold">{step.num}</span>}
                                            </span>
                                            <span className={`${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'} ${isDisabled ? 'text-slate-400' : ''}`}>{step.title}</span>
                                        </button>
                                    </li>
                                    {index < steps.length - 1 && <div className={`flex-auto border-t-2 mx-4 transition duration-500 ${isCompleted ? 'border-indigo-600' : 'border-slate-200 dark:border-slate-700'}`}></div>}
                                </React.Fragment>
                            );
                        })}
                    </ol>
                </div>

                {/* Step Content Zone */}
                <main className="p-6">
                    {renderStep()}
                </main>

                {/* Footer Actions Zone */}
                <footer className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-b-xl border-t border-slate-200 dark:border-slate-700/60">
                    <div className="flex justify-between items-center">
                        <Button onClick={handlePrev} variant="outline" className={currentStep === 1 ? 'invisible' : ''}>
                            Previous Step
                        </Button>
                        {currentStep < steps.length ? (
                            <Button onClick={handleNext} disabled={isNextDisabled()}>
                                Next Step <ArrowRight size={16} className="ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={handleSave} variant="primary" disabled={isSaving}>
                                {isSaving && <Loader size={16} className="animate-spin mr-2" />}
                                {isSaving ? 'Saving...' : 'Confirm & Save'}
                            </Button>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default MigrationWizard;
