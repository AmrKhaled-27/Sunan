import { ReminderSlot } from "@/types";

export const REMINDER_SLOT_TIMES: Record<
  ReminderSlot,
  { hour: number; minute: number }
> = {
  fajr: { hour: 5, minute: 0 },
  morning: { hour: 7, minute: 30 },
  dhuhr: { hour: 12, minute: 30 },
  asr: { hour: 15, minute: 30 },
  afternoon: { hour: 15, minute: 30 },
  maghrib: { hour: 18, minute: 30 },
  ishaa: { hour: 20, minute: 0 },
  before_sleep: { hour: 22, minute: 0 },
};
