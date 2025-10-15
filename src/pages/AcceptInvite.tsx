import { useParams } from "react-router-dom";
import { useToast } from "../components/hooks/use-toast";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/common/v2/Card";
import { Invite, User } from "../types/User";
import apiClient from "../services/apiClient";
import { AlertCircle, CheckCircle, Shield } from "lucide-react";
import { Alert, AlertDescription } from "../components/common/Alert";
import { Label } from "../components/common/v2/Label";
import Input from "../components/common/Input";
import { Button } from "../components/common/v2/Button";

export default function AcceptInvitePage() {
    const { token } = useParams<{ token: string }>();
    const { toast } = useToast();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [invite, setInvite] = useState<Invite | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    useEffect(() => {
        const verifyInvite = async () => {
            if (!token) {
                setError("Invalid or missing invite token.");
                return;
            }
            setIsLoading(true);
            try {
                const invite = await apiClient.getInvite(token);
                setInvite(invite);
            } catch (err) {
                setError("Failed to verify invite. It may be invalid or expired.");
            } finally {
                setIsLoading(false);
            }
        };
        verifyInvite();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invite) {
            toast({
                title: "Error",
                description: "No valid invite found.",
                variant: "destructive",
            });
            return;
        }

        if (!firstName || !lastName) {
            toast({
                title: "Name required",
                description: "Please enter your first and last name.",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 8) {
            toast({
                title: "Error",
                description: "Password must be at least 8 characters long.",
                variant: "destructive",
            });
            return;
        }
        if (password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsAccepting(true);
            const newUser = await apiClient.acceptInvite(token!, password, firstName, lastName);
            setUser(newUser);
            toast({
                title: "Success",
                description: "Your account has been created. Redirecting to login...",
                variant: "default",
            });
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to accept invite. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsAccepting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Card className="w-full max-w-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800/50">
                    <CardContent className="py-8">
                        <div className="text-center text-slate-600 dark:text-slate-400">
                            Verifying invitation...
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !invite) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Card className="w-full max-w-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800/50">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-6 h-6" />
                            <CardTitle>Invalid Invitation</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertDescription>
                                This invitation link is invalid or has expired. Please contact your administrator
                                for a new invitation.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Card className="w-full max-w-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800/50">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-6 h-6" />
                            <CardTitle>Account Created!</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600 dark:text-slate-400">
                            Your account has been successfully created. Redirecting you to the login page...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <Card className="w-full max-w-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800/50">
                <CardHeader>
                    <CardTitle>Accept Invitation</CardTitle>
                    <CardDescription>
                        Create your password to complete your account setup
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                                <p className="font-medium text-slate-900 dark:text-white" data-testid="text-invite-email">
                                    {invite?.email}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                {invite?.roles.map((role: string) => (
                                    <div
                                        key={role}
                                        className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs"
                                    >
                                        <Shield className="w-3 h-3" />
                                        {role}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-slate-800 dark:text-slate-100">First Name</Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="John"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-slate-800 dark:text-slate-100">Last Name</Label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-800 dark:text-slate-100">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Must be at least 8 characters long
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-slate-800 dark:text-slate-100">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            variant="primary"
                            disabled={isAccepting}
                        >
                            {isAccepting ? "Creating Account..." : "Create Account"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
