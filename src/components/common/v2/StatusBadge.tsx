interface StatusBadgeProps {
    status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
    const base = "px-2.5 py-0.5 text-xs font-medium rounded-full inline-block";
    let className;
    switch (status) {
        case "Completed":
            className = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
            break;
        case "Running":
            className = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 animate-pulse";
            break;
        case "Failed":
            className = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
            break;
        default:
            className = "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300";
    }
    return <span className={`${base} ${className}`}>{status}</span>;
};

export default StatusBadge;