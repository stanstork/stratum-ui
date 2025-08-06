import Sidebar from "./Sidebar";
import TopBar from "./TopBar";


interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex">
            {/* Background Gradient */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:to-indigo-900 -z-10"></div>

            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar />

                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
