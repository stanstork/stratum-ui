import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';
import apiClient from '../services/apiClient';

interface User {
    token: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');
        if (token && email) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return { token, email };
        }
        return null;
    });

    const login = async (username: string, password: string) => {
        const token = await apiClient.login(username, password);
        setUser({ token, email: username });
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