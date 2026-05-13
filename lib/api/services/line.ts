// ============================================================
// LINE API Service
// ============================================================

import { getApiClient } from '../client'
import type {
  PushMessageDto,
  NotifyRequestStatusDto,
} from '../types'

export class LineService {
  private client = getApiClient()

  async push(data: PushMessageDto): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>('/line/push', data)
  }

  async notifyRequestStatus(data: NotifyRequestStatusDto): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>('/line/notify/request-status', data)
  }

  async getRichMenu(): Promise<{ richMenuId?: string; alias?: string }> {
    return this.client.get<{ richMenuId?: string; alias?: string }>('/line/richmenu')
  }

  async setRichMenu(data: { richMenuId?: string; alias?: string }): Promise<{ success: boolean }> {
    return this.client.put<{ success: boolean }>('/line/richmenu', data)
  }

  // Webhook endpoint is handled by the Next.js API route at /api/line/webhook
  // This service provides the client-side methods for LINE integration
}

export const lineService = new LineService()
