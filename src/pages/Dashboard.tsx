import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../App";
import { useTheme } from "../context/ThemeContext";
import apiClient from "../services/apiClient";
import { JobExecution } from "../types/JobExecution";
import { JobDefinition } from "../types/JobDefinition";
import { CardContent, CardHeader, MotionCard, Spinner, StatCard, StatusBadge } from "../components/common/Helper";
import { easeOut, motion, Variants } from "framer-motion";
import { CheckCircleIcon, ClockIcon, FileTextIcon, LoaderIcon } from "../components/icons/Helper";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { makeDayKey } from "../utils/dateBuckets";
import DailyLineChart from "../components/common/DailyLineChart";

type ChartDataItem = { name: string; Succeeded: number; Failed: number; InProgress: number };
type Stats = {
    totalExecutions: number;
    successRate: number;
    inProgress: number;
    totalDefs: number;
    chartData: ChartDataItem[];
};

const Dashboard = () => {
    const [recentExecutions, setRecentExecutions] = useState<JobExecution[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalExecutions: 0,
        successRate: 0,
        inProgress: 0,
        totalDefs: 0,
        chartData: [],
    });
    const [loading, setLoading] = useState(true);
    const { setPage, setViewDefinitionId, setViewExecutionId, setFromPage } = useAppContext();
    const { user } = useAuth();
    const { theme } = useTheme();

    useEffect(() => {
        const processData = (executions: JobExecution[], definitions: JobDefinition[]) => {
            const totalExecutions = executions.length;
            const successCount = executions.filter(ex => ex.status === 'succeeded').length;
            const failed = executions.filter(ex => ex.status === 'failed').length;
            const successRate = (successCount + failed) > 0 ? Math.round((successCount / (successCount + failed)) * 100) : 100;
            const inProgress = executions.filter(ex => ex.status == 'running').length;

            const chartData = [] as Array<ChartDataItem>;
            for (let offset = 30; offset >= 0; offset--) {
                const bucket = new Date();
                bucket.setHours(0, 0, 0, 0);
                bucket.setDate(bucket.getDate() - offset);

                // Label for the X-axis
                const name = bucket.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                }); // e.g. "Jun 12"

                const dayKey = makeDayKey(bucket);

                // Filter executions that started exactly on this day
                const dayExecs = executions.filter((e) => {
                    if (!e.runStartedAt) return false;
                    const runDate = new Date(e.runStartedAt);
                    const runKey = makeDayKey(runDate);
                    return runKey === dayKey;
                });

                // Tally statuses
                const succeeded = dayExecs.filter((e) => e.status === 'succeeded').length;
                const failed = dayExecs.filter((e) => e.status === 'failed').length;
                const inProgress = dayExecs.filter((e) => e.status === 'running').length;

                chartData.push({ name, Succeeded: succeeded, Failed: failed, InProgress: inProgress });
            }

            setStats({
                totalExecutions,
                successRate,
                inProgress,
                totalDefs: definitions.length,
                chartData,
            });
        };

        const fetchData = async () => {
            try {
                const [executions, definitions] = await Promise.all([apiClient.getJobExecutions(), apiClient.getJobDefinitions()]);
                setRecentExecutions(executions.slice(0, 10));
                processData(executions, definitions);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const handleExecutionClick = (executionId: string) => {
        setViewExecutionId(executionId);
        setPage('execution');
        setFromPage('dashboard');
    };

    const bentoVariants: Variants = {
        hidden: {
            opacity: 0,
            y: 20,
        },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.5,
                ease: easeOut,
            },
        }),
    };

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome back, {user?.email}!</motion.h1>

            <motion.div className="grid grid-cols-4 gap-6">
                <MotionCard custom={0} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-4 lg:col-span-2"><StatCard title="Executions" value={stats.totalExecutions} icon={<ClockIcon />} /></MotionCard>
                <MotionCard custom={1} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-4 lg:col-span-2"><StatCard title="Success Rate" value={`${stats.successRate}%`} icon={<CheckCircleIcon />} /></MotionCard>
                <MotionCard custom={2} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-2 lg:col-span-1"><StatCard title="In Progress" value={stats.inProgress} icon={<LoaderIcon />} /></MotionCard>
                <MotionCard custom={3} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-2 lg:col-span-1"><StatCard title="Definitions" value={stats.totalDefs} icon={<FileTextIcon />} /></MotionCard>

                <MotionCard custom={4} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-4 lg:col-span-2 row-span-2">
                    <CardHeader>Daily Executions (Last 31 Days)</CardHeader>
                    <CardContent className="h-80">
                        {/* <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={stats.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.1)' }} cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                <Legend wrapperStyle={{ color: theme === 'dark' ? '#e5e7eb' : '#374151' }} />
                                <Bar dataKey="Succeeded" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Failed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart> 
                        </ResponsiveContainer> */}
                        <DailyLineChart data={stats.chartData} theme={theme} />
                    </CardContent>
                </MotionCard>

                <MotionCard custom={5} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-4 lg:col-span-2 row-span-2">
                    <CardHeader>Recent Job Executions</CardHeader>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50/50 dark:bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Execution ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Started At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {recentExecutions.map(exec => (
                                    <motion.tr key={exec.id} whileHover={{ scale: 1.02 }} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={exec.status} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                                            <a href="#" onClick={(e) => { e.preventDefault(); handleExecutionClick(exec.id); }} className="text-sky-600 dark:text-sky-400 hover:text-sky-800 font-medium">{exec.id.substring(0, 10)}...</a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {exec.runStartedAt ? new Date(exec.runStartedAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </MotionCard>
            </motion.div>
        </div>
    );
}
export default Dashboard;

