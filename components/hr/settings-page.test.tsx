import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithIntl, defaultMessages } from "@/tests/i18n/test-utils";
import { HRRoleContext, type HRRole } from "./hr-auth-gate";
import { SettingsPageContent } from "./settings-page";

const pushMock = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
  useRouter: vi.fn(() => ({ push: pushMock })),
}));

vi.mock("@/lib/api/hooks", () => ({
  useSettings: vi.fn(() => ({
    data: {
      companyName: "Factory Co.",
      bankExportFormat: "generic_csv",
      ewaPolicy: {
        monthly: {
          maxPercent: 50,
          maxRequestsPerPeriod: 2,
          minAmount: 500,
          autoApproval: false,
          autoApprovalThreshold: 3000,
          approvalChain: "single",
          ewaCutoffDays: 1,
          blackoutDates: [],
        },
        weekly: {
          maxPercent: 50,
          maxRequestsPerPeriod: 1,
          minAmount: 200,
          autoApproval: false,
          autoApprovalThreshold: 3000,
          approvalChain: "single",
          weeklyPayday: "fri",
          ewaCutoffDays: 1,
          blackoutDates: [],
        },
      },
    },
    loading: false,
    error: null,
  })),
  useDepartments: vi.fn(() => ({
    data: {
      data: [
        {
          id: "dept-prod",
          name: "Production",
          nameTh: "Production",
          headCount: 10,
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
      ],
    },
    loading: false,
    error: null,
  })),
  useHRUsers: vi.fn(() => ({
    data: {
      data: [
        {
          id: "HR-001",
          name: "HR Admin",
          email: "hr@factory.co.th",
          role: "hr_manager",
          department: null,
          departmentName: null,
          isActive: true,
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
      ],
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useSettingsActions: vi.fn(() => ({
    updateSettings: vi.fn(),
    updatePolicy: vi.fn(),
    loading: false,
    error: null,
  })),
  useHRUserActions: vi.fn(() => ({
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    loading: false,
    error: null,
  })),
  useSettingsApiKey: vi.fn(() => ({
    data: null,
    loading: false,
    error: null,
  })),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

const messages = {
  ...defaultMessages,
  settings: {
    title: "Settings",
    general: "General",
    ewaPolicy: "EWA Policy",
    notifications: "Notifications",
    userManagement: "User Management",
    monthly: "Monthly",
    weekly: "Weekly",
    maxPercent: "Max percent",
    maxRequests: "Max requests",
    minAmount: "Min amount",
    autoApprovalThreshold: "Auto approval threshold",
    autoApproval: "Auto approval",
    approvalChain: "Approval chain",
    singleApproval: "Single approval",
    twoStepApproval: "Two-step approval",
    blackoutDates: "Blackout dates",
    weeklyPayday: "Weekly payday",
    ewaCutoffDays: "EWA cutoff days",
    saveSuccess: "Saved",
  },
};

function renderSettings(role: HRRole) {
  return renderWithIntl(
    <HRRoleContext.Provider value={{ role }}>
      <SettingsPageContent />
    </HRRoleContext.Provider>,
    { messages },
  );
}

describe("SettingsPageContent", () => {
  it.each(["accountant", "viewer"] as HRRole[])(
    "redirects %s direct URL access to the dashboard",
    async (role) => {
      pushMock.mockClear();

      renderSettings(role);

      await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith("/hr/dashboard");
      });
      expect(screen.queryByRole("heading", { name: "Settings" })).not.toBeInTheDocument();
    },
  );
});
