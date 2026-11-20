import { useCallback, useEffect, useRef, useState } from "react";

const IDLE = { status: "idle", plan: null, result: null, error: null };

/**
 * AI hook, reviewed and fixed.
 *
 * Bugs fixed:
 *  1. It returned before calling useRef/useCallback when `runAgent` was
 *     missing, which breaks the rules of hooks. Every hook is now called
 *     unconditionally; `runAgent` is kept in a ref.
 *  2. An R2 plan went straight to "done". It now stops in
 *     "awaiting_approval" and only approve() applies it.
 *  3. There was no unmount cleanup: an in-flight run kept going. The effect
 *     now aborts the controller when the component unmounts.
 */
export default function useAgentRun(runAgent) {
  const [run, setRun] = useState(IDLE);
  const latest = useRef(IDLE);
  const controller = useRef(null);
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

  useEffect(() => {
    return () => {
      controller.current?.abort();
    };
  }, []);

  return { ...run, start, approve, reject };
}
