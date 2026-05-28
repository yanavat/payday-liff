import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/tests/i18n/test-utils";
import type { EmployeeDto } from "@/lib/api/types";
import { HRRoleContext } from "./hr-auth-gate";
import { EmployeeDetailDrawer } from "./employee-detail-drawer";

const setOverridesMock = vi.fn().mockResolvedValue({ id: "EMP-0001" });
const refetchPolicyMock = vi.fn();

const mockEffectivePolicy = { isOverridden: false };

vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@/lib/api/hooks", () => ({
  useEmployeeEffectivePolicy: vi.fn(() => ({
    data: mockEffectivePolicy,
    loading: false,
    error: null,
    refetch: refetchPolicyMock,
  })),
  useEmployeeActions: vi.fn(() => ({
    setOverrides: setOverridesMock,
    loading: false,
    error: null,
  })),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

import * as hooks from "@/lib/api/hooks";

const baseEmployee: EmployeeDto = {
  id: "EMP-0001",
  companyId: "COMP-001",
  employeeCode: "EMP-0001",
  name: "Somchai Jaidee",
  nameEn: null,
  avatarInitials: "SJ",
  phoneNumber: null,
  lineUserId: null,
  email: null,
  invitationCode: null,
  activated: 1,
  department: "Production",
  departmentName: "Production",
  position: "Operator",
  startDate: "2024-01-01",
  employmentType: "full_time",
  payCycle: "monthly",
  monthlySalary: 20000,
  dailyRate: null,
  standardWorkDays: 22,
  bankName: "KBANK",
  bankAccountMasked: "xxx-1234",
  bankAccountLast4: "1234",
  ewaEnabled: null,
  ewaEligibility: "eligible",
  ewaMaxPercent: null,
  ewaMaxRequests: null,
  ewaMinAmount: null,
  ewaMaxAmount: null,
  currentPeriod: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  deletedAt: null,
};

const messages = {
  common: {
    cancel: "Cancel",
    confirm: "Confirm",
    loading: "Loading",
    reason: "Reason",
    save: "Save",
  },
};

function renderDrawer(employee: EmployeeDto) {
  return renderWithIntl(
    <HRRoleContext.Provider value={{ role: "hr_manager" }}>
      <EmployeeDetailDrawer
        employee={employee}
        open={true}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
      />
    </HRRoleContext.Provider>,
    { messages },
  );
}

describe("EmployeeDetailDrawer", () => {
  beforeEach(() => {
    setOverridesMock.mockClear();
  });

  describe("Override chip", () => {
    it("shows 'Override active' (green) chip when isOverridden is true", async () => {
      vi.mocked(hooks.useEmployeeEffectivePolicy).mockReturnValue({
        data: {
          isOverridden: true,
          maxPercent: 40,
          maxRequestsPerPeriod: 3,
          minAmount: 500,
          autoApproval: false,
          autoApprovalThreshold: 3000,
          approvalChain: "single",
          ewaCutoffDays: 1,
          blackoutDates: [],
        },
        loading: false,
        error: null,
        refetch: refetchPolicyMock,
      } as ReturnType<typeof hooks.useEmployeeEffectivePolicy>);

      const employeeWithOverrides: EmployeeDto = {
        ...baseEmployee,
        ewaEnabled: true,
        ewaMaxPercent: 40,
      };

      renderDrawer(employeeWithOverrides);

      await waitFor(() => {
        expect(screen.getByText("Override active")).toBeInTheDocument();
      });
    });

    it("shows 'Using company default' chip when isOverridden is false", async () => {
      vi.mocked(hooks.useEmployeeEffectivePolicy).mockReturnValue({
        data: {
          isOverridden: false,
          maxPercent: 50,
          maxRequestsPerPeriod: 2,
          minAmount: 500,
          autoApproval: false,
          autoApprovalThreshold: 3000,
          approvalChain: "single",
          ewaCutoffDays: 1,
          blackoutDates: [],
        },
        loading: false,
        error: null,
        refetch: refetchPolicyMock,
      } as ReturnType<typeof hooks.useEmployeeEffectivePolicy>);

      renderDrawer(baseEmployee);

      await waitFor(() => {
        expect(screen.getByText("Using company default")).toBeInTheDocument();
      });
    });
  });

  describe("Reset to company default", () => {
    it("calls setOverrides with all null after confirming reset", async () => {
      const employeeWithOverrides: EmployeeDto = {
        ...baseEmployee,
        ewaEnabled: true,
        ewaMaxPercent: 40,
        ewaMaxRequests: 3,
      };

      renderDrawer(employeeWithOverrides);

      fireEvent.click(
        screen.getByRole("button", { name: /reset to company default/i }),
      );

      fireEvent.click(screen.getByRole("button", { name: "Reset" }));

      await waitFor(() => {
        expect(setOverridesMock).toHaveBeenCalledWith("EMP-0001", {
          ewaEnabled: null,
          ewaMaxPercent: null,
          ewaMaxRequests: null,
          ewaMinAmount: null,
          ewaMaxAmount: null,
        });
      });
    });

    it("does not call setOverrides when reset is cancelled", async () => {
      renderDrawer(baseEmployee);

      fireEvent.click(
        screen.getByRole("button", { name: /reset to company default/i }),
      );

      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(setOverridesMock).not.toHaveBeenCalled();
      });
    });
  });
});
