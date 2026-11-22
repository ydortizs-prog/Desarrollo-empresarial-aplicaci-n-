// PART 3 - the hook of the exams screen: the list with its three states, delete and create.
// Run it with:  npm test -- useExams
//
// It returns { status, exams, error, actionError, saving, reload, remove, create }.
// Rule of the course: no hook inside an if, a loop or after a return.
import { useCallback, useEffect, useRef, useState } from "react";
import { createExam, deleteExam, describeError, listExams } from "./api";

export default function useExams() {
  const [status, setStatus] = useState("loading");
  const [exams, setExams] = useState([]);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [saving, setSaving] = useState(false);
  // Changing the counter is what asks for the list again without changing the identity of `reload`.
  const [attempt, setAttempt] = useState(0);
  // A ref, not a state: the second click of a double click happens before React redraws the button.
  const creating = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    // This run's own flag: when the effect repeats or unmounts, its late answer is ignored.
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
      // The server confirmed: the row disappears without asking for the whole list again.
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
