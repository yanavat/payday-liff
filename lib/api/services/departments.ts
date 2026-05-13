// ============================================================
// Departments API Service
// ============================================================

import { getApiClient } from '../client'
import type {
  DepartmentDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  ListParams,
  PaginatedResponse,
} from '../types'

export class DepartmentsService {
  private client = getApiClient()

  async list(params?: ListParams): Promise<PaginatedResponse<DepartmentDto>> {
    return this.client.get<PaginatedResponse<DepartmentDto>>('/departments', params)
  }

  async create(data: CreateDepartmentDto): Promise<DepartmentDto> {
    return this.client.post<DepartmentDto>('/departments', data)
  }

  async get(id: string): Promise<DepartmentDto> {
    return this.client.get<DepartmentDto>(`/departments/${id}`)
  }

  async update(id: string, data: UpdateDepartmentDto): Promise<DepartmentDto> {
    return this.client.patch<DepartmentDto>(`/departments/${id}`, data)
  }

  async remove(id: string): Promise<void> {
    return this.client.delete<void>(`/departments/${id}`)
  }
}

export const departmentsService = new DepartmentsService()
