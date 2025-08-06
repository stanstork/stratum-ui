
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "./common/v2/Card";

type ChartDataItem = { name: string; Succeeded: number; Failed: number; Running: number };

interface MigrationChartProps {
    isDarkMode: boolean;
    chartData: ChartDataItem[];
}

const MigrationChart = ({ isDarkMode, chartData }: MigrationChartProps) => {
    const tickColor = isDarkMode ? '#94a3b8' : '#64748b';

    return (
        <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
            <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-700/80 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Daily Migration Runs</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total runs per day, categorized by status.</p>
                </div>
            </div>
            <div className="p-6 h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: tickColor }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDarkMode ? '#1e293b' : 'white',
                                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                            }}
                            labelStyle={{ color: isDarkMode ? '#cbd5e1' : '#1e293b' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                        <Line type="monotone" dataKey="Succeeded" stroke="#22c55e" strokeWidth={2} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Failed" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Running" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default MigrationChart;