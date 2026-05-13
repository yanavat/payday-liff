// ============================================================
// Employees API Service
// ============================================================

import { getApiClient } from '../client'
import type {
  EmployeeDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EwaOverridesDto,
  EffectivePolicyResponse,
  CurrentPeriodResponse,
  ListParams,
  PaginatedResponse,
} from '../types'

export class EmployeesService {
  private client = getApiClient()

  async list(params?: ListParams & { department?: string; payCycle?: 'monthly' | 'weekly' }): Promise<PaginatedResponse<EmployeeDto>> {
    return this.client.get<PaginatedResponse<EmployeeDto>>('/employees', params)
  }

  async create(data: CreateEmployeeDto): Promise<EmployeeDto> {
    return this.client.post<EmployeeDto>('/employees', data)
  }

  async get(id: string): Promise<EmployeeDto> {
    return this.client.get<EmployeeDto>(`/employees/${id}`)
  }

  async update(id: string, data: UpdateEmployeeDto): Promise<EmployeeDto> {
    return this.client.patch<EmployeeDto>(`/employees/${id}`, data)
  }

  async remove(id: string): Promise<void> {
    return this.client.delete<void>(`/employees/${id}`)
  }

  async setOverrides(id: string, overrides: EwaOverridesDto): Promise<EmployeeDto> {
    return this.client.patch<EmployeeDto>(`/employees/${id}/ewa-overrides`, overrides)
  }

  async getEffectivePolicy(id: string): Promise<EffectivePolicyResponse> {
    return this.client.get<EffectivePolicyResponse>(`/employees/${id}/effective-policy`)
  }

  async getCurrentPeriod(id: string): Promise<CurrentPeriodResponse> {
    return this.client.get<CurrentPeriodResponse>(`/employees/${id}/current-period`)
  }
}

export const employeesService = new EmployeesService()
