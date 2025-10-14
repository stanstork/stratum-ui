export interface UserDTO {
    id: string;
    tenant_id: string;
    email: string;
    is_active: boolean;
    roles: string[];
}

export interface User {
    id: string;
    tenantId: string;
    email: string;
    isActive: boolean;
    roles: string[];
}

export const mapUser = (dto: UserDTO): User => ({
    id: dto.id,
    tenantId: dto.tenant_id,
    email: dto.email,
    isActive: dto.is_active,
    roles: dto.roles,
});

export interface InviteDTO {
    id: string;
    email: string;
    roles: string[];
    expires_at: string; // ISO date string
    accepted_at: string | null; // ISO date string or null
    created_at: string; // ISO date string
    created_by: string; // user ID of the inviter
}

export interface Invite {
    id: string;
    email: string;
    roles: string[];
    expiresAt: Date;
    acceptedAt: Date | null;
    createdAt: Date;
    createdBy: string; // user ID of the inviter
}

export const mapInvite = (dto: InviteDTO): Invite => ({
    id: dto.id,
    email: dto.email,
    roles: dto.roles,
    expiresAt: new Date(dto.expires_at),
    acceptedAt: dto.accepted_at ? new Date(dto.accepted_at) : null,
    createdAt: new Date(dto.created_at),
    createdBy: dto.created_by,
});