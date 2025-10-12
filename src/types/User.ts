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