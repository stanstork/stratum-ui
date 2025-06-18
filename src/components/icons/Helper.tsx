import { motion } from "framer-motion";
import Card from "../common/Card";

const Icon: React.FC<React.SVGProps<SVGSVGElement>> = ({ children, className = "w-6 h-6", path }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d={path} /></svg>
    );
}

export const SunIcon = () => <Icon path="M12 2c-5.514 0-10 4.486-10 10s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zM12 5c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm0 12c-2.757 0-5-2.243-5-5s2.243-5 5-5 5 2.243 5 5-2.243 5-5 5z" className="w-6 h-6" />;
export const MoonIcon = () => <Icon path="M12 2.062C6.513 2.062 2.062 6.513 2.062 12c0 5.487 4.451 9.938 9.938 9.938 2.031 0 3.92-.615 5.51-1.693-1.764-.78-3.235-2.25-3.99-4.004-1.258-2.926-.26-6.42 2.666-7.678-.59-.047-1.18-.063-1.772-.063z" className="w-6 h-6" />;
export const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

export const TotalExecutionsIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
    </svg>
);

export const RunningJobsIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
    </svg>
);

export const TotalDefinitionsIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
    </svg>
);

export const SuccessRateIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
    </svg>
);

type StatCardProps = {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtext?: string;
};

export const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtext }) => {
    return (
        <Card className="p-2">
            <div className="flex items-center">
                <motion.div whileHover={{ scale: 1.1, rotate: -5 }} className="flex-shrink-0 bg-sky-500 shadow-lg shadow-sky-500/30 rounded-xl p-4">
                    {icon}
                </motion.div>
                <div className="ml-5">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
                    <dd className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</dd>
                </div>
            </div>
        </Card>
    );
};
