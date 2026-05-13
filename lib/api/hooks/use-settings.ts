// ============================================================
// React Hooks - Settings API
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { settingsService } from "../services";
import type {
  AppSettingsDto,
  UpdateSettingsDto,
  PartialEwaPolicyDto,
  UpdateNotificationSettingsDto,
  ApiError,
} from "../types";

export function useSettings() {
  const [data, setData] = useState<AppSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const result = await settingsService.get();
      if (!signal?.aborted) setData(result);
    } catch (err) {
      if (!signal?.aborted) setError(err as ApiError);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const retry = useCallback(() => fetchData(), [fetchData]);

  return { data, loading, error, refetch: fetchData, retry };
}

export function useEwaPolicy(cycle: "monthly" | "weekly") {
  const [data, setData] = useState<PartialEwaPolicyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await settingsService.getPolicy(cycle);
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, [cycle]);

  // useEffect(() => {
  //   fetch();
  // }, [cycle, fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useSettingsActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updateSettings = async (
    data: UpdateSettingsDto,
  ): Promise<AppSettingsDto | null> => {
    try {
      setLoading(true);
      setError(null);
      return await settingsService.update(data);
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePolicy = async (
    cycle: "monthly" | "weekly",
    data: PartialEwaPolicyDto,
  ): Promise<PartialEwaPolicyDto | null> => {
    try {
      setLoading(true);
      setError(null);
      return await settingsService.updatePolicy(cycle, data);
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateNotifications = async (
    data: UpdateNotificationSettingsDto,
  ): Promise<AppSettingsDto | null> => {
    try {
      setLoading(true);
      setError(null);
      return await settingsService.updateNotifications(data);
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateSettings, updatePolicy, updateNotifications, loading, error };
}
