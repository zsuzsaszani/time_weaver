
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface DaySpecificTime extends TimeSlot {
  day: DayOfWeek;
}

export interface Commitment {
  id: string;
  name: string;
  days: DayOfWeek[];
  timeType: 'uniform' | 'per-day';
  uniformTime?: TimeSlot;
  daySpecificTimes?: DaySpecificTime[];
}

export interface LifestyleData {
  wakeUpTime: string;
  bedTime: string;
  mealsPerDay: string;
  mealTimes: string;
  creativeWorkPreference: 'morning' | 'afternoon' | 'evening' | '';
  focusedWorkPreference: 'morning' | 'afternoon' | 'evening' | '';
  exerciseInfo: string;
  otherPreferences: string;
}

export type ActivityFrequency = 'daily' | 'weekly';
export type PreferredTime = 'any' | 'morning' | 'afternoon' | 'evening';

export interface DesiredActivity {
  id: string;
  name: string;
  durationHours: string; // For daily: duration per day. For weekly: total hours per week.
  minDurationPerSession: string; // Minimum hours for one session
  maxDurationPerSession: string; // Maximum hours for one session
  frequency: ActivityFrequency;
  preferredTime: PreferredTime;
}

export type AppStep = 'lifestyle' | 'commitments' | 'activities' | 'schedule';

