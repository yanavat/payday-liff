// ============================================================
// Payroll Cycles API Service
// ============================================================

import { getApiClient } from '../client'
import type {
  PayrollCycleDto,
  UpdatePayrollCycleDto,
  ListParams,
  PaginatedResponse,
} from '../types'

export class PayrollCyclesService {
  private client = getApiClient()

  async list(params?: ListParams): Promise<PaginatedResponse<PayrollCycleDto>> {
    return this.client.get<PaginatedResponse<PayrollCycleDto>>('/payroll-cycles', params)
  }

  async get(id: string): Promise<PayrollCycleDto> {
    return this.client.get<PayrollCycleDto>(`/payroll-cycles/${id}`)
  }

  async update(id: string, data: UpdatePayrollCycleDto): Promise<PayrollCycleDto> {
    return this.client.patch<PayrollCycleDto>(`/payroll-cycles/${id}`, data)
  }
}

export const payrollCyclesService = new PayrollCyclesService()
