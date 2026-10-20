"use client";

import {
  CreditCard,
  MoreHorizontal,
  Pencil,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { UserFeaturesManager } from "@/components/admin/UserFeaturesManager";
import { UserPurchasesDialog } from "@/components/admin/UserPurchasesDialog";
import { DataList, type DataListColumn } from "@/components/shell/data-list";
import { EmptyState } from "@/components/shell/empty-state";
import { StatusBadge } from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminUserRecord } from "@/lib/server/admin-users";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function UsersManager({
  initialUsers,
}: {
  initialUsers: AdminUserRecord[];
}) {
  const [users, setUsers] = useState<AdminUserRecord[]>(initialUsers);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [query, setQuery] = useState("");
  // Kept after close so the sheet can animate out with its content.
  const [purchasesUser, setPurchasesUser] = useState<AdminUserRecord | null>(
    null,
  );
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(false);
  const t = useTranslations("admin.users");

  function openEditDialog(user: AdminUserRecord) {
    setEditingUser(user);
    setName(user.name ?? "");
    setEmail(user.email);
    setRole(user.role);
  }

  async function handleSave() {
    if (!editingUser) return;

    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          name,
          email,
          role,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        user?: AdminUserRecord;
      };

      if (!response.ok || !payload.user) {
        throw new Error(payload.error ?? t("errors.update"));
      }

      setUsers((current) =>
        current.map((item) =>
          item.id === payload.user?.id ? payload.user : item,
        ),
      );
      setEditingUser(null);
      toast.success(t("success.updated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.update"));
    } finally {
      setIsSaving(false);
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const visibleUsers = normalizedQuery
    ? users.filter((user) =>
        [user.name, user.email, user.id].some((value) =>
          value?.toLowerCase().includes(normalizedQuery),
        ),
      )
    : users;

  const columns: DataListColumn<AdminUserRecord>[] = [
    {
      id: "user",
      header: t("columns.user"),
      mobile: "title",
      cell: (user) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background-200 text-muted-foreground">
            <UserRound className="size-4" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium">
              {user.name ?? t("unnamed")}
            </span>
            <span className="truncate text-xs font-normal text-muted-foreground md:hidden">
              {user.email}
            </span>
            <span className="font-numeric hidden truncate text-xs text-muted-foreground md:block">
              {user.id}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "email",
      header: t("columns.email"),
      mobile: "hidden",
      cell: (user) => user.email,
    },
    {
      id: "role",
      header: t("columns.role"),
      cell: (user) => (
        <StatusBadge status={user.role === "admin" ? "success" : "neutral"}>
          {t(`roles.${user.role}`)}
        </StatusBadge>
      ),
    },
    {
      id: "joined",
      header: t("columns.joined"),
      align: "end",
      cell: (user) => (
        <span className="font-numeric text-muted-foreground">
          {formatDate(user.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      align: "end",
      mobile: "trailing",
      className: "w-12",
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 md:size-8"
              aria-label={t("actions.menu", { email: user.email })}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => openEditDialog(user)}>
              <Pencil />
              {t("edit.title")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setPurchasesUser(user);
                setIsPurchasesOpen(true);
              }}
            >
              <CreditCard />
              {user.role === "admin"
                ? t("actions.invoices")
                : t("actions.purchases")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search.placeholder")}
            aria-label={t("search.label")}
            className="h-10 pl-9 md:h-9"
          />
        </div>
        <p className="font-numeric text-sm text-muted-foreground">
          {normalizedQuery
            ? t("countFiltered", {
                count: visibleUsers.length,
                total: users.length,
              })
            : t("count", { count: users.length })}
        </p>
      </div>

      <DataList
        items={visibleUsers}
        getKey={(user) => user.id}
        columns={columns}
        empty={
          users.length === 0 ? (
            <EmptyState icon={Users} title={t("empty")} />
          ) : (
            <EmptyState
              icon={Search}
              title={t("noMatches")}
              description={t("noMatchesDescription", { query: query.trim() })}
              action={
                <Button variant="outline" onClick={() => setQuery("")}>
                  {t("search.clear")}
                </Button>
              }
            />
          )
        }
      />

      {purchasesUser ? (
        <UserPurchasesDialog
          open={isPurchasesOpen}
          onOpenChange={setIsPurchasesOpen}
          userId={purchasesUser.id}
          email={purchasesUser.email}
          name={purchasesUser.name}
          isAdmin={purchasesUser.role === "admin"}
        />
      ) : null}

      <Dialog
        open={editingUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("edit.title")}</DialogTitle>
            <DialogDescription>
              {editingUser?.email ?? t("edit.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-name">{t("edit.fields.name")}</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("edit.placeholders.name")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-email">{t("edit.fields.email")}</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("edit.placeholders.email")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-role">{t("edit.fields.role")}</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as "admin" | "user")}
              >
                <SelectTrigger id="user-role" className="w-full">
                  <SelectValue placeholder={t("edit.fields.role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("roles.user")}</SelectItem>
                  <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingUser && (
              <div className="border-t pt-4">
                <UserFeaturesManager authUserId={editingUser.id} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              {t("edit.cancel")}
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? t("edit.saving") : t("edit.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
