// ============================================================
// React Hooks - Departments API
// ============================================================

import { useState, useEffect } from 'react'
import { departmentsService } from '../services'
import type {
  DepartmentDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  ListParams,
  PaginatedResponse,
  ApiError,
} from '../types'

export function useDepartments(params?: ListParams) {
  const [data, setData] = useState<PaginatedResponse<DepartmentDto> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetch = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await departmentsService.list(params)
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

export function useDepartment(id: string) {
  const [data, setData] = useState<DepartmentDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetch = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const result = await departmentsService.get(id)
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

export function useDepartmentActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const create = async (data: CreateDepartmentDto): Promise<DepartmentDto | null> => {
    try {
      setLoading(true)
      setError(null)
      return await departmentsService.create(data)
    } catch (err) {
      setError(err as ApiError)
      return null
    } finally {
      setLoading(false)
    }
  }

  const update = async (id: string, data: UpdateDepartmentDto): Promise<DepartmentDto | null> => {
    try {
      setLoading(true)
      setError(null)
      return await departmentsService.update(id, data)
    } catch (err) {
      setError(err as ApiError)
      return null
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      await departmentsService.remove(id)
      return true
    } catch (err) {
      setError(err as ApiError)
      return false
    } finally {
      setLoading(false)
    }
  }

  return { create, update, remove, loading, error }
}
