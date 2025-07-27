import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import apiClient from "../services/apiClient";
import { JobExecution } from "../types/JobExecution";
import { Spinner, StatusBadge } from "../components/common/Helper";
import { easeOut, Variants } from "framer-motion";
import { ExecutionStat } from "../types/ExecutionStat";
import { Plus } from "lucide-react";
import Card from "../components/common/Card";
import CardHeader from "../components/common/CardHeader";
import Button from "../components/common/Button";
import MigrationChart from "../components/MigrationChart";

type ChartDataItem = { name: string; Succeeded: number; Failed: number; Running: number };
type Stats = {
    totalExecutions: number;
    successRate: string; // percentage as string
    inProgress: number;
    totalDefs: number;
    chartData: ChartDataItem[];
};

type DashboardProps = {
    setView: (view: string, params?: any) => void;
    isDarkMode: boolean;
};

const Dashboard = ({ setView, isDarkMode }: DashboardProps) => {
    const [recentExecutions, setRecentExecutions] = useState<JobExecution[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalExecutions: 0,
        successRate: '0.00',
        inProgress: 0,
        totalDefs: 0,
        chartData: [],
    });
    const [loading, setLoading] = useState(true);
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
                const running = stat.perDay[offset].running;

                chartData.push({ name, Succeeded: succeeded, Failed: failed, Running: running });
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
        <>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
                <Button onClick={() => setView('wizard')}><Plus size={16} className="mr-2" />Create New Migration</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"><h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Total Definitions</h3><p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.totalDefs}</p></Card>
                <Card className="p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"><h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Success Rate</h3><p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.successRate}</p></Card>
                <Card className="p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"><h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Total Runs</h3><p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.totalExecutions}</p></Card>
            </div>
            <div className="mb-8">
                <MigrationChart isDarkMode={isDarkMode} chartData={stats.chartData} />
            </div>
            <Card>
                <CardHeader title="Last 10 Runs" actions={<Button variant="secondary" onClick={() => setView('executions')}>View All</Button>} />
                <div className="p-2">
                    <table className="w-full text-left">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase"><tr><th className="p-4">Execution Id</th><th className="p-4">Run Date</th><th className="p-4">Status</th></tr></thead>
                        <tbody className="text-sm">
                            {recentExecutions.map(run => {
                                return (
                                    <tr key={run.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => setView('runDetails', { runId: run.id })}>
                                        <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{run.id}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">{run.createdAt.toDateString()}</td>
                                        <td className="p-4"><StatusBadge status={run.status} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
}
export default Dashboard;

