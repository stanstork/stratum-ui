import React, { createContext, useContext, useState, useEffect, JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/Login';
// import Dashboard from './pages/Dashboard';
import { ThemeProvider } from './context/ThemeContext';
import ConnectionsPage from './pages/Connections';
import MigrationDefinitionsList from './pages/MigrationDefinitionsList';
import MigrationWizard from './pages/MigrationWizard';
import MigrationRunDetails from './pages/MigrationRunDetails';
import MigrationRunsList from './pages/MigrationRunsList';
import MigrationDetailsPage from './pages/MIgrationDefinitionDetails';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddConnection from './pages/AddConnection';
import NotFound from './pages/NotFound';
import AdminUsers from './pages/AdminUsers';
import AcceptInvite from './pages/AcceptInvite';
import { Toaster } from './components/common/Toaster';

interface AppContextProps {
    page: string;
    setPage: (p: string) => void;
    fromPage: string;
    setFromPage: (p: string) => void;
    viewDefinitionId?: string;
    setViewDefinitionId: (id?: string) => void;
    viewExecutionId?: string;
    setViewExecutionId: (id?: string) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);
export const useAppContext = (): AppContextProps => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be inside AppProvider');
    return ctx;
};

// Wraps routes needing authentication
const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
};

const InnerApp: React.FC = () => {
    const { user } = useAuth();
    const { pathname } = useLocation();
    const [view, setView] = useState('dashboard');
    const [viewState, setViewState] = useState({});
    const [isDarkMode, setIsDarkMode] = useState(false);
    const navigator = useNavigate();

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const navigate = (viewName: React.SetStateAction<string>, state = {}) => {
        setView(viewName);
        setViewState(state);
        navigator(viewName.valueOf());
    };

    const goTo = (path: string) => {
        navigate(path, {});
    }

    if (!user) {
        return <LoginPage />;
    }

    return (
        <Layout>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/*">
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route
                        path="dashboard"
                        element={
                            <PrivateRoute>
                                <>
                                    <Dashboard />
                                </>
                            </PrivateRoute>}
                    />
                    <Route
                        path="connections"
                        element={<ConnectionsPage setView={navigate} />}
                    />
                    <Route
                        path="connections/wizard"
                        element={
                            <AddConnection />
                        }
                    />
                    <Route
                        path="definitions"
                        element={<MigrationDefinitionsList />}
                    />
                    <Route
                        path="definitions/:definitionId"
                        element={
                            <PrivateRoute>
                                <MigrationDetailsPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="wizard"
                        element={
                            <MigrationWizard
                                onBack={() => goTo('dashboard')}
                                setView={navigate}
                            />
                        }
                    />
                    <Route
                        path="executions/:runId"
                        element={
                            <PrivateRoute>
                                <MigrationRunDetails />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="executions"
                        element={
                            <PrivateRoute>
                                <MigrationRunsList />
                            </PrivateRoute>
                        }
                    />
                    <Route path="admin/users" element={<AdminUsers />} />
                    <Route path="settings" element={<NotFound />} />
                    <Route path="help" element={<NotFound />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </Layout>
    );
};

const App: React.FC = () => (
    <React.StrictMode>
        <ThemeProvider>
            <Toaster />
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
                        <Route path="/*" element={<InnerApp />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>
);

export default App;
