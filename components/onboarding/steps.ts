export type TourTargetKey =
  "card" | "streakDots" | "markDone" | "routineMenu" | "tabBar";

export interface OnboardingStep {
  id: string;
  targetKey?: TourTargetKey;
  title: string;
  body: string;
  padding?: number;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "مرحباً بك في سنن",
    body: "نُحيي مجموعة من السنن معاً، ونُداوم عليها سبعة أيام. خطوة صغيرة كل يوم، حتى تصبح عادة.",
  },
  {
    id: "streakDots",
    targetKey: "streakDots",
    title: "كلّ يوم خطوة",
    body: "كل نقطة يومٌ سجّلت فيه تطبيق جميع سنن المجموعة. بعد سبعة أيام متتالية تُضاف سننها إلى إنجازاتك وتبدأ مجموعة جديدة.",
    padding: 6,
  },
  {
    id: "card",
    targetKey: "card",
    title: "سنن واضحة، في مكان واحد",
    body: "اقرأ شرح كل سنّة بالتمرير لأسفل. فضائلها في اللوحة التي تعلوها، وجميع أحاديثها في «عرض المصادر» أسفل القائمة.",
    padding: 4,
  },
  {
    id: "markDone",
    targetKey: "markDone",
    title: "فعلتها اليوم",
    body: "بعد تطبيق جميع السنن المعروضة، سجّل يومك بضغطة واحدة. يبقى هذا الزر أمامك أثناء القراءة، دون الحاجة لعلامة منفصلة لكل سنّة.",
    padding: 6,
  },
  {
    id: "routineMenu",
    targetKey: "routineMenu",
    title: "خيارات المجموعة",
    body: "من زر «خيارات المجموعة» يمكنك إضافة السنن كلها إلى إنجازاتك إن كنت تفعلها بالفعل، أو تأجيلها مع تصفير عدّاد أيامها. سنطلب تأكيدك أولاً.",
    padding: 6,
  },
  {
    id: "tabBar",
    targetKey: "tabBar",
    title: "تابع أثر خطواتك",
    body: "في «الانجازات» تجد كل سنّة أتممتها؛ قد تضيف مجموعة واحدة عدة سنن. ومن «الإعدادات» تضبط التذكيرات وأوقات الصلاة.",
    padding: 0,
  },
];
