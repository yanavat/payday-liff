// ============================================================
// React Hooks - EWA Requests API
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { ewaRequestsService } from "../services";
import type {
  EWARequestDto,
  CreateRequestDto,
  OnBehalfRequestDto,
  PreviewRequestDto,
  PreviewResultDto,
  RejectRequestDto,
  ListParams,
  PaginatedResponse,
  ApiError,
} from "../types";

export function useEWARequests(
  params?: ListParams & { employeeId?: string; status?: string },
) {
  const [data, setData] = useState<PaginatedResponse<EWARequestDto> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);
        const result = await ewaRequestsService.list(params);
        if (!signal?.aborted) setData(result);
      } catch (err) {
        if (!signal?.aborted) setError(err as ApiError);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [JSON.stringify(params)],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const retry = useCallback(() => fetchData(), [fetchData]);

  return { data, loading, error, refetch: fetchData, retry };
}

export function useEWARequest(id: string) {
  const [data, setData] = useState<EWARequestDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const result = await ewaRequestsService.get(id);
        if (!signal?.aborted) setData(result);
      } catch (err) {
        if (!signal?.aborted) setError(err as ApiError);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const retry = useCallback(() => fetchData(), [fetchData]);

  return { data, loading, error, refetch: fetchData, retry };
}

export function usePreviewEWARequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const preview = useCallback(
    async (data: PreviewRequestDto): Promise<PreviewResultDto | null> => {
      try {
        setLoading(true);
        setError(null);
        return await ewaRequestsService.preview(data);
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { preview, loading, error };
}

export function useEWARequestActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const create = useCallback(
    async (data: CreateRequestDto): Promise<EWARequestDto | null> => {
      try {
        setLoading(true);
        setError(null);
        return await ewaRequestsService.create(data);
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createOnBehalf = useCallback(
    async (data: OnBehalfRequestDto): Promise<EWARequestDto | null> => {
      try {
        setLoading(true);
        setError(null);
        return await ewaRequestsService.createOnBehalf(data);
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const approve = useCallback(
    async (id: string): Promise<EWARequestDto | null> => {
      try {
        setLoading(true);
        setError(null);
        return await ewaRequestsService.approve(id);
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reject = useCallback(
    async (
      id: string,
      data?: RejectRequestDto,
    ): Promise<EWARequestDto | null> => {
      try {
        setLoading(true);
        setError(null);
        return await ewaRequestsService.reject(id, data);
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const disburse = useCallback(
    async (id: string): Promise<EWARequestDto | null> => {
      try {
        setLoading(true);
        setError(null);
        return await ewaRequestsService.disburse(id);
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const exportBatch = useCallback(
    async (requestIds: string[]): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        return await ewaRequestsService.exportBatch(requestIds);
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const markTransferFailed = useCallback(
    async (id: string): Promise<EWARequestDto | null> => {
      try {
        setLoading(true);
        setError(null);
        return await ewaRequestsService.markTransferFailed(id);
      } catch (err) {
        setError(err as ApiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    create,
    createOnBehalf,
    approve,
    reject,
    disburse,
    exportBatch,
    markTransferFailed,
    loading,
    error,
  };
}
