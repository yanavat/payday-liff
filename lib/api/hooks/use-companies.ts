// ============================================================
// React Hooks - Companies API
// ============================================================

import { useState, useEffect } from 'react'
import { companiesService } from '../services'
import type {
  CompanyDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  ListParams,
  PaginatedResponse,
  ApiError,
} from '../types'

export function useCompanies(params?: ListParams) {
  const [data, setData] = useState<PaginatedResponse<CompanyDto> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetch = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await companiesService.list(params)
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

export function useCompany(id: string) {
  const [data, setData] = useState<CompanyDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetch = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const result = await companiesService.get(id)
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

export function useCompanyActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const create = async (data: CreateCompanyDto): Promise<CompanyDto | null> => {
    try {
      setLoading(true)
      setError(null)
      return await companiesService.create(data)
    } catch (err) {
      setError(err as ApiError)
      return null
    } finally {
      setLoading(false)
    }
  }

  const update = async (id: string, data: UpdateCompanyDto): Promise<CompanyDto | null> => {
    try {
      setLoading(true)
      setError(null)
      return await companiesService.update(id, data)
    } catch (err) {
      setError(err as ApiError)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { create, update, loading, error }
}
