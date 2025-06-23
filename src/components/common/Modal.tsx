type ModalProps = {
    children: React.ReactNode;
    onClose: () => void;
};

const Modal = ({ children, onClose }: ModalProps) => (
    <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
    >
        <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl"
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

export default Modal;