// ============================================================
// Bank Transfers API Service
// ============================================================

import { getApiClient } from '../client'
import type {
  BankTransferDto,
  FailTransferDto,
  SettleTransferDto,
  ListParams,
  PaginatedResponse,
} from '../types'

export class BankTransfersService {
  private client = getApiClient()

  async list(params?: ListParams): Promise<PaginatedResponse<BankTransferDto>> {
    return this.client.get<PaginatedResponse<BankTransferDto>>('/bank-transfers', params)
  }

  async get(id: string): Promise<BankTransferDto> {
    return this.client.get<BankTransferDto>(`/bank-transfers/${id}`)
  }

  async fail(id: string, data: FailTransferDto): Promise<BankTransferDto> {
    return this.client.post<BankTransferDto>(`/bank-transfers/${id}/fail`, data)
  }

  async retry(id: string): Promise<BankTransferDto> {
    return this.client.post<BankTransferDto>(`/bank-transfers/${id}/retry`)
  }

  async settle(id: string, data: SettleTransferDto): Promise<BankTransferDto> {
    return this.client.post<BankTransferDto>(`/bank-transfers/${id}/settle`, data)
  }
}

export const bankTransfersService = new BankTransfersService()
