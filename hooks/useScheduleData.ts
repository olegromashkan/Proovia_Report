import { useCallback, useState } from 'react';

export interface Trip {
  ID: string;
  Start_Time?: string;
  End_Time?: string;
  Driver1?: string;
  Contractor?: string;
  Punctuality?: string;
  Calendar_Name?: string;
  Order_Value?: string;
  isAssigned?: boolean;
  fromLeftIndex?: number;
}

async function safeFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res;
}

export function useScheduleData() {
  const [itemsLeft, setItemsLeft] = useState<Trip[]>([]);
  const [itemsRight, setItemsRight] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leftRes, rightRes] = await Promise.all([
        safeFetch('/api/schedule-tool'),
        safeFetch('/api/schedule-tool2'),
      ]);
      const leftJson = await leftRes.json();
      const rightJson = await rightRes.json();
      setItemsLeft(Array.isArray(leftJson) ? leftJson : leftJson.trips || []);
      setItemsRight(Array.isArray(rightJson) ? rightJson : rightJson.trips || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveLeft = useCallback(async (items: Trip[]) => {
    await safeFetch('/api/schedule-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trips: items }),
    });
  }, []);

  const saveRight = useCallback(async (items: Trip[]) => {
    await safeFetch('/api/schedule-tool2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trips: items }),
    });
  }, []);

  const setLeftAndSave = useCallback(
    (updater: (arr: Trip[]) => Trip[]) => {
      setItemsLeft(prev => {
        const next = updater(prev);
        saveLeft(next).catch(() => null);
        return next;
      });
    },
    [saveLeft]
  );

  const setRightAndSave = useCallback(
    (updater: (arr: Trip[]) => Trip[]) => {
      setItemsRight(prev => {
        const next = updater(prev);
        saveRight(next).catch(() => null);
        return next;
      });
    },
    [saveRight]
  );

  return {
    itemsLeft,
    itemsRight,
    isLoading,
    error,
    loadData,
    saveLeft,
    saveRight,
    updateLeft: setLeftAndSave,
    updateRight: setRightAndSave,
  };
}

export default useScheduleData;
