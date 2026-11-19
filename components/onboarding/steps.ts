export type TourTargetKey =
  | "card"
  | "sources"
  | "streakDots"
  | "markDone"
  | "routineMenu"
  | "tabBar";

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
    body: "نُحيي معاً مجموعةً من السنن ونُداوم عليها سبعة أيام متتالية، لتصبح عادةً ثابتة في يومك.",
  },
  {
    id: "streakDots",
    targetKey: "streakDots",
    title: "كلّ يوم خطوة",
    body: "تُضيء نقطة مع كلّ يوم تُطبّق فيه سنن المجموعة. وبعد ٧ أيام متتالية تُضاف إلى إنجازاتك وتنتقل لمجموعة جديدة.",
    padding: 6,
  },
  {
    id: "card",
    targetKey: "card",
    title: "سنن واضحة، في مكان واحد",
    body: "هنا تجد شرح كلّ سنّة وفضلها بإيجاز. مرّر لأسفل لقراءة بقية سنن المجموعة.",
    padding: 8,
  },
  {
    id: "sources",
    targetKey: "sources",
    title: "المصادر والأحاديث",
    body: "من هنا تقرأ الأحاديث الكاملة ومصادرها ودرجة صحّتها لكلّ سنّة في المجموعة.",
    padding: 6,
  },
  {
    id: "markDone",
    targetKey: "markDone",
    title: "فعلتها اليوم",
    body: "بعد تطبيق سنن المجموعة اليوم، سجّل يومك بضغطة واحدة لتُضيء نقطة جديدة في عدّادك.",
    padding: 6,
  },
  {
    id: "routineMenu",
    targetKey: "routineMenu",
    title: "خيارات المجموعة",
    body: "إن كنت تُداوم على هذه السنن أصلاً فاختر «أمارسها بالفعل» لإضافتها لإنجازاتك، أو «تأجيل المجموعة» للعودة إليها لاحقاً.",
    padding: 6,
  },
  {
    id: "tabBar",
    targetKey: "tabBar",
    title: "تابع أثر خطواتك",
    body: "في «الإنجازات» تجد كلّ سنّة أتممتها، ومن «الإعدادات» تضبط التذكيرات وأوقات الصلاة.",
    padding: 0,
  },
];
