import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { apiGet } from '../auth/client';
import { friendlyError, validatePage, validatePrescription } from './data';
export function usePrescription(path, list = false) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let live = true;
    apiGet(path)
      .then((value) => {
        const data = list ? validatePage(value) : validatePrescription(value);
        if (live) setResult({ path, revision, data });
      })
      .catch((error) => {
        if (live) setResult({ path, revision, error: friendlyError(error) });
      });
    return () => {
      live = false;
    };
  }, [path, list, revision]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') reload();
    });
    const interval = setInterval(reload, 60000);
    return () => {
      listener.remove();
      clearInterval(interval);
    };
  }, [reload]);
  const current =
    result?.path === path && result.revision === revision ? result : null;
  // At an API-supplied expiry, ask the backend to recompute status/eligibility.
  const expiry = current?.data?.isActive ? current.data.expiresAt : null;
  useEffect(() => {
    if (!expiry) return;
    const delay = Date.parse(expiry) - Date.now();
    if (delay < 0) return; // periodic refresh handles server/client clock differences.
    const timer = setTimeout(reload, Math.min(delay + 100, 2147483647));
    return () => clearTimeout(timer);
  }, [expiry, reload]);
  return {
    data: current?.data,
    error: current?.error,
    loading: !current,
    reload,
  };
}
