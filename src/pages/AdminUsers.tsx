import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Transition, Dialog as ReactDialog } from "@headlessui/react";
import { useToast } from "../components/hooks/use-toast";
import apiClient from "../services/apiClient";
import { User } from "../types/User";
import { Button } from "../components/common/v2/Button";
import {
    AlertTriangle,
    CheckCircle2,
    Edit,
    Shield,
    Trash2,
    UserPlus,
    X,
    Clock3,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/common/v2/Card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/common/v2/Table";
import { Badge } from "../components/common/v2/Badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/common/Dialog";
import { Checkbox } from "../components/common/Checkbox";
import { Label } from "../components/common/v2/Label";
import Input from "../components/common/Input";

/** ---------- Roles ---------- */
type RoleValue = "admin" | "editor" | "viewer" | "super_admin";

const ROLES: { value: RoleValue; label: string }[] = [
    { value: "admin", label: "Admin" },
    { value: "editor", label: "Editor" },
    { value: "viewer", label: "Viewer" },
    { value: "super_admin", label: "Super Admin" },
];

const ROLE_LABELS: Record<RoleValue, string> = ROLES.reduce((acc, r) => {
    acc[r.value] = r.label;
    return acc;
}, {} as Record<RoleValue, string>);

const ROLE_STYLES: Record<RoleValue, string> = {
    admin: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    editor: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    super_admin: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

function RoleBadge({ role }: { role: RoleValue }) {
    return (
        <Badge className={ROLE_STYLES[role]} variant="outline" data-testid={`badge-role-${role}`}>
            <Shield className="w-3 h-3 mr-1" />
            {ROLE_LABELS[role]}
        </Badge>
    );
}

function RoleBadges({ roles }: { roles: string[] }) {
    return (
        <div className="flex flex-wrap gap-1">
            {roles.map((r) => (
                <RoleBadge key={r} role={r as RoleValue} />
            ))}
        </div>
    );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
    return (
        <Badge
            variant={isActive ? "default" : "destructive"}
            data-testid={`badge-status-${isActive ? "active" : "inactive"}`}
        >
            {isActive ? "Active" : "Inactive"}
        </Badge>
    );
}

function RoleSelector({
    selected,
    onToggle,
    idPrefix,
}: {
    selected: string[];
    onToggle: (role: RoleValue) => void;
    idPrefix: string;
}) {
    return (
        <div className="space-y-2">
            {ROLES.map((role) => {
                const id = `${idPrefix}-${role.value}`;
                return (
                    <div key={role.value} className="flex items-center space-x-2">
                        <Checkbox
                            id={id}
                            checked={selected.includes(role.value)}
                            onCheckedChange={() => onToggle(role.value)}
                            data-testid={`checkbox-${idPrefix}-${role.value}`}
                        />
                        <RoleBadge role={role.value} />
                    </div>
                );
            })}
        </div>
    );
}

/** ---------- Loading Skeleton ---------- */
function UsersTableSkeleton() {
    const rows = useMemo(() => Array.from({ length: 6 }), []);
    return (
        <div className="animate-pulse">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
            <div className="space-y-2">
                {rows.map((_, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-4 items-center gap-4 py-3 border-b border-slate-200 dark:border-slate-700"
                    >
                        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="justify-self-end h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** ---------- Inline Success Banner ---------- */
function SuccessBanner({
    message,
    onClose,
}: {
    message: string | null;
    onClose: () => void;
}) {
    if (!message) return null;
    return (
        <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 p-3 flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 w-5 h-5 text-green-600 dark:text-green-400" />
            <div className="text-sm text-green-800 dark:text-green-200">{message}</div>
            <button
                className="ml-auto opacity-70 hover:opacity-100"
                aria-label="Dismiss success banner"
                onClick={onClose}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

/** ---------- HeadlessUI (ReactDialog) Revoke Modal (kept as requested) ---------- */
function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <ReactDialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <ReactDialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                                <ReactDialog.Title className="text-lg font-bold leading-6 text-slate-900 dark:text-slate-50 flex items-center">
                                    <AlertTriangle className="text-red-500 mr-2" />
                                    Revoke User Access
                                </ReactDialog.Title>
                                <div className="mt-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Are you sure you want to revoke access for this user? This action cannot be undone.
                                        The user will immediately lose access to the system.
                                    </p>
                                </div>
                                <div className="mt-6 flex justify-end gap-2">
                                    <button
                                        className="inline-flex justify-center rounded-md bg-slate-100 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-50 hover:bg-slate-200 dark:hover:bg-slate-600"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                        onClick={onConfirm}
                                        data-testid="button-confirm-revoke"
                                    >
                                        Revoke Access
                                    </button>
                                </div>
                            </ReactDialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </ReactDialog>
        </Transition>
    );
}

/** ---------- Optional: Pending Invites (best-effort) ---------- */
type Invite = {
    id: string;
    email: string;
    roles: string[];
    status: "pending" | "accepted" | "expired";
    invitedAt?: string;
};

function InviteStatusBadge({ status }: { status: Invite["status"] }) {
    const style =
        status === "pending"
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
            : status === "accepted"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    return (
        <Badge className={style} variant="outline">
            <Clock3 className="w-3 h-3 mr-1" />
            {status[0].toUpperCase() + status.slice(1)}
        </Badge>
    );
}

/** ---------- Main ---------- */
export default function AdminUsers() {
    const { toast } = useToast();

    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRoles, setInviteRoles] = useState<RoleValue[]>(["editor"]);
    const [inviting, setInviting] = useState(false);
    const [inviteBanner, setInviteBanner] = useState<string | null>(null);

    const [editRolesUserId, setEditRolesUserId] = useState<string | null>(null);
    const [editRolesValues, setEditRolesValues] = useState<RoleValue[]>([]);
    const [savingRoles, setSavingRoles] = useState(false);

    const [revokeUserId, setRevokeUserId] = useState<string | null>(null);

    const [invites, setInvites] = useState<Invite[] | null>(null);
    const [isLoadingInvites, setIsLoadingInvites] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            try {
                const data = await apiClient.users();
                if (!cancelled) setUsers(data);
            } catch (error) {
                if (!cancelled) {
                    console.error("Error fetching users:", error);
                    toast({
                        title: "Error",
                        description: "Failed to fetch users.",
                        variant: "destructive",
                    });
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [toast]);

    // Best-effort: fetch pending invites if the API exists
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoadingInvites(true);
            try {
                // If your API differs, adjust here—guarded so it won’t break if missing.
                if (typeof (apiClient as any).listInvites === "function") {
                    const data: Invite[] = await (apiClient as any).listInvites();
                    if (!cancelled) setInvites(data || []);
                } else {
                    if (!cancelled) setInvites([]);
                }
            } catch {
                if (!cancelled) setInvites([]);
            } finally {
                if (!cancelled) setIsLoadingInvites(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const openEditRoles = useCallback((userId: string, currentRoles: string[]) => {
        setEditRolesUserId(userId);
        setEditRolesValues(currentRoles as RoleValue[]);
    }, []);

    const closeEditRoles = useCallback(() => {
        setEditRolesUserId(null);
        setEditRolesValues([]);
    }, []);

    const toggleEditRole = useCallback((role: RoleValue) => {
        setEditRolesValues((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    }, []);

    const toggleInviteRole = useCallback((role: RoleValue) => {
        setInviteRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    }, []);

    const updateUserRoles = useCallback(
        async (userId: string, roles: RoleValue[]) => {
            try {
                setSavingRoles(true);
                await apiClient.updateUserRoles(userId, roles);
                setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, roles } : u)));
                toast({ title: "Success", description: "User roles updated successfully." });
                closeEditRoles();
            } catch (error) {
                console.error("Error updating user roles:", error);
                toast({
                    title: "Error",
                    description: "Failed to update user roles.",
                    variant: "destructive",
                });
            } finally {
                setSavingRoles(false);
            }
        },
        [toast, closeEditRoles]
    );

    const handleSaveRoles = useCallback(() => {
        if (!editRolesUserId) return;
        if (editRolesValues.length === 0) {
            toast({
                title: "Roles required",
                description: "Please select at least one role.",
                variant: "destructive",
            });
            return;
        }
        updateUserRoles(editRolesUserId, editRolesValues);
    }, [editRolesUserId, editRolesValues, toast, updateUserRoles]);

    const closeInviteDialog = useCallback(() => {
        setInviteDialogOpen(false);
        setInviteEmail("");
        setInviteRoles(["editor"]);
    }, []);

    const handleInvite = useCallback(async () => {
        if (!inviteEmail.trim()) {
            toast({
                title: "Email required",
                description: "Please enter an email address.",
                variant: "destructive",
            });
            return;
        }
        if (inviteRoles.length === 0) {
            toast({
                title: "Roles required",
                description: "Please select at least one role.",
                variant: "destructive",
            });
            return;
        }
        try {
            setInviting(true);
            await apiClient.inviteUser(inviteEmail.trim(), inviteRoles);
            setInviteBanner(`Invitation sent successfully to ${inviteEmail.trim()}.`);
            // Refresh invites list if available
            if (typeof (apiClient as any).listInvites === "function") {
                try {
                    const data: Invite[] = await (apiClient as any).listInvites();
                    setInvites(data || []);
                } catch {
                    /* ignore */
                }
            }
            closeInviteDialog();
        } catch (error) {
            console.error("Error inviting user:", error);
            toast({
                title: "Error",
                description: "Failed to send invitation.",
                variant: "destructive",
            });
        } finally {
            setInviting(false);
        }
    }, [inviteEmail, inviteRoles, toast, closeInviteDialog]);

    const closeDeleteModal = useCallback(() => {
        setRevokeUserId(null);
    }, []);

    const handleRevokeUser = useCallback(async () => {
        if (!revokeUserId) return;
        try {
            await apiClient.deleteUser(revokeUserId);
            setUsers((prev) => prev.filter((u) => u.id !== revokeUserId));
            toast({ title: "Success", description: "User access revoked successfully." });
            closeDeleteModal();
        } catch (error) {
            console.error("Error revoking user access:", error);
            toast({
                title: "Error",
                description: "Failed to revoke user access.",
                variant: "destructive",
            });
        }
    }, [revokeUserId, toast, closeDeleteModal]);

    const hasUsers = users.length > 0;

    return (
        <>
            {/* Revoke dialog (HeadlessUI) */}
            <DeleteConfirmationModal
                isOpen={!!revokeUserId}
                onClose={closeDeleteModal}
                onConfirm={handleRevokeUser}
            />

            <div className="space-y-6">
                {/* Inline banner */}
                <SuccessBanner message={inviteBanner} onClose={() => setInviteBanner(null)} />

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1
                            className="text-[32px] font-bold leading-tight text-slate-900 dark:text-white"
                            data-testid="connections-title"
                        >
                            User Management
                        </h1>
                        <p className="mt-1 text-slate-700 dark:text-slate-300">
                            Manage tenant users, roles, and access
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => setInviteDialogOpen(true)} variant="primary">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite User
                        </Button>
                    </div>
                </div>

                {/* Pending Invites (optional, shown if API returns list) */}
                {invites && invites.length > 0 && (
                    <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                        <CardHeader className="border-gray-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <CardTitle>Pending Invites</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingInvites ? (
                                <div className="text-sm text-slate-600 dark:text-slate-400 py-4">Loading invites…</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Roles</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Invited</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invites.map((inv) => (
                                            <TableRow key={inv.id}>
                                                <TableCell className="font-medium">{inv.email}</TableCell>
                                                <TableCell>
                                                    <RoleBadges roles={inv.roles} />
                                                </TableCell>
                                                <TableCell>
                                                    <InviteStatusBadge status={inv.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-600 dark:text-slate-400 text-sm">
                                                        {inv.invitedAt ? new Date(inv.invitedAt).toLocaleString() : "—"}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Users */}
                <Card className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden relative">
                    <CardHeader className="border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <CardTitle>Users</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <UsersTableSkeleton />
                        ) : !hasUsers ? (
                            <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                                No users found. Invite your first user to get started.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Roles</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.email}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <RoleBadges roles={user.roles} />
                                                    {user.isActive && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => openEditRoles(user.id, user.roles)}
                                                            aria-label={`Edit roles for ${user.email}`}
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge isActive={user.isActive} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setRevokeUserId(user.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    Revoke
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Roles Dialog (shadcn) */}
                <Dialog open={!!editRolesUserId} onOpenChange={(open) => !open && closeEditRoles()}>
                    <DialogContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit User Roles</DialogTitle>
                            <DialogDescription>
                                Select the roles for this user. At least one role must be selected.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                            <RoleSelector selected={editRolesValues} onToggle={toggleEditRole} idPrefix="edit-role" />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeEditRoles}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveRoles}
                                disabled={savingRoles || editRolesValues.length === 0}
                                variant="primary"
                            >
                                {savingRoles ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Invite Dialog (shadcn) */}
                <Dialog
                    open={inviteDialogOpen}
                    onOpenChange={(open) => (open ? setInviteDialogOpen(true) : closeInviteDialog())}
                >
                    <DialogContent className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl">
                        <DialogHeader>
                            <DialogTitle>Invite User</DialogTitle>
                            <DialogDescription>
                                Send an invitation to a new user. They will receive a pending invite until they accept.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="invite-email">Email Address</Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Roles</Label>
                                <RoleSelector selected={inviteRoles} onToggle={toggleInviteRole} idPrefix="invite-role" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeInviteDialog} data-testid="button-cancel-invite">
                                Cancel
                            </Button>
                            <Button onClick={handleInvite} disabled={inviting} variant="primary">
                                {inviting ? "Sending..." : "Send Invite"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
