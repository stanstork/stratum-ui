import { useEffect, useState } from "react";
import { emptyMigrationConfig, MigrationConfig } from "../types/MigrationConfig";
import { ArrowRight, Check, Database, FileText, Filter, Link2, Settings, Table, ArrowRightLeft } from "lucide-react";
import Step1_Details from "../components/wizard_step/Step1_Details";
import Button from "../components/common/v2/Button";
import Step2_Connections from "../components/wizard_step/Step2_Connections";
import Step3_SelectTable from "../components/wizard_step/Step3_SelectTable";
import { TableMetadata } from "../types/Metadata";
import apiClient from "../services/apiClient";
import Step4_Joins from "../components/wizard_step/Step4_Joins";
import Step5_ColumnMapping from "../components/wizard_step/Step5_ColumnMapping";
import Step6_Filters from "../components/wizard_step/Step6_Filters";
import Step7_Settings from "../components/wizard_step/Step7_Settings";
import PreviewModal from "../components/PreviewModal";

type MigrationWizardProps = {
    onBack: () => void;
    setView: (view: string) => void;
};

const MigrationWizard = ({ onBack, setView }: MigrationWizardProps) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [config, setConfig] = useState<MigrationConfig>(emptyMigrationConfig());
    const [metadata, setMetadata] = useState<Record<string, TableMetadata> | null>(null);
    const [isMetadataLoading, setIsMetadataLoading] = useState(false);

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

    const isStepComplete = (stepNum: number) => {
        switch (stepNum) {
            case 1: return !!config.name;
            case 2: return !!config.connections.source?.id && !!config.connections.dest?.id;
            case 3: return !!migrateItem.source.names[0];
            default: return true;
        }
    };

    const migrateItem = config.migration.migrateItems[0];
    const steps = [
        { num: 1, title: 'Migration Details', icon: <FileText size={20} />, subtitle: "Provide basic information about your migration project. This helps organize and track your configurations." },
        { num: 2, title: 'Connections', icon: <Database size={20} />, subtitle: "Select the source and destination." },
        { num: 3, title: 'Source Table', icon: <Table size={20} />, subtitle: "Choose the main table to migrate from and name the destination table." },
        { num: 4, title: 'Joins', icon: <Link2 size={20} />, subtitle: "Combine data from other tables." },
        { num: 5, title: 'Column Mapping', icon: <ArrowRightLeft size={20} />, subtitle: "Define the destination schema." },
        { num: 6, title: 'Filters', icon: <Filter size={20} />, subtitle: "Filter the data to be migrated." },
        { num: 7, title: 'Settings', icon: <Settings size={20} />, subtitle: "Configure advanced options." },
    ];

    let maxAllowedStep = 1;
    for (let i = 1; i <= steps.length; i++) {
        if (isStepComplete(i)) {
            maxAllowedStep = i + 1;
        } else {
            break;
        }
    }

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1_Details config={config} setConfig={setConfig} />;
            case 2: return <Step2_Connections config={config} setConfig={setConfig} />;
            case 3: return <Step3_SelectTable config={config} setConfig={setConfig} migrateItem={migrateItem} metadata={metadata} isMetadataLoading={isMetadataLoading} />;
            case 4: return <Step4_Joins config={config} setConfig={setConfig} metadata={metadata} migrateItem={migrateItem} />;
            case 5: return <Step5_ColumnMapping config={config} setConfig={setConfig} metadata={metadata} migrateItem={migrateItem} />;
            case 6: return <Step6_Filters config={config} setConfig={setConfig} metadata={metadata} migrateItem={migrateItem} />;
            case 7: return <Step7_Settings config={config} setConfig={setConfig} migrateItem={migrateItem} />;
            default: return <Step1_Details config={config} setConfig={setConfig} />;
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length && isStepComplete(currentStep)) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden">
            <header className="flex justify-between items-center p-5 border-b border-slate-200/80 dark:border-slate-700/80">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Configure Data Migration</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Follow the steps to set up your data transfer job.</p>
                </div>
                <Button onClick={onBack} variant="secondary">Back to Definitions</Button>
            </header>

            <div className="flex-1 flex flex-row overflow-y-hidden">
                {/* Vertical Stepper */}
                <aside className="w-72 p-8 border-r border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/20 overflow-y-auto">
                    <ol className="relative border-l border-gray-300 dark:border-gray-600">
                        {steps.map((step) => {
                            const isCompleted = isStepComplete(step.num) && currentStep > step.num;
                            const isActive = currentStep === step.num;
                            const isEnabled = step.num <= maxAllowedStep;

                            return (
                                <li key={step.num} className="mb-10 ml-8">
                                    <button
                                        onClick={() => isEnabled && setCurrentStep(step.num)}
                                        disabled={!isEnabled}
                                        className={`absolute flex items-center justify-center w-10 h-10 rounded-full -left-5 ring-8 ring-slate-50/50 dark:ring-[#2a3344] transition-colors duration-300
                                            ${isActive ? 'bg-indigo-600 text-white shadow-lg' : ''}
                                            ${isCompleted ? 'bg-green-500 text-white' : ''}
                                            ${!isActive && !isCompleted && isEnabled ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-indigo-100 dark:hover:bg-indigo-900' : ''}
                                            ${!isEnabled ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700' : ''}
                                        `}
                                    >
                                        {isCompleted ? <Check size={20} /> : step.icon}
                                    </button>
                                    <div className="ml-4">
                                        <h3 className={`font-semibold leading-tight ${isEnabled ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>{step.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Step {step.num}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </aside>

                {/* Step Content Area */}
                <div className="flex-1 flex flex-col overflow-y-hidden">
                    <header className="flex justify-between items-center p-8 pb-6 border-b border-slate-200/80 dark:border-slate-700/80">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 p-3 rounded-lg">
                                {steps[currentStep - 1].icon}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{steps[currentStep - 1].title}</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">
                                    {steps[currentStep - 1].subtitle}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={handlePrev} variant="secondary" className={currentStep === 1 ? 'invisible' : ''}>Previous</Button>
                            {currentStep < steps.length ?
                                <Button onClick={handleNext} disabled={!isStepComplete(currentStep)}>Next Step<ArrowRight size={16} className="ml-2" /></Button>
                                :
                                <Button onClick={() => setIsPreviewVisible(true)} variant="primary" disabled={!isStepComplete(currentStep)}>Finish & Review</Button>
                            }
                        </div>
                    </header>

                    <main className="flex-1 p-8 overflow-y-auto">
                        {renderStep()}
                    </main>
                </div>
            </div>

            {isPreviewVisible && <PreviewModal config={config} onClose={() => setIsPreviewVisible(false)} setView={setView} />}
        </div>
    );
}

export default MigrationWizard;
