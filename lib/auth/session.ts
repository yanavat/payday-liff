type AuthScope = "employee" | "hr";

type RouterLike = {
  push: (href: "/employee/login" | "/hr/login") => void;
  refresh?: () => void;
};

const sessionStorageKey = "payday-session";
const hrSessionKey = "payday-hr-session";

export type HRSessionData = {
  hrUserId: string;
  companyId: string;
  role: "hr_manager" | "accountant" | "viewer";
  expiresAt: number;
};

export function saveHRSession(data: {
  hrUserId: string;
  companyId: string;
  role?: string;
}) {
  const session: HRSessionData = {
    hrUserId: data.hrUserId,
    companyId: data.companyId,
    role: (data.role as HRSessionData["role"]) ?? "viewer",
    expiresAt: Date.now() + 86400 * 1000, // 24h — matches backend cookie MaxAge
  };
  localStorage.setItem(hrSessionKey, JSON.stringify(session));
}

export function getHRSession(): HRSessionData | null {
  try {
    const raw = localStorage.getItem(hrSessionKey);
    if (!raw) return null;
    const session = JSON.parse(raw) as HRSessionData;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(hrSessionKey);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function signOut(scope: AuthScope, router: RouterLike) {
  const logoutRequest =
    typeof fetch === "function"
      ? fetch(`/api/auth/logout?scope=${scope}`, {
          method: "POST",
          credentials: "include",
        }).catch(() => undefined)
      : Promise.resolve();

  window.localStorage.removeItem(sessionStorageKey);
  if (scope === "hr") {
    window.localStorage.removeItem(hrSessionKey);
  }
  router.push(scope === "hr" ? "/hr/login" : "/employee/login");
  router.refresh?.();

  await logoutRequest;
}
