import type { Employee } from "@/types";

export function getAuthEmployeeId(employee: Employee | null) {
  return employee?.employeeCode ?? employee?.id ?? "";
}
