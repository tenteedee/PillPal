export type SkipAuthorizationRoute = {
  method?: string;
  path: string;
  match?: "exact" | "prefix";
};

export const SKIP_AUTHORIZATION_ROUTES: SkipAuthorizationRoute[] = [
  { method: "GET", path: "/api/v1/health" },
  { method: "GET", path: "/api/v1/openapi.json" },
  { method: "GET", path: "/api/v1/docs", match: "prefix" },
  { method: "POST", path: "/api/v1/auth/signup" },
  { method: "POST", path: "/api/v1/auth/login" },
];
