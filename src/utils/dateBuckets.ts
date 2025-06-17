import { JobExecution } from "../types/JobExecution";

export interface DateCount {
    date: string;   // YYYY-MM-DD
    count: number;  // number of executions that day
}

export function bucketExecutionsByDay(execs: JobExecution[]): DateCount[] {
    const map: Record<string, number> = {};
    execs.forEach((e) => {
        const day = e.createdAt.toISOString().slice(0, 10);
        map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
}

export function makeDayKey(date: Date): string {
    const y = date.getFullYear();
    const m = date.getMonth() + 1; // zero-based
    const d = date.getDate();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${y}-${pad(m)}-${pad(d)}`;
}