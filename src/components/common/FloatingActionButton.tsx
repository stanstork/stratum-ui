import { Plus } from "lucide-react";
import React from "react";

type FloatingActionButtonProps = {
    onClick: React.MouseEventHandler<HTMLButtonElement>;
};

const FloatingActionButton = ({ onClick }: FloatingActionButtonProps) => (
    <button
        onClick={onClick}
        className="fixed bottom-8 right-8 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-full p-4 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all transform hover:scale-110"
        aria-label="Add Migration Task"
    >
        <Plus size={24} />
    </button>
);

export default FloatingActionButton;