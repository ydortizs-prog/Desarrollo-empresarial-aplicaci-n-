import { useCallback, useEffect, useState } from "react";

const LOADING = { status: "loading", plans: [], error: null };

/**
 * AI hook, reviewed and fixed.
 *
 * Bugs fixed:
 *  1. The rejection only logged to the console: `status` stayed "loading" and
 *     `error` was never set. It now moves to the "error" state.
 *  2. There was no `cancelled` flag, so a slow old response could overwrite a
 *     newer one (and could touch state after unmount). Each effect run now
 *     ignores responses that belong to a previous run.
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
