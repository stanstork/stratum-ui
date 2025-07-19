import React, { createContext, useContext, useState, useEffect, JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/v2/Header';
import ConnectionsPage from './pages/v2/Connections';
import ConnectionWizard from './components/ConnectionWizard';
import MigrationDefinitionsList from './pages/v2/MigrationDefinitionsList';
import MigrationWizard from './pages/MigrationWizard';

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

    return (
        <div className="h-screen bg-slate-100 dark:bg-slate-900 font-sans antialiased text-slate-700 dark:text-slate-200 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:to-indigo-900 -z-10"></div>
            {user && pathname !== '/login' && <Header view={view} setView={navigate} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/*">
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route
                                path="dashboard"
                                element={
                                    <PrivateRoute>
                                        <>
                                            <Dashboard setView={navigate} isDarkMode={isDarkMode} />
                                        </>
                                    </PrivateRoute>}
                            />
                            <Route
                                path="connections"
                                element={<ConnectionsPage setView={navigate} />}
                            />
                            <Route
                                path="connections/new"
                                element={
                                    <ConnectionWizard onBack={() => goTo('connections')} />
                                }
                            />
                            <Route
                                path="definitions"
                                element={<MigrationDefinitionsList setView={navigate} />}
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
                            {/* 
                                }
                            />
                            <Route
                                path="run/:runId"
                                element={
                                <MigrationRunDetails
                                    runId={location.state?.runId}
                                    onBack={() => goTo('executions')}
                                />
                                }
                            />
                            
                            <Route
                                path="definitions/:defId"
                                element={
                                <MigrationDefinitionDetails
                                    defId={location.state?.defId}
                                    onBack={() => goTo('definitions')}
                                />
                                }
                            />
                            <Route
                                path="executions"
                                element={<ExecutionsList />}
                            />
                            
                             */}
                        </Route>
                    </Routes>
                </div>
            </main>
        </div>
    );
};

const App: React.FC = () => (
    <React.StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <InnerApp />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>
);

export default App;
