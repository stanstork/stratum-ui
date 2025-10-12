import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "../components/common/v2/Card";

export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center">
            <Card className="w-full max-w-md mx-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
                <CardContent className="pt-6">
                    <div className="flex mb-4 gap-2">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">404 Page Not Found</h1>
                    </div>

                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        Did you forget to add the page to the router?
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}