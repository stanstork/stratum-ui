// src/components/common/CumulativeLineChart.tsx
import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Bar,
    Legend,
} from 'recharts';

export interface DailyExecutionData {
    name: string;       // e.g., 'Jun 12'
    Succeeded: number;
    Failed: number;
}

interface DailyLineChartProps {
    data: DailyExecutionData[];
    theme: string; // 'light' or 'dark'
}

const DailyLineChart: React.FC<DailyLineChartProps> = ({ data, theme }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', borderRadius: '0.75rem', border: '1px solid rgba(0,0,0,0.1)' }} cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                <Line
                    type="monotone"
                    dataKey="Succeeded"
                    stroke="#4caf50"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                />
                <Line
                    type="monotone"
                    dataKey="Failed"
                    stroke="#f44336"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                />
                <Legend verticalAlign="bottom" height={36} />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default DailyLineChart;
