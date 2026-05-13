"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ApiErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "An error occurred";
    return { hasError: true, message };
  }

  reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div className="space-y-1">
            <p className="text-[15px] font-semibold text-text-primary">
              Something went wrong
            </p>
            <p className="max-w-xs text-[13px] text-text-secondary">
              {this.state.message}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={this.reset}
              className="rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-dark"
            >
              Try again
            </button>
            <Link
              href="/hr"
              className="rounded-md border border-border px-4 py-2 text-[14px] font-medium text-text-secondary hover:bg-bg-secondary"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
