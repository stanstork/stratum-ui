export type StatusType = 'valid' | 'invalid' | 'testing' | 'untested';

export interface ConnectionDTO {
    id: string;
    name: string;
    data_format: string;
    host: string;
    port: number;
    username: string;
    password?: string; // optional, not stored directly
    db_name: string;
    status: string; // StatusType as string
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
}

export interface ConnectionTestResult {
    error: string | null;
    logs: string | null;
    status: string;
}

export interface Connection {
    id: string;
    name: string;
    dataFormat: string;
    host: string;
    port: number;
    username: string;
    password?: string; // optional, not stored directly
    dbName: string;
    status: StatusType;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}

export function mapConnection(dto: ConnectionDTO): Connection {
    return {
        id: dto.id,
        name: dto.name,
        dataFormat: dto.data_format,
        host: dto.host,
        port: dto.port,
        username: dto.username,
        password: dto.password,
        dbName: dto.db_name,
        status: dto.status as StatusType,
        createdAt: dto.created_at,
        updatedAt: dto.updated_at
    }
}

export function emptyConnection(): Connection {
    return {
        id: '',
        name: '',
        dataFormat: '',
        host: '',
        port: 0,
        username: '',
        password: undefined,
        dbName: '',
        status: 'untested',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

export function createConnectionString(conn: Connection): string {
    if (conn.dataFormat === 'PostgreSQL') {
        return `postgresql://${conn.username}:${conn.password}@${conn.host}:${conn.port}/${conn.dbName}`;
    } else if (conn.dataFormat === 'MySQL') {
        return `mysql://${conn.username}:${conn.password}@${conn.host}:${conn.port}/${conn.dbName}`;
    }
    return '';
}