import http from "node:http";

const port = Number(process.env.MOCK_AUTH_PORT ?? 4010);

let session = null;

const now = "2026-05-25T09:32:00.000Z";

const hrUsers = [
  {
    id: "hr-1",
    kind: "hr",
    hrUserId: "hr-1",
    name: "HR Manager",
    email: "hr_manager@demo.com",
    password: "demo1234",
    role: "hr_manager",
    department: null,
    companyId: "COMP-001",
  },
  {
    id: "hr-2",
    kind: "hr",
    hrUserId: "hr-2",
    name: "Accountant",
    email: "accountant@demo.com",
    password: "demo1234",
    role: "accountant",
    department: null,
    companyId: "COMP-001",
  },
  {
    id: "hr-3",
    kind: "hr",
    hrUserId: "hr-3",
    name: "Viewer",
    email: "viewer@demo.com",
    password: "demo1234",
    role: "viewer",
    department: "engineering",
    companyId: "COMP-001",
  },
];

const departments = [
  department("engineering", "Engineering", 2),
  department("production", "Production", 2),
  department("finance", "Finance", 1),
  department("qc", "QC", 1),
];

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

const employees = [
  employee("EMP-001", "Somchai Jaidee", "engineering", "Engineer", 30000),
  employee("EMP-002", "Naree Finance", "finance", "Accountant", 28000),
  employee("EMP-003", "Anong Production", "production", "Operator", 22000),
];

const requests = [
  ewaRequest("EWA-20260525-001", "EMP-001", "pending", 3000),
  ewaRequest("EWA-20260525-002", "EMP-003", "approved", 2500, {
    approvedBy: "HR Manager",
    approvedAt: now,
  }),
  ewaRequest("EWA-20260525-003", "EMP-002", "approved", 1800, {
    approvedBy: "HR Manager",
    approvedAt: now,
  }),
  ewaRequest("EWA-20260524-001", "EMP-003", "disbursed", 1500, {
    approvedBy: "HR Manager",
    approvedAt: "2026-05-24T09:00:00.000Z",
    disbursedAt: "2026-05-24T10:00:00.000Z",
    exported: true,
    exportedAt: "2026-05-24T10:00:00.000Z",
    exportedBy: "Accountant",
  }),
];

