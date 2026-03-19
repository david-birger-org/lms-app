const ADMIN_ROLE = "admin";

type RoleValue = string | null | undefined;

type SessionClaimsLike = {
  privateMetadata?: {
    role?: RoleValue;
  };
  [key: string]: unknown;
};

type UserLike = {
  privateMetadata?: {
    role?: RoleValue;
  };
};

function normalizeRole(role: RoleValue) {
  return role?.trim().toLowerCase();
}

export function isAdminRole(role: RoleValue) {
  return normalizeRole(role) === ADMIN_ROLE;
}

export function getRoleFromSessionClaims(
  sessionClaims: SessionClaimsLike | null | undefined,
) {
  const claims = sessionClaims ?? {};
  const privateMetadata = claims.privateMetadata;

  return privateMetadata && typeof privateMetadata.role === "string"
    ? privateMetadata.role
    : undefined;
}

export function getRoleFromUser(user: UserLike | null | undefined) {
  return typeof user?.privateMetadata?.role === "string"
    ? user.privateMetadata.role
    : undefined;
}

export function isAdminSession(
  sessionClaims: SessionClaimsLike | null | undefined,
) {
  return isAdminRole(getRoleFromSessionClaims(sessionClaims));
}

export function isAdminUser(user: UserLike | null | undefined) {
  return isAdminRole(getRoleFromUser(user));
}
