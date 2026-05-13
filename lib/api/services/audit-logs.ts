// ============================================================
// Audit Logs API Service
// ============================================================

import { getApiClient } from '../client'
import type {
  AuditLogDto,
  ListParams,
  PaginatedResponse,
} from '../types'

export class AuditLogsService {
  private client = getApiClient()

  async list(params?: ListParams): Promise<PaginatedResponse<AuditLogDto>> {
    return this.client.get<PaginatedResponse<AuditLogDto>>('/audit-logs', params)
  }

  async get(id: string): Promise<AuditLogDto> {
    return this.client.get<AuditLogDto>(`/audit-logs/${id}`)
  }
}

export const auditLogsService = new AuditLogsService()
