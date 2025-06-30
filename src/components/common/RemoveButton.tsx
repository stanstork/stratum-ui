import { X } from "lucide-react";
import React from "react";

type RemoveButtonProps = {
    onClick: React.MouseEventHandler<HTMLButtonElement>;
};

const RemoveButton = ({ onClick }: RemoveButtonProps) => (
    <button
        onClick={onClick}
        className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
    >
        <X size={20} />
    </button>
);

export default RemoveButton;