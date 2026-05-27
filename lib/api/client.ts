// ============================================================
// API Client - Backend Integration
// ============================================================

import type { ApiError } from "./types";

interface ApiClientConfig {
  baseURL: string;
  companyId?: string;
}

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  setCompanyId(companyId: string) {
    this.config.companyId = companyId;
  }

  getCompanyId(): string | undefined {
    return this.config.companyId;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add company ID header if available
    if (this.config.companyId) {
      headers["x-company-id"] = this.config.companyId;
    }

    return headers;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
  ): Promise<Response> {
    const attempt = () => fetch(url, options);

    let response: Response;
    try {
      response = await attempt();
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
      return attempt();
    }

    if (response.status >= 500) {
      await new Promise((r) => setTimeout(r, 1000));
      return attempt();
    }

    return response;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        message: response.statusText || "API request failed",
        statusCode: response.status,
      };

      try {
        const errorData = await response.json();
        error.details = errorData;
      } catch {
        // If error body is not JSON, ignore
      }

      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(path, this.config.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await this.fetchWithRetry(url.toString(), {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.fetchWithRetry(
      `${this.config.baseURL}${path}`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
      },
    );

    return this.handleResponse<T>(response);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.fetchWithRetry(
      `${this.config.baseURL}${path}`,
      {
        method: "PATCH",
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
      },
    );

    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string): Promise<T> {
    const response = await this.fetchWithRetry(
      `${this.config.baseURL}${path}`,
      {
        method: "DELETE",
        headers: this.getHeaders(),
        credentials: "include",
      },
    );

    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.fetchWithRetry(
      `${this.config.baseURL}${path}`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
      },
    );

    return this.handleResponse<T>(response);
  }
}

// Create singleton instance with environment variables
let apiClientInstance: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    const baseURL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
    const companyId =
      (typeof window !== "undefined"
        ? localStorage.getItem("payday-company-id")
        : null) ?? process.env.NEXT_PUBLIC_COMPANY_ID;

    apiClientInstance = new ApiClient({
      baseURL,
      companyId,
    });
  }

  return apiClientInstance;
}
