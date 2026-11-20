import { useEffect, useState } from "react";

/**
 * Returns `value` once it has stayed unchanged for `delay` milliseconds.
 *
 * The previous timer is cancelled every time `value` or `delay` changes, and
 * also when the component unmounts, so intermediate values are never returned
 * and no timer outlives the hook.
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
