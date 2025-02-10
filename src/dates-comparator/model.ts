import { action, makeObservable, observable } from 'mobx';
import { timeDuration } from 'yummies/date-time';
import { Maybe } from 'yummies/utils/types';

import {
  DatesComparison,
  DatesComparatorConfig,
  DatesToCompare,
  ResolvedCompareDateType,
  CompareDateType,
} from './model.types';

/**
 * Entity for comparing two dates, allows you to dynamically get the difference between two dynamic dates
 */
export class DatesComparator implements DatesComparison {
  dates: DatesToCompare | null = null;
  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;

  private timeoutId: Maybe<number>;

  constructor(private config?: DatesComparatorConfig) {
    if (this.config?.dates != null) {
      this.setDates(this.config.dates);
    }
    observable.ref(this, 'dates');
    observable.ref(this, 'hours');
    observable.ref(this, 'minutes');
    observable.ref(this, 'seconds');
    action.bound(this, 'compareDates');
    action.bound(this, 'setDates');
    makeObservable(this);
  }

  setDates(dates: DatesToCompare) {
    clearTimeout(this.timeoutId!);
    this.dates = dates;
    this.compareDates();
  }

  private getDatesComparison(): DatesComparison {
    if (this.dates === null) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const resolvedStartDate = this.resolveDate(this.dates[0]);
    const resolvedEndDate = this.resolveDate(this.dates[1]);

    if (this.config?.getComparison) {
      return this.config.getComparison(resolvedStartDate, resolvedEndDate);
    }

    const timeDiff = timeDuration(
      resolvedEndDate.getTime() - resolvedStartDate.getTime(),
    );

    return timeDiff;
  }

  private compareDates() {
    const diff = this.getDatesComparison();

    this.hours = diff.hours;
    this.minutes = diff.minutes;
    this.seconds = diff.seconds;

    if (diff.hours <= 0 && diff.minutes <= 0 && diff.seconds <= 0) {
      clearTimeout(this.timeoutId!);
      this.timeoutId = undefined;
    } else if (
      this.isDateDynamic(this.dates?.[0]) ||
      this.isDateDynamic(this.dates?.[1])
    ) {
      this.timeoutId = setTimeout(
        this.compareDates,
        this.config?.checkTime ?? 100,
      );
    }
  }

  get isEmpty() {
    return this.totalHours === 0;
  }

  get totalHours() {
    return this.hours + this.minutes / 60 + this.seconds / 3600;
  }

  get totalMinutes() {
    return this.hours * 60 + this.minutes + this.seconds / 60;
  }

  get totalSeconds() {
    return this.hours * 3600 + this.minutes * 60 + this.seconds;
  }

  private isDateDynamic(date: Maybe<CompareDateType>) {
    return typeof date === 'string';
  }

  private resolveDate(date: CompareDateType): ResolvedCompareDateType {
    if (date === 'now') {
      return new Date();
    } else if (typeof date === 'number') {
      return new Date(date);
    }

    return date;
  }

  reset() {
    clearTimeout(this.timeoutId!);
    this.dates = null;
    this.timeoutId = undefined;
  }
}
