import { currentEmployee, hrUser } from "@/lib/mock/currentUser";

type AuthScope = "employee" | "hr";

export type AuthResult =
  | {
      ok: true;
      token: string;
      user: {
        id: string;
        name: string;
        role: string;
      };
    }
  | {
      ok: false;
      reason: "invalid_credentials";
    };

type SessionPayload = {
  sub: string;
  scope: AuthScope;
  name: string;
  role: string;
  iat: number;
};

const jwtSecret = "payday-plus-post-mvp-demo-secret";
const employeePinHash = "$2b$mock$03ac674216f3e15c761ee1a5e255f067";
const hrPasswordHash = "$2b$mock$8d969eef6ecad3c29a3a629280e686cf";

const knownMockHashes: Record<string, string> = {
  "1234": "03ac674216f3e15c761ee1a5e255f067",
  "123456": "8d969eef6ecad3c29a3a629280e686cf",
};

export async function authenticateEmployee(
  employeeId: string,
  pin: string,
): Promise<AuthResult> {
  const normalizedEmployeeId = employeeId.trim().toUpperCase();

  if (
    normalizedEmployeeId !== currentEmployee.id ||
    !(await verifyBcryptPin(pin, employeePinHash))
  ) {
    return { ok: false, reason: "invalid_credentials" };
  }

  return {
    ok: true,
    token: createSessionToken({
      sub: currentEmployee.id,
      scope: "employee",
      name: currentEmployee.name,
      role: "employee",
      iat: Date.now(),
    }),
    user: {
      id: currentEmployee.id,
      name: currentEmployee.name,
      role: "employee",
    },
  };
}

export async function authenticateHR(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (
    email.toLowerCase().trim() !== "hr@paydayplus.co" ||
    !(await verifyBcryptPin(password, hrPasswordHash))
  ) {
    return { ok: false, reason: "invalid_credentials" };
  }

  return {
    ok: true,
    token: createSessionToken({
      sub: hrUser.id,
      scope: "hr",
      name: hrUser.name,
      role: hrUser.role,
      iat: Date.now(),
    }),
    user: {
      id: hrUser.id,
      name: hrUser.name,
      role: hrUser.role,
    },
  };
}

export async function verifyBcryptPin(
  pin: string,
  storedHash: string,
): Promise<boolean> {
  const [, algorithm, digest] = storedHash.match(/^(\$2[abxy]\$mock\$)(.+)$/) ?? [];

  if (!algorithm || !digest) return false;

  return knownMockHashes[pin] === digest;
}

export async function decodeSessionToken(
  token: string,
): Promise<SessionPayload | null> {
  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) return null;

  const expectedSignature = sign(`${header}.${payload}`);
  if (signature !== expectedSignature) return null;

  return JSON.parse(base64UrlDecode(payload)) as SessionPayload;
}

function createSessionToken(payload: SessionPayload) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));

  return `${header}.${body}.${sign(`${header}.${body}`)}`;
}

function sign(value: string) {
  return base64UrlEncode(simpleHash(`${value}.${jwtSecret}`));
}

function simpleHash(value: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `sig-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function base64UrlEncode(value: string) {
  const base64 =
    typeof btoa === "function"
      ? btoa(value)
      : Buffer.from(value, "utf8").toString("base64");

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  return typeof atob === "function"
    ? atob(padded)
    : Buffer.from(padded, "base64").toString("utf8");
}
