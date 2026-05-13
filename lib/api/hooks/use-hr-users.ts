// ============================================================
// React Hooks - HR Users API
// ============================================================

import { useState, useEffect } from 'react'
import { hrUsersService } from '../services'
import type {
  HRUserDto,
  CreateHRUserDto,
  UpdateHRUserDto,
  ListParams,
  PaginatedResponse,
  ApiError,
} from '../types'

export function useHRUsers(params?: ListParams & { role?: 'hr_manager' | 'accountant' | 'viewer'; isActive?: boolean }) {
  const [data, setData] = useState<PaginatedResponse<HRUserDto> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetch = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await hrUsersService.list(params)
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

export function useHRUser(id: string) {
  const [data, setData] = useState<HRUserDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetch = async () => {
    if (!id) return {
      data, loading, error, refetch: fetch }
  }

  useEffect(() => {
    fetch()
  }, [id])

  return { data, loading, error, refetch: fetch }
}

export function useHRUserActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const create = async (data: CreateHRUserDto): Promise<HRUserDto | null> => {
    try {
      setLoading(true)
      setError(null)
      return await hrUsersService.create(data)
    } catch (err) {
      setError(err as ApiError)
      return null
    } finally {
      setLoading(false)
    }
  }

  const update = async (id: string, data: UpdateHRUserDto): Promise<HRUserDto | null> => {
    try {
      setLoading(true)
      setError(null)
      return await hrUsersService.update(id, data)
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
      await hrUsersService.remove(id)
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
