type AuthScope = "employee" | "hr";

type RouterLike = {
  push: (href: "/employee/login" | "/hr/login") => void;
  refresh?: () => void;
};

const sessionStorageKey = "payday-session";

export async function signOut(scope: AuthScope, router: RouterLike) {
  const logoutRequest =
    typeof fetch === "function"
      ? fetch(`/api/auth/logout?scope=${scope}`, {
          method: "POST",
          credentials: "include",
        }).catch(() => undefined)
      : Promise.resolve();

  window.localStorage.removeItem(sessionStorageKey);
  router.push(scope === "hr" ? "/hr/login" : "/employee/login");
  router.refresh?.();

  await logoutRequest;
}
