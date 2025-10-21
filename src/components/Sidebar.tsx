import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChartLine, FileText, Play, Plug, Settings, HelpCircle, Plus, Users, LogOut } from "lucide-react";
import { cn } from "../utils/utils";
import { Button } from "./common/v2/Button";
import LogoIcon from "./icons/LogoIcon";
import { useAuth } from "../context/AuthContext";
import type { LucideIcon } from "lucide-react";

type NavigationItem = {
    name: string;
    href: string;
    icon: LucideIcon;
    requiresAdmin?: boolean;
    hideForViewer?: boolean;
};

type NavigationSection = {
    name: string;
    items: NavigationItem[];
    requiresAdmin?: boolean;
};

const navigation: NavigationSection[] = [
    {
        name: "GENERAL",
        items: [
            { name: "Dashboard", href: "/dashboard", icon: ChartLine },
            { name: "Definitions", href: "/definitions", icon: FileText },
            { name: "Executions", href: "/executions", icon: Play },
        ]
    },
    {
        name: "TOOLS",
        items: [
            { name: "New Migration", href: "/wizard", icon: Plus, hideForViewer: true },
            { name: "Connections", href: "/connections", icon: Plug },
        ]
    },
    {
        name: "ADMIN",
        requiresAdmin: true,
        items: [
            { name: "Users", href: "/admin/users", icon: Users },
        ]
    },
    {
        name: "SUPPORT",
        items: [
            { name: "Settings", href: "/settings", icon: Settings },
            { name: "Help", href: "/help", icon: HelpCircle },
        ]
    }
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const visibleNavigation = navigation
        .map((section) => {
            const items = section.items.filter((item) => {
                const requireAdmin = section.requiresAdmin ?? item.requiresAdmin;
                if (requireAdmin) {
                    return user?.isAdmin;
                }
                if (item.hideForViewer && user?.isViewerOnly) {
                    return false;
                }
                return true;
            });
            return { ...section, items };
        })
        .filter((section) => section.items.length > 0);

    const displayName = user?.displayName || user?.email || "User";
    const initials = displayName
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || "U";
    const secondaryLine = user?.email && user.email !== displayName ? user.email : undefined;

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col" data-testid="sidebar">
            {/* Logo */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <Link to="/" className="flex items-center space-x-3" data-testid="sidebar-logo">
                    <LogoIcon className="h-8 w-auto text-slate-800 dark:text-slate-100" />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-8" data-testid="sidebar-navigation">
                {visibleNavigation.map((section) => (
                    <div key={section.name}>
                        <h3 className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                            {section.name}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.href || (item.href === "/dashboard" && location.pathname === "/");

                                return (
                                    <Link key={item.name} to={item.href}>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start px-3 py-2 h-10 text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800"
                                                    : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                            )}
                                            data-testid={`sidebar-nav-${item.name.toLowerCase()}`}
                                        >
                                            <Icon className="mr-3 h-4 w-4" />
                                            {item.name}
                                        </Button>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Section */}
            <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{displayName}</p>
                            {secondaryLine && (<p className="text-xs text-slate-500 dark:text-slate-400 truncate">{secondaryLine}</p>)}
                        </div>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
