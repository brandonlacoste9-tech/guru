"use client";

import { useState, useCallback } from "react";

export interface ScheduledJob {
  id: string;
  nextRun: string | null;
}

export function useScheduler() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getJobs = useCallback(async (): Promise<ScheduledJob[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/scheduler/jobs");
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.jobs;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const pauseGuru = useCallback(async (guruId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/scheduler/pause/${guruId}`, {
        method: "POST",
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const rescheduleGuru = useCallback(async (guruId: string, trigger: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/scheduler/reschedule/${guruId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getJobs,
    pauseGuru,
    rescheduleGuru,
  };
}
