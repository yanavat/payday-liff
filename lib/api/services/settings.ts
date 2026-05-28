// ============================================================
// Settings API Service
// ============================================================

import { getApiClient } from "../client";
import type {
  AppSettingsDto,
  UpdateSettingsDto,
  PartialEwaPolicyDto,
  UpdateNotificationSettingsDto,
} from "../types";

export class SettingsService {
  private client = getApiClient();

  async get(): Promise<AppSettingsDto> {
    return this.client.get<AppSettingsDto>("/settings");
  }

  async update(data: UpdateSettingsDto): Promise<AppSettingsDto> {
    return this.client.patch<AppSettingsDto>("/settings", data);
  }

  async getPolicy(cycle: "monthly" | "weekly"): Promise<PartialEwaPolicyDto> {
    return this.client.get<PartialEwaPolicyDto>(`/settings/policy/${cycle}`);
  }

  async updatePolicy(
    cycle: "monthly" | "weekly",
    data: PartialEwaPolicyDto,
  ): Promise<PartialEwaPolicyDto> {
    return this.client.patch<PartialEwaPolicyDto>(
      `/settings/policy/${cycle}`,
      data,
    );
  }

  async updateNotifications(
    data: UpdateNotificationSettingsDto,
  ): Promise<AppSettingsDto> {
    return this.client.patch<AppSettingsDto>("/settings/notifications", data);
  }

  // GET /settings/api-key — endpoint may not exist on backend yet
  async getApiKey(): Promise<{ apiKey: string }> {
    return this.client.get<{ apiKey: string }>("/settings/api-key");
  }
}

export const settingsService = new SettingsService();
