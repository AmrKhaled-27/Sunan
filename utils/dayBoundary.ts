/** Refresh at the next local calendar boundary, including 23/25-hour DST days. */
export function watchLocalDay(
  onDayChange: () => void,
  clock = () => new Date(),
  setTimer: typeof setTimeout = setTimeout,
  clearTimer: typeof clearTimeout = clearTimeout,
) {
  let active = true;
  let timer: ReturnType<typeof setTimeout>;

  const schedule = () => {
    const now = clock();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    timer = setTimer(() => {
      if (!active) return;
      onDayChange();
      schedule();
    }, midnight.getTime() - now.getTime());
  };

  schedule();
  return () => {
    active = false;
    clearTimer(timer);
  };
}
