import { motion } from "framer-motion";
import { useAppContext } from "../../App";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import LogoIcon from "../icons/LogoIcon";
import { MoonIcon, SunIcon } from "../icons/Helper";

const Header = () => {
    const { page, setPage, fromPage } = useAppContext();
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { id: 'dashboard', label: 'Dashboard' },
    ];

    const isActive = (itemId: string) => {
        return page === itemId || (fromPage && fromPage === itemId);
    };

    return (
        <header className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl sticky top-0 z-10 border-b border-black/5 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-6">
                        <LogoIcon className="h-8 w-auto text-gray-800 dark:text-gray-100" />
                        <nav className="hidden sm:flex sm:space-x-1">
                            {navItems.map(item => (
                                <a key={item.id} href="#" onClick={(e) => { e.preventDefault(); setPage(item.id); }}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive(item.id)
                                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                        }`}>
                                    {item.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                        </motion.button>
                        <button onClick={logout} className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">Logout</button>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;