
import { Search, Moon, Sun, Maximize2, Bell } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Input from "./common/Input";
import { ChangeEvent } from "react";
import { Button } from "./common/v2/Button";

export default function TopBar() {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6" data-testid="topbar">
            {/* Search */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 bg-slate-100 dark:bg-slate-700 border-0 focus-visible:ring-1 focus-visible:ring-blue-500"
                        data-testid="topbar-search" value={""} onChange={function (event: ChangeEvent<HTMLInputElement>): void { }} />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
                <Button
                    variant="ghost"
                    onClick={toggleTheme}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    data-testid="topbar-theme-toggle"
                >
                    {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                </Button>
                <Button variant="ghost" className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <Bell size={16} />
                </Button>
            </div>
        </header>
    );
}