const settings = {
  id: "settings-1",
  companyId: "COMP-001",
  companyName: "Factory Co., Ltd.",
  bankExportFormat: "generic_csv",
  ewaPolicy: {
    monthly: policy("monthly"),
    weekly: policy("weekly"),
  },
  notificationSettings: {
    onApproval: { email: true, line: true },
    onRejection: { email: true, line: true },
    onDisbursement: { email: true, line: true },
    onPaydayReminder: { email: true, line: true },
    onCutoffWarning: { email: true, line: true },
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: now,
};

function department(id, name, headCount) {
  return {
    id,
    name,
    nameTh: name,
    headCount,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function employee(id, name, departmentName, position, monthlySalary) {
  return {
    id,
    companyId: "COMP-001",
    employeeCode: id,
    name,
    nameEn: null,
    avatarInitials: name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2),
    phoneNumber: null,
    lineUserId: null,
    email: null,
    invitationCode: null,
    activated: 1,
    department: departmentName,
    departmentName,
    position,
    startDate: "2024-01-01",
    employmentType: "full_time",
    payCycle: "monthly",
    monthlySalary,
    dailyRate: null,
    standardWorkDays: 22,
    bankAccountMasked: "xxx-x-x1234-x",
    bankName: "SCB",
    bankAccountLast4: "1234",
    ewaEnabled: true,
    ewaEligibility: "eligible",
    ewaMaxPercent: 50,
    ewaMaxRequests: 2,
    ewaMinAmount: 500,
    ewaMaxAmount: 10000,
    currentPeriod,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
  };
}

function ewaRequest(id, employeeId, status, requestedAmount, overrides = {}) {
  return {
    id,
    companyId: "COMP-001",
    employeeId,
    status,
    requestedAmount,
    transferFee: 15,
    netAmount: requestedAmount - 15,
    earnedToDate: 9200,
    maxWithdrawable: 4600,
    payCycle: "monthly",
    periodLabel: "May 2026",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    workedDays: 14,
    reason: "emergency",
    employeeNote: null,
    hrNote: null,
    referenceNumber: id,
    isOnBehalf: false,
    autoApproved: false,
    actorId: employeeId,
    actorName: employees.find((item) => item.id === employeeId)?.name ?? null,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    disbursedAt: null,
    exported: false,
    exportedAt: null,
    exportedBy: null,
    createdAt: now,
    requestedAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function policy(payCycle) {
  return {
    maxPercent: 50,
    maxRequestsPerPeriod: payCycle === "monthly" ? 2 : 1,
    minAmount: payCycle === "monthly" ? 500 : 200,
    autoApproval: false,
    autoApprovalThreshold: 3000,
    approvalChain: "single",
    weeklyPayday: "fri",
    ewaCutoffDays: 1,
    blackoutDates: [],
  };
}

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

function sendText(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "http://127.0.0.1:3100",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, x-company-id",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Content-Type": "text/csv;charset=utf-8",
    ...headers,
  });
  response.end(body);
}

function readTextBody(requestMessage) {
  return new Promise((resolve) => {
    let raw = "";
    requestMessage.on("data", (chunk) => {
      raw += chunk;
    });
    requestMessage.on("error", () => resolve(""));
    requestMessage.on("end", () => resolve(raw));
  });
}

async function readJsonBody(requestMessage) {
  const raw = await readTextBody(requestMessage);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function sendPage(response, items) {
  send(response, 200, {
    data: items,
    total: items.length,
    meta: {
      total: items.length,
      page: 1,
      limit: 200,
      totalPages: items.length ? 1 : 0,
    },
  });
}

function getScopedEmployees(url) {
  let scoped = employees;
  if (session?.role === "viewer" && session.department) {
    scoped = scoped.filter((item) => item.department === session.department);
  }

  const departmentParam = url.searchParams.get("department");
  const payCycleParam = url.searchParams.get("payCycle");
  if (departmentParam) {
    scoped = scoped.filter((item) => item.department === departmentParam);
  }
  if (payCycleParam) {
    scoped = scoped.filter((item) => item.payCycle === payCycleParam);
  }

  return scoped;
}

function withEmployee(request) {
  return {
    ...request,
    employee: employees.find((item) => item.id === request.employeeId),
  };
}

function scopedRequests(url) {
  const visibleEmployeeIds = new Set(
    getScopedEmployees(url).map((item) => item.id),
  );
  let scoped = requests.filter((item) =>
    visibleEmployeeIds.has(item.employeeId),
  );
  const status = url.searchParams.get("status");
  if (status) {
    scoped = scoped.filter((item) => item.status === status);
  }
  return scoped.map(withEmployee);
}

function parseCsvFixtureFromMultipart(raw) {
  return raw
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("--"))
    .filter((line) => !line.toLowerCase().startsWith("content-"))
    .filter((line) => !line.includes('name="file"'))
    .join("\n")
    .trim();
}

function parseCsvRows(csv) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const headers = lines[0]?.split(",") ?? [];
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });
}

function validateImportRow(row) {
  const required = [
    "name",
    "employeeCode",
    "department",
    "startDate",
    "payCycle",
    "employmentType",
  ];
  return required
    .filter((field) => String(row[field] ?? "").trim() === "")
    .map((field) => `${field} is required`);
}

function importRows(rows) {
  const errors = [];
  let success = 0;

  rows.forEach((row, index) => {
    const rowErrors = validateImportRow(row);
    if (rowErrors.length > 0) {
      errors.push({ row: index + 1, reason: rowErrors.join("; ") });
      return;
    }

    const id = row.employeeCode.trim();
    if (!employees.some((item) => item.id === id)) {
      employees.push(
        employee(
          id,
          row.name.trim(),
          row.department.trim(),
          "Imported Employee",
          20000,
        ),
      );
    }
    success += 1;
  });

  return {
    total: rows.length,
    success,
    failed: errors.length,
    errors,
  };
}

