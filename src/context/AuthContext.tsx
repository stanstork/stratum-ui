import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';
import apiClient from '../services/apiClient';

interface User {
    token: string;
    email: string;
    roles: string[];
    isAdmin: boolean;
    displayName: string;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type JwtPayload = Record<string, unknown>;

const decodeBase64Url = (input: string): string => {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (base64.length % 4)) % 4;
    const padded = base64.padEnd(base64.length + padding, '=');

    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
        return window.atob(padded);
    }

    if (typeof Buffer !== 'undefined') {
        return Buffer.from(padded, 'base64').toString('binary');
    }

    throw new Error('No base64 decoder available in this environment.');
};

const decodeJwtPayload = (token: string): JwtPayload | null => {
    const parts = token?.split('.');
    if (!parts || parts.length < 2) {
        return null;
    }

    try {
        const decodedString = decodeBase64Url(parts[1]);
        return JSON.parse(decodedString);
    } catch (error) {
        console.warn('Failed to decode token payload', error);
        return null;
    }
};

const extractRoles = (payload: JwtPayload | null): string[] => {
    if (!payload) {
        return [];
    }

    const roles: string[] = [];

    const pushIfArray = (value: unknown) => {
        if (Array.isArray(value)) {
            roles.push(
                ...value.filter((entry): entry is string => typeof entry === 'string')
            );
        }
    };

    pushIfArray(payload.roles);
    pushIfArray(payload.authorities);
    pushIfArray(payload.scopes);

    if (typeof payload.role === 'string') {
        roles.push(payload.role);
    }

    const realmAccess = payload.realm_access as { roles?: unknown } | undefined;
    if (realmAccess) {
        pushIfArray(realmAccess.roles);
    }

    const resourceAccess = payload.resource_access as Record<string, { roles?: unknown }> | undefined;
    if (resourceAccess) {
        Object.values(resourceAccess).forEach((resource) => {
            if (resource) {
                pushIfArray(resource.roles);
            }
        });
    }

    return Array.from(new Set(roles));
};

const determineIsAdmin = (payload: JwtPayload | null, roles: string[]): boolean => {
    if (!payload) {
        return false;
    }

    const roleMatches = roles.some(
        (role) => typeof role === 'string' && role.toLowerCase().includes('admin')
    );

    if (roleMatches) {
        return true;
    }

    const roleField = typeof payload.role === 'string' ? payload.role : '';
    const flags = [
        payload.is_admin,
        payload.admin,
        roleField
    ];

    return flags.some((value) => {
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            return value.toLowerCase().includes('admin');
        }
        return false;
    });
};

const deriveDisplayName = (payload: JwtPayload | null, fallback: string): string => {
    if (!payload) {
        return fallback;
    }

    const candidates = [
        payload.name,
        payload.preferred_username,
        payload.username,
        payload.given_name && payload.family_name ? `${payload.given_name} ${payload.family_name}` : null
    ];

    const name = candidates.find(
        (value): value is string => typeof value === 'string' && value.trim().length > 0
    );

    return name || fallback;
};

const buildUser = (token: string, email: string): User => {
    const payload = decodeJwtPayload(token);
    const roles = extractRoles(payload);
    const isAdmin = determineIsAdmin(payload, roles);
    const displayName = deriveDisplayName(payload, email);

    return {
        token,
        email,
        roles,
        isAdmin,
        displayName
    };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');
        if (token && email) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return buildUser(token, email);
        }
        return null;
    });

    const login = async (username: string, password: string) => {
        const token = await apiClient.login(username, password);
        setUser(buildUser(token, username));
    };

    const logout = () => {
        apiClient.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
