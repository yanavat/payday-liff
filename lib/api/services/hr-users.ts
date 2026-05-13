// ============================================================
// HR Users API Service
// ============================================================

import { getApiClient } from '../client'
import type {
  HRUserDto,
  CreateHRUserDto,
  UpdateHRUserDto,
  ListParams,
  PaginatedResponse,
} from '../types'

export class HRUsersService {
  private client = getApiClient()

  async list(params?: ListParams & { role?: 'hr_manager' | 'accountant' | 'viewer'; isActive?: boolean }): Promise<PaginatedResponse<HRUserDto>> {
    return this.client.get<PaginatedResponse<HRUserDto>>('/hr-users', params)
  }

  async create(data: CreateHRUserDto): Promise<HRUserDto> {
    return this.client.post<HRUserDto>('/hr-users', data)
  }

  async get(id: string): Promise<HRUserDto> {
    return this.client.get<HRUserDto>(`/hr-users/${id}`)
  }

  async update(id: string, data: UpdateHRUserDto): Promise<HRUserDto> {
    return this.client.patch<HRUserDto>(`/hr-users/${id}`, data)
  }

  async remove(id: string): Promise<void> {
    return this.client.delete<void>(`/hr-users/${id}`)
  }
}

export const hrUsersService = new HRUsersService()
