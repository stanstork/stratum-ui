import { HTMLMotionProps, motion } from "framer-motion";
import { Database, HardDrive, Server, Snowflake } from "lucide-react";
import React from "react";

export const pageVariants = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } };
export const Spinner = () => <div className="flex justify-center items-center h-full p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;

export type MotionCardProps = React.HTMLAttributes<HTMLDivElement> & HTMLMotionProps<'div'>;
export const MotionCard = motion(
    React.forwardRef<HTMLDivElement, MotionCardProps>((props, ref) => {
        const { children, className, ...rest } = props;
        return (
            <div ref={ref} className={className} {...rest}>
                {children}
            </div>
        );
    })
);

type CardHeaderProps = {
    children: React.ReactNode;
    actions?: React.ReactNode;
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, actions }) => (
    <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{children}</h3>
        {actions && <div className="ml-4 flex items-center space-x-4">{actions}</div>}
    </div>
);

type CardContentProps = {
    children: React.ReactNode;
    className?: string;
};

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
    <div className={`p-6 ${className}`}>{children}</div>
);

type StatusBadgeProps = {
    status: 'succeeded' | 'failed' | 'running' | string;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const statusStyles: Record<'succeeded' | 'failed' | 'running', string> = {
        'succeeded': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        'failed': 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
        'running': 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
    };
    const style = (status in statusStyles)
        ? statusStyles[status as 'succeeded' | 'failed' | 'running']
        : 'bg-gray-100 text-gray-800';
    return (
        <div className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${style}`}>
            {status === 'running' && <div className="w-2 h-2 bg-sky-500 dark:bg-sky-400 rounded-full mr-2 animate-pulse"></div>}
            {status}
        </div>
    );
};

// A simple component to get a representative icon for the DB type
export const DatabaseIcon = ({ type, className }: { type: string | null, className?: string }) => {
    // Default to white text, but allow override for specific cases (like the summary section in light mode)
    const finalClassName = className || "w-6 h-6 text-white";
    const iconProps = { className: finalClassName };

    switch (type?.toLowerCase()) {
        case 'pg':
            return <Database {...iconProps} />;
        case 'mysql':
            return <Database {...iconProps} />;
        case 'snowflake':
            return <Snowflake {...iconProps} />;
        default:
            return <HardDrive {...iconProps} />;
    }
};

export const getConnectionIcon = (type: string, size?: number) => {
    switch (type) {
        case "mysql":
            return <Database className="text-orange-500 dark:text-orange-400" size={size || 16} />;
        case "postgresql":
        case "postgres":
        case "pg":
            return <Database className="text-blue-500 dark:text-blue-400" size={size || 16} />;
        case "s3":
            return <Database className="text-orange-600 dark:text-orange-400" size={size || 16} />;
        default:
            return <Database className="text-gray-600 dark:text-gray-400" size={size || 16} />;
    }
};