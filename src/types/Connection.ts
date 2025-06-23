export type StatusType = 'valid' | 'invalid' | 'testing' | 'untested';

export interface ConnectionDTO {
    id: string;
    name: string;
    data_format: string;
    conn_string: string;
    status: string; // StatusType as string
}

export interface ConnectionTestResult {
    error: string | null;
    logs: string | null;
    status: string;
}

export interface Connection {
    id: string;
    name: string;
    format: string;
    connStr: string;
    status: StatusType;
};

export function mapConnection(dto: ConnectionDTO): Connection {
    return {
        id: dto.id,
        name: dto.name,
        format: dto.data_format,
        connStr: dto.conn_string,
        status: dto.status as StatusType
    };
}

export function emptyConnection(): Connection {
    return {
        id: '',
        name: '',
        format: 'MySql',
        connStr: '',
        status: 'untested'
    };
}