function exportCsvFor(requestIds) {
  const selected = requests.filter(
    (item) =>
      requestIds.includes(item.id) &&
      item.status === "approved" &&
      !item.exported,
  );
  const exportedAt = new Date().toISOString();

  for (const request of selected) {
    request.status = "disbursed";
    request.disbursedAt = exportedAt;
    request.exported = true;
    request.exportedAt = exportedAt;
    request.exportedBy = session?.name ?? "HR";
    request.updatedAt = exportedAt;
  }

  if (settings.bankExportFormat === "scb_anywhere") {
    return [
      "COMPANY_ID,ACCOUNT_NUMBER,AMOUNT,TRANSACTION_ID",
      ...selected.map((request) => {
        const employeeRecord = employees.find(
          (item) => item.id === request.employeeId,
        );
        return `COMP-001,${employeeRecord?.bankAccountLast4 ?? "0000"},${request.netAmount},${request.id}`;
      }),
    ].join("\n");
  }

  return [
    "employeeCode,name,netAmount,requestId",
    ...selected.map((request) => {
      const employeeRecord = employees.find(
        (item) => item.id === request.employeeId,
      );
      return `${employeeRecord?.employeeCode ?? request.employeeId},${employeeRecord?.name ?? request.employeeId},${request.netAmount},${request.id}`;
    }),
  ].join("\n");
}

