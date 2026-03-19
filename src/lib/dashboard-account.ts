export interface DashboardAccount {
  email: string;
  fullName: string;
}

type UserLike = {
  firstName?: string | null;
  fullName?: string | null;
  lastName?: string | null;
  primaryEmailAddress?: {
    emailAddress?: string | null;
  } | null;
  username?: string | null;
};

export function getDashboardAccount(
  user: UserLike | null | undefined,
): DashboardAccount {
  const email = user?.primaryEmailAddress?.emailAddress ?? "Protected session";
  const fallbackName = email.includes("@") ? email.split("@")[0] : email;
  const combinedName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");

  return {
    email,
    fullName:
      user?.fullName ?? (combinedName || user?.username || fallbackName),
  };
}
