// ============================================================
// React Hooks - Employees API
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { employeesService } from "../services";
import type {
  EmployeeDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EwaOverridesDto,
  EffectivePolicyResponse,
  CurrentPeriodResponse,
  ListParams,
  PaginatedResponse,
  ApiError,
} from "../types";

export function useEmployees(
  params?: ListParams & {
    department?: string;
    payCycle?: "monthly" | "weekly";
  },
) {
  const [data, setData] = useState<PaginatedResponse<EmployeeDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const result = await employeesService.list(params);
      if (!signal?.aborted) setData(result);
    } catch (err) {
      if (!signal?.aborted) setError(err as ApiError);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const retry = useCallback(() => fetchData(), [fetchData]);

  return { data, loading, error, refetch: fetchData, retry };
}

export function useEmployee(id: string) {
  const [data, setData] = useState<EmployeeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const result = await employeesService.get(id);
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useEmployeeEffectivePolicy(id: string) {
  const [data, setData] = useState<EffectivePolicyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetch = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const result = await employeesService.getEffectivePolicy(id);
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [id]);

  return { data, loading, error, refetch: fetch };
}

export function useEmployeeCurrentPeriod(id: string) {
  const [data, setData] = useState<CurrentPeriodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetch = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const result = await employeesService.getCurrentPeriod(id);
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [id]);

  return { data, loading, error, refetch: fetch };
}

export function useEmployeeActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const create = async (
    data: CreateEmployeeDto,
  ): Promise<EmployeeDto | null> => {
    try {
      setLoading(true);
      setError(null);
      return await employeesService.create(data);
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const update = async (
    id: string,
    data: UpdateEmployeeDto,
  ): Promise<EmployeeDto | null> => {
    try {
      setLoading(true);
      setError(null);
      return await employeesService.update(id, data);
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await employeesService.remove(id);
      return true;
    } catch (err) {
      setError(err as ApiError);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const setOverrides = async (
    id: string,
    overrides: EwaOverridesDto,
  ): Promise<EmployeeDto | null> => {
    try {
      setLoading(true);
      setError(null);
      return await employeesService.setOverrides(id, overrides);
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, setOverrides, loading, error };
}
