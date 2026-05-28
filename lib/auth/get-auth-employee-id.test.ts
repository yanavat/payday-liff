import { describe, expect, it } from "vitest";

import type { Employee } from "@/lib/api";

import { getAuthEmployeeId } from "./get-auth-employee-id";

const employee: Employee = {
  id: "emp-1",
  name: "Somchai",
  nameTh: "สมชาย",
  department: "Production",
  position: "Operator",
  payCycle: "monthly",
  workType: "onsite",
  baseSalary: 30000,
  bankAccountMasked: "xxx-x-xx123-4",
  bankName: "KBank",
  ewaStatus: "eligible",
  enrolledAt: "2026-01-01",
};

describe("getAuthEmployeeId", () => {
  it("prefers employeeCode when present", () => {
    expect(getAuthEmployeeId({ ...employee, employeeCode: "EMP-001" })).toBe(
      "EMP-001",
    );
  });

  it("falls back to id when employeeCode is absent", () => {
    expect(getAuthEmployeeId(employee)).toBe("emp-1");
  });

  it("returns an empty string when employee is null", () => {
    expect(getAuthEmployeeId(null)).toBe("");
  });
});
