import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { JobDefinition, JobDefinitionDTO, mapJobDefinition } from "../types/JobDefinition";
import { JobExecution, JobExecutionDTO, mapJobExecution } from "../types/JobExecution";
import { emptyExecutionStat, ExecutionStat, mapExecutionStat } from "../types/ExecutionStat";

interface ApiClient extends AxiosInstance {
    getJobExecutions: () => Promise<JobExecution[]>;
    getJobDefinitions: () => Promise<JobDefinition[]>;
    getExecutionStats: () => Promise<ExecutionStat>;
    login: (username: string, password: string) => Promise<string>;
    logout: () => void;
}

const apiClient: ApiClient = axios.create({
    baseURL: "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json",
    }
}) as ApiClient;

// Enable credentials for cross-origin requests
apiClient.defaults.withCredentials = true;

// Attach the token from localStorage to each request
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle global responses (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            apiClient.logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

apiClient.login = async (email: string, password: string): Promise<string> => {
    const response = await apiClient.post<{ token: string }>('/login', { email, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return token;
};

apiClient.logout = (): void => {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
};

apiClient.getJobDefinitions = async (): Promise<JobDefinition[]> => {
    const response = await apiClient.get<JobDefinitionDTO[]>('/jobs');
    const dtoList = response.data ?? [];
    return dtoList.map(mapJobDefinition);
};

apiClient.getJobExecutions = async (): Promise<JobExecution[]> => {
    const response = await apiClient.get<JobExecutionDTO[]>('/jobs/executions');
    const dtoList = response.data ?? [];
    return dtoList.map(mapJobExecution);
};

apiClient.getExecutionStats = async () => {
    const response = await apiClient.get('/jobs/executions/stats');
    if (!response.data) {
        return emptyExecutionStat();
    }
    return mapExecutionStat(response.data);
}

export default apiClient;