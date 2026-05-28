import http from "node:http";

const port = Number(process.env.MOCK_AUTH_PORT ?? 4010);

let session = null;

const employee = {
  id: "EMP-001",
  employeeCode: "EMP-001",
  name: "Somchai Jaidee",
  nameTh: "สมชาย ใจดี",
  department: "Production",
  position: "Operator",
  payCycle: "monthly",
  workType: "onsite",
  baseSalary: 30000,
  bankAccountMasked: "xxx-x-xx123-4",
  bankName: "KBANK",
  ewaStatus: "eligible",
  enrolledAt: "2026-01-01",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const currentPeriod = {
  label: "May 2026",
  startDate: "2026-05-01",
  endDate: "2026-05-31",
  payDate: "2026-05-31",
  cutoffDate: "2026-05-25",
  workedDays: 14,
  totalWorkDays: 22,
  earnedToDate: 9200,
  previousEWAThisPeriod: 1100,
  maxWithdrawable: 4600,
  usedRequests: 1,
  remainingRequests: 1,
};

const request = {
  id: "EWA-20260525-001",
  companyId: "co-1",
  employeeId: "EMP-001",
  status: "pending",
  requestedAmount: 3000,
  transferFee: 15,
  netAmount: 2985,
  earnedToDate: 9200,
  maxWithdrawable: 4600,
  periodLabel: "May 2026",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-31",
  workedDays: 14,
  isOnBehalf: false,
  autoApproved: false,
  actorId: "EMP-001",
  actorName: "Somchai Jaidee",
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  disbursedAt: null,
  createdAt: "2026-05-25T09:32:00.000Z",
  updatedAt: "2026-05-25T09:32:00.000Z",
};

function send(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "http://127.0.0.1:3100",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, x-company-id",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Content-Type": "application/json",
    ...headers,
  });
  response.end(JSON.stringify(body));
}

const server = http.createServer((requestMessage, response) => {
  const url = new URL(requestMessage.url ?? "/", `http://127.0.0.1:${port}`);

  if (requestMessage.method === "OPTIONS") {
    send(response, 204, {});
    return;
  }

  if (url.pathname === "/health") {
    send(response, 200, { ok: true });
    return;
  }

  if (url.pathname === "/auth/me" || url.pathname === "/api/auth/me") {
    if (!session) {
      send(response, 401, { message: "Unauthorized" });
      return;
    }
    send(response, 200, session);
    return;
  }

  if (
    url.pathname === "/auth/employee/activate" ||
    url.pathname === "/auth/employee/login" ||
    url.pathname === "/auth/activate" ||
    url.pathname === "/auth/login"
  ) {
    session = { employee };
    send(response, 200, { success: true }, { "Set-Cookie": "payday_session=employee; Path=/; SameSite=Lax" });
    return;
  }

  if (url.pathname === "/auth/hr/login") {
    session = { id: "hr-1", kind: "hr", hrUserId: "hr-1", name: "HR Manager", email: "hr@paydayplus.co", role: "hr_manager", companyId: "COMP-001" };
    send(response, 200, { success: true }, { "Set-Cookie": "payday_session=hr; Path=/; SameSite=Lax" });
    return;
  }

  if (url.pathname === "/auth/employee/verify-pin" || url.pathname === "/auth/verify-pin") {
    send(response, 200, { verified: true });
    return;
  }

  if (url.pathname === "/auth/logout") {
    session = null;
    send(response, 200, { success: true }, { "Set-Cookie": "payday_session=; Path=/; Max-Age=0; SameSite=Lax" });
    return;
  }

  if (url.pathname === "/employees/EMP-001") {
    send(response, 200, employee);
    return;
  }

  if (url.pathname === "/employees/EMP-001/current-period") {
    send(response, 200, currentPeriod);
    return;
  }

  if (url.pathname === "/ewa-requests") {
    if (requestMessage.method === "POST") {
      send(response, 200, request);
      return;
    }
    send(response, 200, { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } });
    return;
  }

  if (url.pathname === "/ewa-requests/preview") {
    send(response, 200, {
      requestedAmount: 3000,
      transferFee: 15,
      netAmount: 2985,
      policy: { minAmount: 500, maxAmount: 10000, maxPercent: 50, maxRequests: 2 },
    });
    return;
  }

  send(response, 404, { message: `No mock route for ${url.pathname}` });
});

server.listen(port, "127.0.0.1");
