import { Bell, LogOut, Moon, Sun, UserCircle, LayoutDashboard, FileText, Zap, Database } from "lucide-react";
import { useState } from "react";
import LogoIcon from "./icons/LogoIcon";
import { NavLink } from "react-router-dom";

type HeaderProps = {
    view: string;
    setView: (view: string) => void;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
};

const mockNotifications = [
    { id: 1, message: "Migration 'Sync Users to Analytics' completed.", status: "Completed", time: "2 hours ago", read: false },
    { id: 2, message: "Migration 'Legacy Customer Import' failed.", status: "Failed", time: "1 day ago", read: false },
    { id: 3, message: "Migration 'Nightly Order Sync' completed.", status: "Completed", time: "1 day ago", read: true },
];

const Header: React.FC<HeaderProps> = ({ view, setView, isDarkMode, setIsDarkMode }) => {
    const [notifications, setNotifications] = useState(mockNotifications);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { id: 'definitions', label: 'Definitions', icon: <FileText size={18} /> },
        { id: 'executions', label: 'Executions', icon: <Zap size={18} /> },
        { id: 'connections', label: 'Connections', icon: <Database size={18} /> },
    ];

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    return (
        <header className="h-20 flex items-center justify-between px-6">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                    <LogoIcon className="h-8 w-auto text-slate-800 dark:text-slate-100" />
                </div>
                <nav className="flex items-center gap-2 p-1 rounded-lg">
                    {navItems.map(item => (
                        <NavLink
                            key={item.id}
                            to={`/${item.id}`}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${isActive
                                    ? 'bg-white text-slate-800 dark:bg-slate-700 dark:text-slate-100 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="relative">
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="relative p-2.5 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
                            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200">Notifications</h4>
                            </div>
                            <ul className="py-1 max-h-80 overflow-y-auto">
                                {notifications.map(n => (
                                    <li key={n.id} onClick={() => markAsRead(n.id)} className={`px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${!n.read ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}>
                                        <p className={`text-sm text-slate-700 dark:text-slate-200 ${!n.read ? 'font-semibold' : ''}`}>{n.message}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.time}</p>
                                    </li>
                                ))}
                                {notifications.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">No new notifications</li>}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex items-center gap-3">
                    <UserCircle size={28} className="text-slate-500 dark:text-slate-400" />
                    <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Admin User</p>
                    </div>
                </div>
                <button
                    onClick={() => alert("Logged out!")}
                    className="p-2.5 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Log Out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

export default Header;
