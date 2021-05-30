import { DateTime, Interval } from 'luxon';

/**
 * Get time diff in minute
 */
export function getTimeDiffinMins(
  end: DateTime,
  start: DateTime = DateTime.now()
) {
  const interval = Interval.fromDateTimes(start, end);
  const minutes = interval.length('minutes');

  if (isNaN(minutes)) {
    return 0;
  }

  return Math.floor(minutes);
}
