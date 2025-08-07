import { Link, useLocation } from "react-router-dom";
import { Database, ChartLine, FileText, Play, Plug, Settings, HelpCircle, User, Bell, Plus } from "lucide-react";
import { cn } from "../utils/utils";
import { Button } from "./common/v2/Button";

const navigation = [
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
            { name: "New Migration", href: "/wizard", icon: Plus },
            { name: "Connections", href: "/connections", icon: Plug },
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

    return (
        <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col" data-testid="sidebar">
            {/* Logo */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <Link to="/" className="flex items-center space-x-3" data-testid="sidebar-logo">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Database className="text-white" size={16} />
                    </div>
                    <span className="text-xl font-semibold text-slate-900 dark:text-white">Stratum</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-8" data-testid="sidebar-navigation">
                {navigation.map((section) => (
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
                                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">AU</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">Admin User</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
