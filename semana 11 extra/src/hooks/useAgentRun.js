import { useCallback, useEffect, useRef, useState } from "react";

const IDLE = { status: "idle", plan: null, result: null, error: null };

/**
 * State machine for running one plan at a time.
 *
 *   idle -> running -> done                  (R1)
 *   idle -> running -> awaiting_approval -> done   (R2, only after approve())
 *
 * `reject()` cancels a run and returns to idle. Responses that arrive after an
 * abort (or after unmount) are discarded.
 */
export default function useAgentRun(runAgent) {
  const [run, setRun] = useState(IDLE);
  const latest = useRef(IDLE);
  const controller = useRef(null);
  // Keep the latest runAgent in a ref so the hook does not break when the prop
  // appears in a later render (no conditional hooks).
  const agent = useRef(runAgent);

  useEffect(() => {
    agent.current = runAgent;
  }, [runAgent]);

  const update = useCallback((next) => {
    latest.current = next;
    setRun(next);
  }, []);

  const start = useCallback(
    (plan) => {
      const { status } = latest.current;
      if (status === "running" || status === "awaiting_approval") return;

      const runner = agent.current;
      if (!runner) return;

      const current = new AbortController();
      controller.current = current;
      update({ status: "running", plan, result: null, error: null });

      runner(plan, { signal: current.signal }).then(
        (result) => {
          if (current.signal.aborted) return;
          // An R2 never goes straight to done: it needs the explicit approve().
          const nextStatus = plan.risk === "R2" ? "awaiting_approval" : "done";
          update({ status: nextStatus, plan, result, error: null });
        },
        (error) => {
          if (current.signal.aborted) return;
          update({ status: "error", plan, result: null, error });
        }
      );
    },
    [update]
  );

  const approve = useCallback(() => {
    if (latest.current.status !== "awaiting_approval") return;
    update({ ...latest.current, status: "done" });
  }, [update]);

  const reject = useCallback(() => {
    const { status } = latest.current;
    if (status !== "running" && status !== "awaiting_approval") return;
    controller.current?.abort();
    update(IDLE);
  }, [update]);

  // On unmount, abort whatever is still running and ignore its late response.
  useEffect(() => {
    return () => {
      controller.current?.abort();
    };
  }, []);

  return { ...run, start, approve, reject };
}
