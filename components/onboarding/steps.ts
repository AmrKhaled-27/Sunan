export type TourTargetKey =
  "card" | "streakDots" | "markDone" | "alreadyDoing" | "skip" | "tabBar";

export interface OnboardingStep {
  id: string;
  /** Omit to show a centered tooltip with no spotlight. */
  targetKey?: TourTargetKey;
  title: string;
  body: string;
  /** Extra breathing room around the highlighted element, in points. */
  padding?: number;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "مرحباً بك في سنن",
    body: "روتين من السنن في كل مرة، حتى تصبح عادة. دعنا نشرح لك الواجهة في خطوات سريعة.",
  },
  {
    id: "card",
    targetKey: "card",
    title: "هذا روتين اليوم",
    body: "تجد هنا جميع السنن المتبقية في الروتين وشرح كل عمل. زر الأدلة يعرض أحاديث كل سنة ومصادرها.",
    padding: 4,
  },
  {
    id: "streakDots",
    targetKey: "streakDots",
    title: "النقاط السبع",
    body: "كل نقطة تعني يوماً تؤكد فيه تطبيق الروتين كله. بعد سبعة أيام متتالية تُحسب سننه ضمن إنجازاتك وتنتقل إلى الروتين التالي.",
    padding: 10,
  },
  {
    id: "markDone",
    targetKey: "markDone",
    title: "زر «فعلت الروتين اليوم»",
    body: "ضغطة واحدة تؤكد تطبيق الروتين كله لهذا اليوم، فتضيء نقطة جديدة من النقاط السبع.",
    padding: 8,
  },
  {
    id: "alreadyDoing",
    targetKey: "alreadyDoing",
    title: "«أفعلها بالفعل»",
    body: "إذا كنت تفعل جميع سنن هذا الروتين أصلاً، فاضغط هنا لتُحسب السنن المتبقية من إنجازاتك وتنتقل إلى الروتين التالي.",
    padding: 10,
  },
  {
    id: "skip",
    targetKey: "skip",
    title: "«تخطي»",
    body: "يؤجل الروتين الحالي ويصفّر عدّاد أيامه. ستعود للروتينات المؤجلة بعد بقية الروتينات.",
    padding: 10,
  },
  {
    id: "tabBar",
    targetKey: "tabBar",
    title: "بقية الأقسام",
    body: "«الانجازات» تعرض ما أتممته من السنن، و«الإعدادات» للتذكيرات وأوقات الصلاة.",
    padding: 0,
  },
];
