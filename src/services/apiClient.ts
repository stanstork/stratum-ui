import axios, { AxiosInstance } from "axios";
import { JobDefinition, JobDefinitionDTO, mapJobDefinition } from "../types/JobDefinition";
import { JobExecution, JobExecutionDTO, mapJobExecution } from "../types/JobExecution";
import { emptyExecutionStat, ExecutionStat, JobDefinitionStat, JobDefinitionStatDTO, mapExecutionStat, mapJobDefinitionStat } from "../types/ExecutionStat";
import { Connection, ConnectionDTO, ConnectionTestResult, mapConnection, mapFrontendDataFormatToBackend } from "../types/Connection";
import { mapMetadataResponse, MetadataResponse, TableMetadata } from "../types/Metadata";
import { getMigrationDTO, MigrationConfig } from "../types/MigrationConfig";
import { DryRunReport, DryRunReportEntityDTO, mapDryRunReport } from "../types/DryRun";
import { Invite, InviteDTO, mapInvite, mapUser, User, UserDTO } from "../types/User";

interface ApiClient extends AxiosInstance {
    getConnectionById: (connectionId: string) => Promise<Connection | null>;
    updateJobDefinition: (definitionId: string, config: MigrationConfig) => Promise<JobDefinition>;
    getJobDefinition: (definitionId: string) => Promise<JobDefinition>;
    getJobExecution: (executionId: string) => Promise<JobExecution>;
    runJob: (definitionId: string) => Promise<void>;
    testConnectionById: (connectionId: string) => Promise<ConnectionTestResult>;
    deleteJobDefinition: (definitionId: string) => Promise<void>;
    createJobDefinition: (config: MigrationConfig) => Promise<JobDefinition>;
    getMetadata: (connectionId: string) => Promise<{ [key: string]: TableMetadata; }>;
    deleteConnection: (connectionId: string) => Promise<void>;
    updateConnection: (connection: Connection) => Promise<Connection>;
    createConnection: (connection: Connection) => Promise<Connection>;
    testConnection: (dataFormat: string, connStr: string) => Promise<ConnectionTestResult>;
    listConnections: () => Promise<Connection[]>;
    getJobExecutions: () => Promise<JobExecution[]>;
    getJobDefinitions: () => Promise<JobDefinition[]>;
    getExecutionStats: () => Promise<ExecutionStat>;
    listJobDefinitionsWithStats: () => Promise<JobDefinitionStat[]>;
    getDryRunReport: (definitionId: string) => Promise<DryRunReport>;
    login: (username: string, password: string) => Promise<string>;
    logout: () => void;
    users: () => Promise<User[]>;
    updateUserRoles: (userId: string, roles: string[]) => Promise<void>;
    inviteUser: (email: string, roles: string[]) => Promise<Invite>;
    deleteUser: (userId: string) => Promise<void>;
    listInvites: () => Promise<Invite[]>;
    cancelInvite: (inviteId: string) => Promise<void>;
    getInvite: (token: string) => Promise<Invite>;
    acceptInvite: (token: string, password: string, firstName: string, lastName: string) => Promise<User>;
}

