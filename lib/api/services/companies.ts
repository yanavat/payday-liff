// ============================================================
// Companies API Service
// ============================================================

import { getApiClient } from '../client'
import type {
  CompanyDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  ListParams,
  PaginatedResponse,
} from '../types'

export class CompaniesService {
  private client = getApiClient()

  async list(params?: ListParams): Promise<PaginatedResponse<CompanyDto>> {
    return this.client.get<PaginatedResponse<CompanyDto>>('/companies', params)
  }

  async create(data: CreateCompanyDto): Promise<CompanyDto> {
    return this.client.post<CompanyDto>('/companies', data)
  }

  async get(id: string): Promise<CompanyDto> {
    return this.client.get<CompanyDto>(`/companies/${id}`)
  }

  async update(id: string, data: UpdateCompanyDto): Promise<CompanyDto> {
    return this.client.patch<CompanyDto>(`/companies/${id}`, data)
  }
}

export const companiesService = new CompaniesService()
