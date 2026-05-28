import type { Employee } from "@/lib/api";

export function getAuthEmployeeId(employee: Employee | null) {
  return employee?.employeeCode ?? employee?.id ?? "";
}
