import { Bell, LogOut, Moon, Sun, UserCircle } from "lucide-react";
import { useState } from "react";
import LogoIcon from "../icons/LogoIcon";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

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
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'definitions', label: 'Definitions' },
        { id: 'executions', label: 'Executions' },
        { id: 'connections', label: 'Connections' },
    ];

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    return (
        <header className="h-16 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/80 flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <LogoIcon className="h-8 w-auto text-gray-800 dark:text-gray-100" />
                </div>
                <nav className="flex gap-2">
                    {navItems.map(item => (
                        <NavLink
                            key={item.id}
                            to={`/${item.id}`}
                            className={({ isActive }) =>
                                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-700/50'
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="relative">
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
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
                <div className="flex items-center gap-2">
                    <UserCircle size={28} className="text-slate-500 dark:text-slate-400" />
                    <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Admin User</p>
                    </div>
                </div>
                <button
                    onClick={() => alert("Logged out!")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

export default Header;