const server = http.createServer(async (requestMessage, response) => {
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
    session = { employee: employees[0] };
    send(
      response,
      200,
      { success: true },
      { "Set-Cookie": "payday_session=employee; Path=/; SameSite=Lax" },
    );
    return;
  }

  if (url.pathname === "/auth/hr/login") {
    const body = await readJsonBody(requestMessage);
    const user = hrUsers.find(
      (candidate) =>
        candidate.email === body.email && candidate.password === body.password,
    );

    if (!user) {
      send(response, 401, { message: "Invalid credentials" });
      return;
    }

    const sessionUser = { ...user };
    delete sessionUser.password;
    session = sessionUser;
    send(
      response,
      200,
      { success: true },
      { "Set-Cookie": "payday_session=hr; Path=/; SameSite=Lax" },
    );
    return;
  }

  if (
    url.pathname === "/auth/employee/verify-pin" ||
    url.pathname === "/auth/verify-pin"
  ) {
    send(response, 200, { verified: true });
    return;
  }

  if (url.pathname === "/auth/logout") {
    session = null;
    send(
      response,
      200,
      { success: true },
      { "Set-Cookie": "payday_session=; Path=/; Max-Age=0; SameSite=Lax" },
    );
    return;
  }

  if (
    url.pathname === "/employees/import" &&
    requestMessage.method === "POST"
  ) {
    const raw = await readTextBody(requestMessage);
    const csv = parseCsvFixtureFromMultipart(raw);
    send(response, 200, importRows(parseCsvRows(csv)));
    return;
  }

  if (
    url.pathname === "/employees/import/json" &&
    requestMessage.method === "POST"
  ) {
    const body = await readJsonBody(requestMessage);
    send(response, 200, importRows(body.employees ?? []));
    return;
  }

  if (url.pathname === "/employees/import/template") {
    sendText(
      response,
      200,
      "name,employeeCode,department,startDate,payCycle,employmentType\n",
    );
    return;
  }

  if (url.pathname === "/employees") {
    sendPage(response, getScopedEmployees(url));
    return;
  }

  if (url.pathname === "/employees/EMP-001/current-period") {
    send(response, 200, currentPeriod);
    return;
  }

  if (url.pathname.startsWith("/employees/")) {
    const id = decodeURIComponent(url.pathname.split("/")[2] ?? "");
    const found = employees.find((item) => item.id === id);
    if (!found) {
      send(response, 404, { message: "Employee not found" });
      return;
    }
    send(response, 200, found);
    return;
  }

  if (url.pathname === "/departments") {
    sendPage(response, departments);
    return;
  }

  if (url.pathname === "/hr-users") {
    sendPage(
      response,
      hrUsers.map(({ password, kind, hrUserId, companyId, ...user }) => ({
        ...user,
        departmentName:
          departments.find((item) => item.id === user.department)?.name ?? null,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      })),
    );
    return;
  }

  if (url.pathname === "/settings") {
    if (requestMessage.method === "PATCH") {
      const body = await readJsonBody(requestMessage);
      Object.assign(settings, body, { updatedAt: new Date().toISOString() });
    }
    send(response, 200, settings);
    return;
  }

  if (url.pathname.startsWith("/settings/policy/")) {
    const cycle = url.pathname.split("/").pop();
    if (requestMessage.method === "PATCH") {
      const body = await readJsonBody(requestMessage);
      Object.assign(settings.ewaPolicy[cycle], body);
    }
    send(response, 200, settings.ewaPolicy[cycle]);
    return;
  }

  if (url.pathname === "/ewa-requests") {
    if (requestMessage.method === "POST") {
      send(response, 200, requests[0]);
      return;
    }
    sendPage(response, scopedRequests(url));
    return;
  }

  const approveMatch = url.pathname.match(/^\/ewa-requests\/([^/]+)\/approve$/);
  if (approveMatch && requestMessage.method === "POST") {
    const found = requests.find(
      (item) => item.id === decodeURIComponent(approveMatch[1]),
    );
    if (!found) {
      send(response, 404, { message: "Request not found" });
      return;
    }
    found.status = "approved";
    found.approvedBy = session?.name ?? "HR";
    found.approvedAt = new Date().toISOString();
    found.updatedAt = found.approvedAt;
    send(response, 200, withEmployee(found));
    return;
  }

  const rejectMatch = url.pathname.match(/^\/ewa-requests\/([^/]+)\/reject$/);
  if (rejectMatch && requestMessage.method === "POST") {
    const found = requests.find(
      (item) => item.id === decodeURIComponent(rejectMatch[1]),
    );
    if (!found) {
      send(response, 404, { message: "Request not found" });
      return;
    }
    found.status = "rejected";
    found.rejectedBy = session?.name ?? "HR";
    found.rejectedAt = new Date().toISOString();
    found.updatedAt = found.rejectedAt;
    send(response, 200, withEmployee(found));
    return;
  }

  const disburseMatch = url.pathname.match(
    /^\/ewa-requests\/([^/]+)\/disburse$/,
  );
  if (disburseMatch && requestMessage.method === "POST") {
    const found = requests.find(
      (item) => item.id === decodeURIComponent(disburseMatch[1]),
    );
    if (!found) {
      send(response, 404, { message: "Request not found" });
      return;
    }
    found.status = "disbursed";
    found.disbursedAt = new Date().toISOString();
    found.updatedAt = found.disbursedAt;
    send(response, 200, withEmployee(found));
    return;
  }

  if (
    url.pathname === "/requests/export-batch" &&
    requestMessage.method === "POST"
  ) {
    const body = await readJsonBody(requestMessage);
    sendText(response, 200, exportCsvFor(body.requestIds ?? []));
    return;
  }

  const failedMatch = url.pathname.match(
    /^\/requests\/([^/]+)\/mark-transfer-failed$/,
  );
  if (failedMatch && requestMessage.method === "POST") {
    const found = requests.find(
      (item) => item.id === decodeURIComponent(failedMatch[1]),
    );
    if (!found) {
      send(response, 404, { message: "Request not found" });
      return;
    }
    found.status = "approved";
    found.disbursedAt = null;
    found.exported = false;
    found.exportedAt = null;
    found.exportedBy = null;
    found.updatedAt = new Date().toISOString();
    send(response, 200, withEmployee(found));
    return;
  }

  if (url.pathname === "/ewa-requests/preview") {
    send(response, 200, {
      requestedAmount: 3000,
      transferFee: 15,
      netAmount: 2985,
      policy: {
        minAmount: 500,
        maxAmount: 10000,
        maxPercent: 50,
        maxRequests: 2,
      },
    });
    return;
  }

  send(response, 404, { message: `No mock route for ${url.pathname}` });
});

server.listen(port, "127.0.0.1");
