type AuthScope = "employee" | "hr";

type RouterLike = {
  push: (href: "/employee/login" | "/hr/login") => void;
};

const sessionStorageKey = "payday-session";

export function signOut(scope: AuthScope, router: RouterLike) {
  window.localStorage.removeItem(sessionStorageKey);
  router.push(scope === "hr" ? "/hr/login" : "/employee/login");
}
