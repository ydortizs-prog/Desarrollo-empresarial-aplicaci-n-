import { useEffect, useState } from "react";

/**
 * AI hook, reviewed and fixed.
 *
 * Bug fixed: the effect did not return its cleanup. Every change of `value` or
 * `delay` left the previous timer alive, so intermediate values could be
 * returned and, on unmount, only the last timer was cleared. The cleanup now
 * belongs to the same effect that creates the timer.
 */
export default function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
