import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchBillingStatus,
  recordStageRender,
  type BillingStatus,
} from '../services/billingService';

export interface StageMeter {
  status: BillingStatus | null;
  loading: boolean;
  /** True only when metering is live and the workspace is out of stages. */
  blocked: boolean;
  refresh: () => Promise<void>;
  /** Call after a render succeeds. */
  countStage: () => Promise<void>;
}

/**
 * Reads the workspace's stage usage and keeps it fresh. Never blocks the studio
 * when metering is unavailable — see billingService for the fail-open contract.
 */
export function useStageMeter(): StageMeter {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const next = await fetchBillingStatus();
    if (mounted.current) {
      setStatus(next);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const countStage = useCallback(async () => {
    const next = await recordStageRender();
    if (next && mounted.current) setStatus(next);
  }, []);

  return {
    status,
    loading,
    blocked: Boolean(status?.configured && status.blocked),
    refresh,
    countStage,
  };
}