const apiClient: ApiClient = axios.create({
    baseURL: "http://localhost:8081/api",
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
    localStorage.removeItem('email');
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

apiClient.listConnections = async (): Promise<Connection[]> => {
    const response = await apiClient.get('/connections');
    const dtoList = response.data ?? [];
    return dtoList.map(mapConnection);
};

apiClient.testConnection = async (dataFormat: string, connStr: string): Promise<ConnectionTestResult> => {
    try {
        const response = await apiClient.post<ConnectionTestResult>('/connections/test', {
            format: dataFormat,
            dsn: connStr
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.status === 400) {
            return error.response.data;
        }
        throw error;
    }
};

apiClient.testConnectionById = async (connectionId: string): Promise<ConnectionTestResult> => {
    try {
        const response = await apiClient.post<ConnectionTestResult>(`/connections/${connectionId}/test`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.status === 400) {
            return error.response.data;
        }
        throw error;
    }
};

apiClient.createConnection = async (connection: Connection): Promise<Connection> => {
    const response = await apiClient.post<ConnectionDTO>('/connections', {
        name: connection.name,
        data_format: mapFrontendDataFormatToBackend(connection.dataFormat),
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password,
        db_name: connection.dbName,
        status: connection.status
    });
    return mapConnection(response.data);
};

apiClient.updateConnection = async (connection: Connection): Promise<Connection> => {
    const response = await apiClient.put<ConnectionDTO>(`/connections/${connection.id}`, {
        name: connection.name,
        data_format: mapFrontendDataFormatToBackend(connection.dataFormat),
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password,
        db_name: connection.dbName,
        status: connection.status
    });
    return mapConnection(response.data);
};

apiClient.deleteConnection = async (connectionId: string): Promise<void> => {
    await apiClient.delete(`/connections/${connectionId}`);
};

apiClient.getMetadata = async (connectionId: string): Promise<{ [key: string]: TableMetadata }> => {
    const response = await apiClient.get(`/connections/${connectionId}/metadata`);
    return mapMetadataResponse(response.data as MetadataResponse);
};

apiClient.createJobDefinition = async (config: MigrationConfig): Promise<JobDefinition> => {
    const response = await apiClient.post<JobDefinitionDTO>('/jobs', {
        name: config.name,
        description: config.description,
        ast: {
            migration: getMigrationDTO(config),
        },
        source_connection_id: config.connections.source.id,
        destination_connection_id: config.connections.dest.id
    });
    return mapJobDefinition(response.data);
};

apiClient.deleteJobDefinition = async (definitionId: string): Promise<void> => {
    await apiClient.delete(`/jobs/${definitionId}`);
};

apiClient.runJob = async (definitionId: string): Promise<void> => {
    await apiClient.post(`/jobs/${definitionId}/run`);
};

apiClient.getJobExecution = async (executionId: string): Promise<JobExecution> => {
    const response = await apiClient.get<JobExecutionDTO>(`/jobs/executions/${executionId}`);
    return mapJobExecution(response.data);
};

apiClient.getJobDefinition = async (definitionId: string): Promise<JobDefinition> => {
    const response = await apiClient.get<JobDefinitionDTO>(`/jobs/${definitionId}`);
    return mapJobDefinition(response.data);
};

apiClient.updateJobDefinition = async (definitionId: string, config: MigrationConfig): Promise<JobDefinition> => {
    const response = await apiClient.put<JobDefinitionDTO>(`/jobs/${definitionId}`, {
        name: config.name,
        description: config.description,
        ast: {
            migration: getMigrationDTO(config),
        },
        source_connection_id: config.connections.source.id,
        destination_connection_id: config.connections.dest.id
    });
    return mapJobDefinition(response.data);
};

apiClient.getConnectionById = async (connectionId: string): Promise<Connection | null> => {
    const response = await apiClient.get<ConnectionDTO>(`/connections/${connectionId}`);
    return mapConnection(response.data);
};

apiClient.listJobDefinitionsWithStats = async (): Promise<JobDefinitionStat[]> => {
    const response = await apiClient.get<JobDefinitionStatDTO[]>('/jobs/stats');
    return response.data.map(mapJobDefinitionStat);
};

apiClient.getDryRunReport = async (definitionId: string): Promise<DryRunReport> => {
    const response = await apiClient.post<Record<string, DryRunReportEntityDTO>>(`/reports/dry-run/${definitionId}`);
    const report = mapDryRunReport(response.data);
    console.log("Dry run report:", report);
    return report;
}

apiClient.users = async (): Promise<User[]> => {
    const response = await apiClient.get<UserDTO[]>('/users');
    return response.data.map(mapUser);
}

apiClient.listInvites = async (): Promise<Invite[]> => {
    const response = await apiClient.get<InviteDTO[]>('/users/invites');
    return response.data.map(mapInvite);
}

apiClient.cancelInvite = async (inviteId: string): Promise<void> => {
    await apiClient.delete(`/users/invites/${inviteId}`);
}

apiClient.inviteUser = async (email: string, roles: string[]): Promise<Invite> => {
    const response = await apiClient.post<InviteDTO>('/users/invites', { email, roles });
    return mapInvite(response.data);
}

apiClient.getInvite = async (token: string): Promise<Invite> => {
    const response = await apiClient.get<InviteDTO>(`/invites/${token}`);
    return mapInvite(response.data);
}

apiClient.acceptInvite = async (token: string, password: string, firstName: string, lastName: string): Promise<User> => {
    const response = await apiClient.post<UserDTO>(`/invites/${token}/accept`, { password, first_name: firstName, last_name: lastName });
    return mapUser(response.data);
}

apiClient.updateUserRoles = async (userId: string, roles: string[]): Promise<void> => {
    await apiClient.put(`/users/${userId}/roles`, { roles });
}

apiClient.deleteUser = async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
}

export default apiClient;
