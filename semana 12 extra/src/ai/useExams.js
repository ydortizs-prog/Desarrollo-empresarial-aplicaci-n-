// AI-written hook, reviewed and fixed.
//
// Fixes:
//  1. The list request had no AbortController and no `cancelled` flag: it was never cancelled and a slow
//     answer could overwrite a newer one. The effect now aborts and ignores answers from a previous run.
//  2. The rejection was swallowed (`console.error` + status "ready" with an empty list): a server error
//     looked exactly like "there are no exams". It now goes to status "error" with a sentence for the person.
//  3. create() had no guard against a double send and `saving` was always false. A ref blocks the second
//     call and `saving` follows the request.
//  4. remove() never touched the list after the server confirmed. The deleted row now disappears without
//     reloading, and a failed delete keeps the row and shows the error.
import { useCallback, useEffect, useRef, useState } from "react";
import { createExam, deleteExam, describeError, listExams } from "./api";

export default function useExams() {
  const [status, setStatus] = useState("loading");
  const [exams, setExams] = useState([]);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const creating = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setStatus("loading");
    setExams([]);
    setError(null);

    listExams({ signal: controller.signal }).then(
      (data) => {
        if (cancelled) return;
        setExams(data);
        setStatus("ready");
      },
      (failure) => {
        if (cancelled) return;
        setExams([]);
        setError(describeError(failure));
        setStatus("error");
      }
    );

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  const remove = useCallback(async (id) => {
    try {
      await deleteExam(id);
      setExams((current) => current.filter((exam) => exam.id !== id));
      setActionError(null);
      return true;
    } catch (failure) {
      setActionError(describeError(failure));
      return false;
    }
  }, []);

  const create = useCallback(async (title) => {
    if (creating.current) return false;
    creating.current = true;
    setSaving(true);

    try {
      const exam = await createExam(title);
      setExams((current) => [...current, exam]);
      setActionError(null);
      return true;
    } catch (failure) {
      setActionError(describeError(failure));
      return false;
    } finally {
      creating.current = false;
      setSaving(false);
    }
  }, []);

  return { status, exams, error, actionError, saving, reload, remove, create };
}
