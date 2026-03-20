export interface DashboardAccount {
  email: string;
  fullName: string;
}

type UserLike = {
  email?: string | null;
  name?: string | null;
};

export function getDashboardAccount(
  user: UserLike | null | undefined,
): DashboardAccount {
  const email = user?.email ?? "Protected session";
  const fallbackName = email.includes("@") ? email.split("@")[0] : email;

  return {
    email,
    fullName: user?.name ?? fallbackName,
  };
}
