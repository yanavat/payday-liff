type AuthScope = "employee" | "hr";

type RouterLike = {
  push: (href: "/employee/login" | "/hr/login") => void;
  refresh?: () => void;
};

const sessionStorageKey = "payday-session";

export async function signOut(scope: AuthScope, router: RouterLike) {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Local cleanup and navigation should still happen if the network drops.
  }
  window.localStorage.removeItem(sessionStorageKey);
  router.push(scope === "hr" ? "/hr/login" : "/employee/login");
  router.refresh?.();
}
