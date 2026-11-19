import { AccomplishedRecord } from "@/types";
import { formatArabicDate } from "@/utils/date";

const METHOD_LABELS: Record<string, string> = {
  streak: "سبعة أيام متتالية",
  already_doing: "كنت أفعلها",
};

export function achievementMethodLabel(record?: AccomplishedRecord) {
  return record?.method ? METHOD_LABELS[record.method] : "مكتملة";
}

export function achievementDateLabel(record?: AccomplishedRecord) {
  return record?.completedAt ? formatArabicDate(record.completedAt) : null;
}

export function achievementStatusLabel(record?: AccomplishedRecord) {
  const date = achievementDateLabel(record);
  const method = achievementMethodLabel(record);
  return date ? `${method} · ${date}` : method;
}
