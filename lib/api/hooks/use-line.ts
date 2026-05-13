// ============================================================
// React Hooks - LINE API
// ============================================================

import { useState } from 'react'
import { lineService } from '../services'
import type {
  PushMessageDto,
  NotifyRequestStatusDto,
  ApiError,
} from '../types'

export function useLineActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const push = async (data: PushMessageDto): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      const result = await lineService.push(data)
      return result.success
    } catch (err) {
      setError(err as ApiError)
      return false
    } finally {
      setLoading(false)
    }
  }

  const notifyRequestStatus = async (data: NotifyRequestStatusDto): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      const result = await lineService.notifyRequestStatus(data)
      return result.success
    } catch (err) {
      setError(err as ApiError)
      return false
    } finally {
      setLoading(false)
    }
  }

  const getRichMenu = async (): Promise<{ richMenuId?: string; alias?: string } | null> => {
    try {
      setLoading(true)
      setError(null)
      return await lineService.getRichMenu()
    } catch (err) {
      setError(err as ApiError)
      return null
    } finally {
      setLoading(false)
    }
  }

  const setRichMenu = async (data: { richMenuId?: string; alias?: string }): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      const result = await lineService.setRichMenu(data)
      return result.success
    } catch (err) {
      setError(err as ApiError)
      return false
    } finally {
      setLoading(false)
    }
  }

  return { push, notifyRequestStatus, getRichMenu, setRichMenu, loading, error }
}
