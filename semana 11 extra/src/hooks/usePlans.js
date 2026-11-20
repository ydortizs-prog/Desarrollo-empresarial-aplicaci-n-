import { useCallback, useEffect, useState } from "react";

const LOADING = { status: "loading", plans: [], error: null };

/**
 * Loads the agent plans and exposes the three states of a request:
 * `loading`, `ready` and `error`, plus a stable `reload()`.
 *
 * Every effect run gets its own `cancelled` flag: when the effect repeats
 * (reload) or the component unmounts, the previous response is ignored, so a
 * slow old request can never overwrite a newer one.
 */
export default function usePlans(fetchPlans) {
  const [state, setState] = useState(LOADING);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState(LOADING);

    fetchPlans().then(
      (plans) => {
        if (!cancelled) setState({ status: "ready", plans, error: null });
      },
      (error) => {
        if (!cancelled) setState({ status: "error", plans: [], error });
      }
    );

    return () => {
      cancelled = true;
    };
  }, [fetchPlans, attempt]);

  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  return { ...state, reload };
}
