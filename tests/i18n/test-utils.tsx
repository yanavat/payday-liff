import React from "react";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

type TestMessages = Record<string, unknown>;

const defaultMessages = {
  common: {
    ok: "OK",
    cancel: "Cancel",
    save: "Save",
    submit: "Submit",
    status: "Status",
    noData: "No data",
    success: "Success",
    error: "Error",
    loading: "Loading",
    offlineBanner: "No internet connection",
    confirm: "Confirm",
    reason: "Reason",
    language: "Language",
    appearance: "Appearance",
    darkMode: "Dark mode",
    logout: "Log out",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    disbursed: "Disbursed",
    all: "All",
    payCycle: {
      monthly: "Monthly",
      weekly: "Weekly",
    },
  },
  status: {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    disbursed: "Disbursed",
    all: "All",
  },
  login: {
    title: "Employee Login",
    hrTitle: "HR Sign In",
    hrSubtitle: "Employee Advance Request System",
    subtitle: "Enter PIN",
    employeeId: "Employee ID",
    employeeIdPlaceholder: "Enter ID",
    pin: "PIN",
    loginButton: "Login",
    wrongPin: "Wrong PIN — {attempts} left",
    locked: "Account locked",
    forgotPin: "Forgot PIN?",
    scanQr: "Scan QR",
    appTagline: "Earned Wage Access",
    loading: "Loading",
  },
  requestWizard: {
    title: "Request EWA",
    selectAmount: "Select Amount",
    customAmount: "Custom Amount",
    amountError: "Amount exceeds limit",
    remainingBalance: "Remaining balance",
    reason: "Reason",
    reasons: {
      emergency: "Emergency expenses",
      medical: "Medical expenses",
      education: "Education",
      utility: "Utilities",
      other: "Other",
    },
  },
};

export function renderWithIntl(
  ui: React.ReactElement,
  {
    locale = "en",
    messages = defaultMessages,
  }: { locale?: string; messages?: TestMessages } = {},
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

export { defaultMessages };
