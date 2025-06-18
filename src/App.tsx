import React, { createContext, useContext, useState, useEffect, JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
import { pageVariants } from './components/common/Helper';
import Definitions from './pages/Definitions';
import DefinitionCanvas from './pages/DefinitionCanvas';
import Header from './components/Header';

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
    const location = useLocation();
    const { user } = useAuth();
    const { pathname } = useLocation();

    // page-based state for context (if still needed elsewhere)
    const [page, setPage] = useState<string>('dashboard');
    const [fromPage, setFromPage] = useState<string>('dashboard');
    const [viewDefinitionId, setViewDefinitionId] = useState<string | undefined>(undefined);
    const [viewExecutionId, setViewExecutionId] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (location.pathname === '/') setPage('dashboard');
        else if (location.pathname.startsWith('/definitions')) setPage('definitions');
        else if (location.pathname.startsWith('/executions')) setPage('executions');
    }, [page]);

    return (
        <AppContext.Provider value={{ page, setPage, fromPage, setFromPage, viewDefinitionId, setViewDefinitionId, viewExecutionId, setViewExecutionId }}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 bg-gradient-to-br from-white via-sky-50 to-white dark:from-gray-900 dark:via-sky-900/10 dark:to-gray-900">
                {user && pathname !== '/login' && <Header />}
                <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/login" element={<LoginPage />} />

                            <Route
                                path="/"
                                element={
                                    <PrivateRoute>
                                        <motion.div
                                            variants={pageVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Dashboard />
                                        </motion.div>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/definitions"
                                element={
                                    <PrivateRoute>
                                        <motion.div
                                            variants={pageVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Definitions />
                                        </motion.div>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/definitions/new"
                                element={
                                    <PrivateRoute>
                                        <motion.div
                                            variants={pageVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            transition={{ duration: 0.3 }}
                                        >
                                            <DefinitionCanvas />
                                        </motion.div>
                                    </PrivateRoute>
                                }
                            />

                            {/* Fallback to dashboard */}
                            <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
                        </Routes>
                    </AnimatePresence>
                </main>
            </div>
        </AppContext.Provider>
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
