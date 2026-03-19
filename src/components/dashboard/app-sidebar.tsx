"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { dashboardRoutes } from "@/lib/dashboard-routes";

function SidebarNavSection({ label }: { label: string }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {dashboardRoutes.map((item) => {
            const isActive = pathname === item.href;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function SidebarAccount() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "Protected session";
  const fallbackName = email.includes("@") ? email.split("@")[0] : email;
  const combinedName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");
  const fullName =
    user?.fullName ?? (combinedName || user?.username) ?? fallbackName;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 p-2">
      <UserButton userProfileMode="navigation" userProfileUrl="/settings" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-sidebar-foreground">
          {fullName}
        </p>
        <p className="truncate text-xs text-sidebar-foreground/70">{email}</p>
      </div>
    </div>
  );
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/60">
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 p-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              LMS Admin
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              Monobank workspace
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavSection label="Operations" />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60">
        <SidebarAccount />
      </SidebarFooter>
    </Sidebar>
  );
}
