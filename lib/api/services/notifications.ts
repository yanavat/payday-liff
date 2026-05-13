// ============================================================
// Notifications API Service
// ============================================================

import { getApiClient } from '../client'
import type {
  NotificationDto,
  ListParams,
  PaginatedResponse,
} from '../types'

export class NotificationsService {
  private client = getApiClient()

  async list(params?: ListParams): Promise<PaginatedResponse<NotificationDto>> {
    return this.client.get<PaginatedResponse<NotificationDto>>('/notifications', params)
  }

  async get(id: string): Promise<NotificationDto> {
    return this.client.get<NotificationDto>(`/notifications/${id}`)
  }
}

export const notificationsService = new NotificationsService()
