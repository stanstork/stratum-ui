import { useEffect, useState } from "react";
import { emptyMigrationConfig, MigrationConfig } from "../types/MigrationConfig";
import { ArrowRight, ArrowRightLeft, Check, Database, FileText, Filter, Link2, Loader, Settings, Table } from "lucide-react";
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
};

const MigrationWizard = ({ onBack }: MigrationWizardProps) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [config, setConfig] = useState<MigrationConfig>(emptyMigrationConfig());
    const [metadata, setMetadata] = useState<Record<string, TableMetadata> | null>(null);
    const [isMetadataLoading, setIsMetadataLoading] = useState(false);

    // Effect to fetch metadata when the source connection changes
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
                setMetadata(null); // Clear metadata on error to prevent using stale data
            } finally {
                setIsMetadataLoading(false);
            }
        };

        loadMetadata();
    }, [config.connections.source?.id]);

    // Effect to manage body scroll when modal is open
    useEffect(() => {
        if (isPreviewVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isPreviewVisible]);


    // Step completion validation
    const isStep1Complete = !!config.name?.trim();
    const isStep2Complete = !!config.connections.source?.id && !!config.connections.dest?.id;
    const isStep3Complete = !!config.migration.migrateItems[0]?.source.names?.[0] && !!config.migration.migrateItems[0]?.destination.names?.[0];


    const steps = [
        { num: 1, title: 'Details', icon: <FileText size={20} />, isComplete: isStep1Complete, disabled: false },
        { num: 2, title: 'Connections', icon: <Database size={20} />, isComplete: isStep2Complete, disabled: !isStep1Complete },
        { num: 3, title: 'Source Table', icon: <Table size={20} />, isComplete: isStep3Complete, disabled: !isStep2Complete },
        { num: 4, title: 'Joins', icon: <Link2 size={20} />, disabled: !isStep3Complete },
        { num: 5, title: 'Column Mapping', icon: <ArrowRightLeft size={20} />, disabled: !isStep3Complete },
        { num: 6, title: 'Filters', icon: <Filter size={20} />, disabled: !isStep3Complete },
        { num: 7, title: 'Settings', icon: <Settings size={20} />, disabled: !isStep3Complete },
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
            default: return <Step1_Details config={config} setConfig={setConfig} />;
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length) {
            // Find the next step that is not disabled
            for (let i = currentStep; i < steps.length; i++) {
                if (!steps[i].disabled) {
                    setCurrentStep(i + 1);
                    return;
                }
            }
        }
    };

    const handlePrev = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

    const isNextDisabled = () => {
        switch (currentStep) {
            case 1: return !isStep1Complete;
            case 2: return !isStep2Complete;
            case 3: return !isStep3Complete;
            default: return false; // Subsequent steps are optional or have defaults
        }
    };

    const onComplete = () => {
        // Here you would typically send the config to the backend or perform the migration
        console.log("Migration configuration completed:", config);
        // setIsPreviewVisible(false);
        // onBack(); // Navigate back to the dashboard or previous view
    };

    return (
        <>
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">Configure Data Migration</h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">A step-by-step wizard to set up your data transfer.</p>
            </header>
            <div className="mb-10 max-w-4xl mx-auto">
                <ol className="flex items-center w-full">
                    {steps.map((step, index) => {
                        const isCompleted = step.isComplete || currentStep > step.num;
                        const isActive = currentStep === step.num;
                        return (
                            <li key={step.num} className="flex w-full items-center">
                                <button onClick={() => !step.disabled && setCurrentStep(step.num)} disabled={step.disabled} className="flex flex-col items-center justify-center w-24 text-center group disabled:cursor-not-allowed">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0 transition-colors duration-300 border-2 ${isActive ? 'bg-indigo-600 border-indigo-600 text-white' : isCompleted ? 'bg-white dark:bg-slate-700 border-indigo-600 text-indigo-600 dark:text-indigo-300' : step.disabled ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 group-hover:border-slate-400 dark:group-hover:border-slate-500'}`}>
                                        {isCompleted ? <Check size={24} /> : step.icon}
                                    </div>
                                    <div className="mt-2">
                                        <h3 className={`font-medium text-xs ${isActive ? 'text-indigo-600 dark:text-indigo-300' : step.disabled ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>{step.title}</h3>
                                    </div>
                                </button>
                                {index < steps.length - 1 && <div className={`flex-auto border-t-2 transition duration-500 ${isCompleted ? 'border-indigo-600' : 'border-slate-200 dark:border-slate-700'}`}></div>}
                            </li>
                        );
                    })}
                </ol>
            </div>
            <div className="mb-8">{renderStep()}</div>
            <div className="flex justify-between items-center mt-10">
                <Button onClick={onBack} variant="secondary">Back to Dashboard</Button>
                <div className="flex gap-3">
                    <Button onClick={handlePrev} variant="secondary" className={currentStep === 1 ? 'invisible' : ''}>Previous</Button>
                    {currentStep < steps.length ?
                        <Button onClick={handleNext} disabled={isNextDisabled()}>Next Step<ArrowRight size={16} className="ml-2" /></Button>
                        :
                        <Button onClick={() => setIsPreviewVisible(true)} variant="primary">Finish & Review</Button>
                    }
                </div>
            </div>
            {isPreviewVisible && <PreviewModal config={config} onClose={() => setIsPreviewVisible(false)} onConfirm={onComplete} />}
        </>
    );
}

export default MigrationWizard;
