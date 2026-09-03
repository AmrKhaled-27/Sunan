export type TourTargetKey =
  | "card"
  | "streakDots"
  | "markDone"
  | "alreadyDoing"
  | "skip"
  | "tabBar";

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
    body: "سنة واحدة في كل مرة، حتى تصبح عادة. دعنا نشرح لك الواجهة في خطوات سريعة.",
  },
  {
    id: "card",
    targetKey: "card",
    title: "هذه سنة اليوم",
    body: "تجد هنا عنوان السنة، وشرح العمل، والحديث الذي وردت فيه، والأجر المرتّب عليها.",
    padding: 4,
  },
  {
    id: "streakDots",
    targetKey: "streakDots",
    title: "النقاط السبع",
    body: "كل نقطة تعني يوماً. طبّق السنة سبعة أيام متتالية لتصبح عادة، ثم تنتقل تلقائياً إلى السنة التالية.",
    padding: 10,
  },
  {
    id: "markDone",
    targetKey: "markDone",
    title: "زر «فعلتها اليوم»",
    body: "اضغطه بعد تطبيق السنة، فتضيء نقطة جديدة من النقاط السبع.",
    padding: 8,
  },
  {
    id: "alreadyDoing",
    targetKey: "alreadyDoing",
    title: "«أفعلها بالفعل»",
    body: "إذا كنت تفعل هذه السنة أصلاً في حياتك، فاضغط هنا لتُحسب من إنجازاتك وتنتقل مباشرةً إلى السنة التالية دون انتظار سبعة أيام.",
    padding: 10,
  },
  {
    id: "skip",
    targetKey: "skip",
    title: "«تخطي»",
    body: "يؤجل السنة الحالية وينقلك إلى غيرها، ويمكنك العودة إليها في وقت لاحق.",
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
