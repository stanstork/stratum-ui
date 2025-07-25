import { useEffect, useState } from "react";
import { emptyMigrationConfig, MigrationConfig } from "../types/MigrationConfig";
import { ArrowRight, ArrowRightLeft, Check, ChevronRight, Database, FileText, Filter, Link2, Settings, Table } from "lucide-react";
import Button from "../components/common/v2/Button";
import Step1_Details from "../components/wizard_step/Step1_Details";
import Step2_Connections from "../components/wizard_step/Step2_Connections";
import Step3_SelectTable from "../components/wizard_step/Step3_SelectTable";
import Step4_Joins from "../components/wizard_step/Step4_Joins";
import Step5_ColumnMapping from "../components/wizard_step/Step5_ColumnMapping";
import Step6_Filters from "../components/wizard_step/Step6_Filters";
import Step7_Settings from "../components/wizard_step/Step7_Settings";
import PreviewModal from "../components/PreviewModal";
import { TableMetadata } from "../types/Metadata";
import apiClient from "../services/apiClient";
import Step8_Preview from "../components/wizard_step/Step8_Preview";

type MigrationWizardProps = {
    onBack: () => void;
    setView: (view: string, params?: any) => void;
};

const MigrationWizard = ({ onBack, setView }: MigrationWizardProps) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [config, setConfig] = useState<MigrationConfig>(emptyMigrationConfig());
    const [metadata, setMetadata] = useState<Record<string, TableMetadata> | null>(null);
    const [isMetadataLoading, setIsMetadataLoading] = useState(false);

    const sourceName = config.connections.source.name || '...';
    const destName = config.connections.dest.name || '...';

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

    useEffect(() => {
        if (isPreviewVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isPreviewVisible]);

    const isStep1Complete = config.name.trim() !== '';
    const isStep2Complete = !!(config.connections.source.id && config.connections.dest.id);
    const isStep3Complete = !!config.migration.migrateItems[0]?.source.names[0];

    const steps = [
        { num: 1, title: 'Details', isComplete: isStep1Complete, isDisabled: false },
        { num: 2, title: 'Connections', isComplete: isStep2Complete, isDisabled: !isStep1Complete },
        { num: 3, title: 'Source Table', isComplete: isStep3Complete, isDisabled: !isStep2Complete },
        { num: 4, title: 'Joins', isComplete: true, isDisabled: !isStep3Complete },
        { num: 5, title: 'Column Mapping', isComplete: true, isDisabled: !isStep3Complete },
        { num: 6, title: 'Filters', isComplete: true, isDisabled: !isStep3Complete },
        { num: 7, title: 'Settings', isComplete: true, isDisabled: !isStep3Complete },
        { num: 8, title: 'Preview', isComplete: true, isDisabled: !isStep3Complete }
    ];

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1_Details config={config} setConfig={setConfig} />;
            case 2: return <Step2_Connections config={config} setConfig={setConfig} />;
            case 3: return <Step3_SelectTable config={config} setConfig={setConfig} migrateItem={config.migration.migrateItems[0]} metadata={metadata} isMetadataLoading={isMetadataLoading} />;
            case 4: return <Step4_Joins config={config} setConfig={setConfig} metadata={metadata} migrateItem={config.migration.migrateItems[0]} />;
            case 5: return <Step5_ColumnMapping config={config} setConfig={setConfig} metadata={metadata} migrateItem={config.migration.migrateItems[0]} />;
            case 6: return <Step6_Filters config={config} setConfig={setConfig} metadata={metadata} migrateItem={config.migration.migrateItems[0]} />;
            case 7: return <Step7_Settings config={config} setConfig={setConfig} migrateItem={config.migration.migrateItems[0]} />;
            case 8: return <Step8_Preview config={config} setView={setView} onEditStep={setCurrentStep} />;
            default: return <Step1_Details config={config} setConfig={setConfig} />;
        }
    };

    const handleNext = () => { if (currentStep < steps.length) setCurrentStep(currentStep + 1); };
    const handlePrev = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

    const isNextDisabled = () => {
        const currentStepConfig = steps.find(s => s.num === currentStep);
        return !currentStepConfig?.isComplete;
    };

    const isLastStep = currentStep === steps.length;

    return (
        <div className="pb-8">
            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm flex flex-col">
                {/* Header Area */}
                <div className="p-6">
                    <div className="mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">New Migration Configuration</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Configure data migration from <span className="font-semibold text-slate-600 dark:text-slate-300">{sourceName}</span> to <span className="font-semibold text-slate-600 dark:text-slate-300">{destName}</span>
                            </p>
                        </div>
                    </div>
                    <nav>
                        <ol className="flex items-center">
                            {steps.map((step, index) => {
                                const isCompleted = currentStep > step.num;
                                const isActive = currentStep === step.num;
                                let statusClasses;
                                if (isActive) {
                                    statusClasses = {
                                        circle: 'bg-indigo-600 text-white',
                                        text: 'text-indigo-600 dark:text-indigo-400 font-semibold'
                                    };
                                } else if (step.isDisabled) {
                                    statusClasses = {
                                        circle: 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed',
                                        text: 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                    };
                                } else if (step.isComplete) {
                                    statusClasses = {
                                        circle: 'bg-indigo-200 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300',
                                        text: 'text-slate-600 dark:text-slate-300 font-medium'
                                    };
                                }
                                else {
                                    statusClasses = {
                                        circle: 'bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400',
                                        text: 'text-slate-500 dark:text-slate-400 font-medium'
                                    };
                                }

                                return (
                                    <li key={step.num} className="flex items-center">
                                        <button
                                            onClick={() => !step.isDisabled && setCurrentStep(step.num)}
                                            disabled={step.isDisabled}
                                            className="flex items-center gap-3 p-2 rounded-lg"
                                        >
                                            <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm ${statusClasses.circle}`}>
                                                {step.isComplete && !isActive ? <Check size={16} /> : step.num}
                                            </span>
                                            <span className={`text-sm ${statusClasses.text}`}>
                                                {step.title}
                                            </span>
                                        </button>
                                        {index < steps.length - 1 && <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-1" />}
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>
                </div>

                {/* Divider */}
                <hr className="border-slate-200 dark:border-slate-700" />

                {/* Step Content Area */}
                <div className="p-6">
                    {renderStep()}
                </div>

                {/* Footer Area */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <div className="flex items-center gap-3">
                        <Button onClick={onBack} variant="secondary">Cancel</Button>
                        <Button variant="outline">Save Draft</Button>
                        {currentStep > 1 && <Button onClick={handlePrev} variant="secondary">Previous</Button>}
                        {isLastStep
                            ? <Button onClick={() => setIsPreviewVisible(true)} variant="primary" disabled={isNextDisabled()}>Finish & Review</Button>
                            : <Button onClick={handleNext} disabled={isNextDisabled()}>Next Step <ArrowRight size={16} className="ml-2" /></Button>
                        }
                    </div>
                </div>

                {isPreviewVisible && <PreviewModal config={config} onClose={() => setIsPreviewVisible(false)} setView={setView} />}
            </div>
        </div>
    );
};

export default MigrationWizard;
