const ADMIN_ROLE = "admin";

type RoleValue = string | null | undefined;

type UserLike = {
  email?: string | null;
  role?: RoleValue;
};

function normalizeRole(role: RoleValue) {
  return role?.trim().toLowerCase();
}

export function isAdminRole(role: RoleValue) {
  return normalizeRole(role) === ADMIN_ROLE;
}

export function getRoleFromUser(user: UserLike | null | undefined) {
  return typeof user?.role === "string" ? user.role : undefined;
}

export function resolveUserRole(user: UserLike | null | undefined) {
  return getRoleFromUser(user);
}

export function isAdminUser(user: UserLike | null | undefined) {
  return isAdminRole(resolveUserRole(user));
}
