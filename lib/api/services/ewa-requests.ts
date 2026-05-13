// ============================================================
// EWA Requests API Service
// ============================================================

import { getApiClient } from '../client'
import type {
  EWARequestDto,
  CreateRequestDto,
  OnBehalfRequestDto,
  PreviewRequestDto,
  PreviewResultDto,
  RejectRequestDto,
  ListParams,
  PaginatedResponse,
} from '../types'

export class EWARequestsService {
  private client = getApiClient()

  async list(params?: ListParams & { employeeId?: string; status?: string }): Promise<PaginatedResponse<EWARequestDto>> {
    return this.client.get<PaginatedResponse<EWARequestDto>>('/ewa-requests', params)
  }

  async create(data: CreateRequestDto): Promise<EWARequestDto> {
    return this.client.post<EWARequestDto>('/ewa-requests', data)
  }

  async createOnBehalf(data: OnBehalfRequestDto): Promise<EWARequestDto> {
    return this.client.post<EWARequestDto>('/ewa-requests/on-behalf', data)
  }

  async preview(data: PreviewRequestDto): Promise<PreviewResultDto> {
    return this.client.post<PreviewResultDto>('/ewa-requests/preview', data)
  }

  async get(id: string): Promise<EWARequestDto> {
    return this.client.get<EWARequestDto>(`/ewa-requests/${id}`)
  }

  async approve(id: string): Promise<EWARequestDto> {
    return this.client.post<EWARequestDto>(`/ewa-requests/${id}/approve`)
  }

  async reject(id: string, data?: RejectRequestDto): Promise<EWARequestDto> {
    return this.client.post<EWARequestDto>(`/ewa-requests/${id}/reject`, data)
  }

  async disburse(id: string): Promise<EWARequestDto> {
    return this.client.post<EWARequestDto>(`/ewa-requests/${id}/disburse`)
  }
}

export const ewaRequestsService = new EWARequestsService()
