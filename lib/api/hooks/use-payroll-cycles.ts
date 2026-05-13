// ============================================================
// React Hooks - Payroll Cycles API
// ============================================================

import { useState, useEffect } from 'react'
import { payrollCyclesService } from '../services'
import type {
  PayrollCycleDto,
  UpdatePayrollCycleDto,
  ListParams,
  PaginatedResponse,
  ApiError,
} from '../types'

export function usePayrollCycles(params?: ListParams) {
  const [data, setData] = useState<PaginatedResponse<PayrollCycleDto> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetch = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await payrollCyclesService.list(params)
      setData(result)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [JSON.stringify(params)])

  return { data, loading, error, refetch: fetch }
}

export function usePayrollCycle(id: string) {
  const [data, setData] = useState<PayrollCycleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetch = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const result = await payrollCyclesService.get(id)
      setData(result)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [id])

  return { data, loading, error, refetch: fetch }
}

export function usePayrollCycleActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const update = async (id: string, data: UpdatePayrollCycleDto): Promise<PayrollCycleDto | null> => {
    try {
      setLoading(true)
      setError(null)
      return await payrollCyclesService.update(id, data)
    } catch (err) {
      setError(err as ApiError)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { update, loading, error }
}
