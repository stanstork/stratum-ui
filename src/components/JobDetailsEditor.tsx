import { Calendar } from "lucide-react";
import Input from "./common/Input";
import Textarea from "./common/TextArea";

type JobDetailsEditorProps = {
    name: string;
    description: string;
    creation_date: string;
    onDetailChange: (field: string, value: string) => void;
};

const JobDetailsEditor = ({ name, description, creation_date, onDetailChange }: JobDetailsEditorProps) => {
    return (
        <div className="p-2 space-y-4">
            <Input label="Job Name" value={name} onChange={e => onDetailChange('name', e.target.value)} placeholder="e.g., Nightly User Sync" />
            <Textarea label="Description" value={description} onChange={e =>
                onDetailChange('description', e.target.value)} placeholder="A brief summary of what this job does." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center space-x-2 text-sm">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">{creation_date}</span>
                </div>
            </div>
        </div>
    )
}

export default JobDetailsEditor;