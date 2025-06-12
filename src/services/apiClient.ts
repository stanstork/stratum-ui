import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

interface ApiClient extends AxiosInstance {
    login: (username: string, password: string) => Promise<string>;
    logout: () => void;
}

const apiClient: ApiClient = axios.create({
    baseURL: "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json",
    }
}) as ApiClient;

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

apiClient.login = async (username: string, password: string): Promise<string> => {
    const response = await apiClient.post<{ token: string }>('/login', { username, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return token;
};

apiClient.logout = (): void => {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
};

export default apiClient;