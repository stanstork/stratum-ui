import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../App";
import { useTheme } from "../context/ThemeContext";
import apiClient from "../services/apiClient";
import { JobExecution } from "../types/JobExecution";
import { CardContent, CardHeader, MotionCard, Spinner, StatusBadge } from "../components/common/Helper";
import { easeOut, motion, Variants } from "framer-motion";
import { RunningJobsIcon, StatCard, SuccessRateIcon, TotalDefinitionsIcon, TotalExecutionsIcon } from "../components/icons/Helper";
import DailyLineChart from "../components/common/DailyLineChart";
import { ExecutionStat } from "../types/ExecutionStat";

type ChartDataItem = { name: string; Succeeded: number; Failed: number; InProgress: number };
type Stats = {
    totalExecutions: number;
    successRate: string; // percentage as string
    inProgress: number;
    totalDefs: number;
    chartData: ChartDataItem[];
};

const Dashboard = () => {
    const [recentExecutions, setRecentExecutions] = useState<JobExecution[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalExecutions: 0,
        successRate: '0.00',
        inProgress: 0,
        totalDefs: 0,
        chartData: [],
    });
    const [loading, setLoading] = useState(true);
    const { setPage, setViewDefinitionId, setViewExecutionId, setFromPage } = useAppContext();
    const { user } = useAuth();
    const { theme } = useTheme();

    useEffect(() => {
        const processData = (stat: ExecutionStat) => {
            const chartData = [] as Array<ChartDataItem>;
            for (let offset = stat.perDay.length - 1; offset >= 0; offset--) {
                console.log(`Processing day ${offset} with date ${stat.perDay[offset].day}`);
                const bucket = new Date(stat.perDay[offset].day);

                // Label for the X-axis
                const name = bucket.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                }); // e.g. "Jun 12"

                // Tally statuses
                const succeeded = stat.perDay[offset].succeeded;
                const failed = stat.perDay[offset].failed;
                const inProgress = stat.perDay[offset].running;

                chartData.push({ name, Succeeded: succeeded, Failed: failed, InProgress: inProgress });
            }

            setStats({
                totalExecutions: stat.total,
                successRate: stat.successRate.toFixed(2),
                inProgress: stat.running,
                totalDefs: stat.totalDefinitions,
                chartData,
            });
        };

        const fetchData = async () => {
            try {
                const [executions, stats] = await Promise.all([apiClient.getJobExecutions(), apiClient.getExecutionStats()]);
                setRecentExecutions(executions.slice(0, 10));
                processData(stats);
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
                <MotionCard custom={0} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-4 lg:col-span-2"><StatCard title="Executions" value={stats.totalExecutions} icon={<TotalExecutionsIcon />} /></MotionCard>
                <MotionCard custom={1} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-4 lg:col-span-2"><StatCard title="Success Rate" value={`${stats.successRate}%`} icon={<SuccessRateIcon />} /></MotionCard>
                <MotionCard custom={2} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-2 lg:col-span-1"><StatCard title="In Progress" value={stats.inProgress} icon={<RunningJobsIcon />} /></MotionCard>
                <MotionCard custom={3} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-2 lg:col-span-1"><StatCard title="Definitions" value={stats.totalDefs} icon={<TotalDefinitionsIcon />} /></MotionCard>

                <MotionCard custom={4} variants={bentoVariants} initial="hidden" animate="visible" className="col-span-4 lg:col-span-2 row-span-2">
                    <CardHeader>Daily Executions (Last 31 Days)</CardHeader>
                    <CardContent className="h-80">
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

