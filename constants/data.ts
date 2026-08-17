import { ReminderSlot, Sunnah } from "@/types";

// Re-export types for backward compatibility
export type {
  SunnahDifficulty,
  ReminderSlot,
  NotificationSchedule,
  Sunnah,
} from "@/types";

// ─── Reminder slot → default hour/minute ──────────────────────────────────────

export const REMINDER_SLOT_TIMES: Record<
  ReminderSlot,
  { hour: number; minute: number }
> = {
  fajr: { hour: 5, minute: 0 },
  morning: { hour: 8, minute: 0 },
  dhuhr: { hour: 12, minute: 30 },
  asr: { hour: 15, minute: 30 },
  afternoon: { hour: 15, minute: 30 },
  maghrib: { hour: 18, minute: 30 },
  ishaa: { hour: 20, minute: 0 },
  evening: { hour: 20, minute: 0 },
  before_sleep: { hour: 21, minute: 30 },
};

// ─── Sunnah Data ──────────────────────────────────────────────────────────────
// RULE: Never change or reuse an existing ID. Mark deprecated instead of deleting.
export const SUNNAHS: Sunnah[] = [
  {
    id: "1",
    title: "قول بسم الله قبل الأكل",
    action:
      "قبل ما تبدأ الأكل، قول 'بسم الله'. ولو نسيت وبدأت الأكل، قول في أي وقت أثناء الوجبة: 'بسم الله في أوله وآخره'.",
    hadith:
      "قال رسول الله ﷺ: «إذا أكل أحدكم طعاماً فليقل: بسم الله، فإن نسي في أوله فليقل: بسم الله في أوله وآخره»",
    category: "eating",
    difficulty: "easy",
    reward: "حماية من مشاركة الشيطان لك في أكلك.",
    rewardSource:
      "عن حذيفة رضي الله عنه: أن الشيطان يستحل الطعام الذي لم يُذكر اسم الله عليه (رواه مسلم 2017).",
    notificationSchedule: {
      reminderSlots: ["morning", "afternoon", "evening"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "قبل ما تاكل، قول بسم الله 🍽️",
      "التسمية بركة في الطعام",
      "لا تنسَ بسم الله على وجبتك",
    ],
  },
  {
    id: "2",
    title: "الأكل والشرب باليد اليمنى",
    action:
      "كل واشرب بيدك اليمنى مش الشمال، والحديث بيقول كمان كُل من اللي قدامك مباشرة مش من نص الطبق أو من مكان بعيد عنك.",
    hadith:
      "عن عمر بن أبي سلمة رضي الله عنه قال: كنت غلاماً في حجر رسول الله ﷺ، فقال لي: «يا غلام، سمِّ الله، وكل بيمينك، وكل مما يليك»",
    category: "eating",
    difficulty: "easy",
    reward: "مخالفة لفعل الشيطان اللي بياكل ويشرب بشماله.",
    rewardSource: "«الشيطان يأكل بشماله ويشرب بشماله» (رواه مسلم 2020).",
    notificationSchedule: {
      reminderSlots: ["morning", "afternoon", "evening"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكّر: كُل واشرب بيمينك ✋",
      "سنة بسيطة بس أجرها عظيم",
      "يمينك أولى بالطعام والشراب",
    ],
  },
  {
    id: "3",
    title: "الاستغفار والذكر بعد السلام من الصلاة",
    action:
      "فوراً بعد ما تسلّم من الصلاة، قول 'أستغفر الله' 3 مرات، وبعدين: 'اللهم أنت السلام، ومنك السلام، تباركت يا ذا الجلال والإكرام'.",
    hadith:
      "عن ثوبان رضي الله عنه قال: كان رسول الله ﷺ إذا انصرف من صلاته استغفر ثلاثاً، وقال: «اللهم أنت السلام، ومنك السلام، تباركت يا ذا الجلال والإكرام»",
    category: "dhikr",
    difficulty: "easy",
    reward: "الاستغفار سبب عام لمغفرة الذنوب.",
    rewardSource: null,
    notificationSchedule: {
      reminderSlots: ["dhuhr", "maghrib", "evening"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "بعد السلام مباشرة، استغفر ثلاثاً 🤲",
      "اللهم أنت السلام ومنك السلام",
    ],
  },
  {
    id: "4",
    title: "التسبيح بعد الصلاة (33 - 33 - 34)",
    action:
      "بعد كل صلاة مفروضة، قول: سبحان الله 33 مرة، الحمد لله 33 مرة، الله أكبر 33 مرة، وكمّل المية بقول: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير'.",
    hadith:
      "عن أبي هريرة رضي الله عنه أن رسول الله ﷺ قال: «من سبّح الله في دبر كل صلاة ثلاثاً وثلاثين، وحمد الله ثلاثاً وثلاثين، وكبّر الله ثلاثاً وثلاثين، فتلك تسعة وتسعون، وقال تمام المائة: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير: غفرت خطاياه وإن كانت مثل زبد البحر»",
    category: "dhikr",
    difficulty: "medium",
    reward: "غفران الذنوب حتى لو كانت كتير جداً.",
    rewardSource: "«...غفرت خطاياه وإن كانت مثل زبد البحر» (رواه مسلم 597).",
    notificationSchedule: {
      reminderSlots: ["dhuhr", "maghrib", "evening"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "بعد الصلاة، خصص دقيقة للتسبيح 📿",
      "33 - 33 - 34... خطوة بسيطة لمغفرة كبيرة",
    ],
  },
  {
    id: "5",
    title: "قراءة آية الكرسي بعد كل صلاة مكتوبة",
    action:
      "بعد ما تسلّم من أي صلاة مفروضة، اقرأ آية الكرسي (سورة البقرة: 255) قبل ما تقوم من مكانك.",
    hadith:
      "قال رسول الله ﷺ: «من قرأ آية الكرسي دبر كل صلاة مكتوبة، لم يمنعه من دخول الجنة إلا أن يموت»",
    category: "dhikr",
    difficulty: "medium",
    reward: "لا يمنعك من دخول الجنة إلا الموت.",
    rewardSource:
      "«من قرأ آية الكرسي دبر كل صلاة مكتوبة، لم يمنعه من دخول الجنة إلا أن يموت» (رواه النسائي في الكبرى، وصححه الألباني وابن حبان).",
    notificationSchedule: {
      reminderSlots: ["dhuhr", "maghrib", "evening"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "بعد الصلاة، اقرأ آية الكرسي 📖",
      "سنة بعد كل صلاة مكتوبة",
    ],
  },
  {
    id: "6",
    title: "صلاة الضحى ركعتين",
    action: "صلِّ ركعتين بعد شروق الشمس بحوالي ربع ساعة، لحد قبل الظهر بشوية.",
    hadith:
      "عن أبي ذر رضي الله عنه أن النبي ﷺ قال: «يُصبح على كل سُلامى من أحدكم صدقة، فكل تسبيحة صدقة، وكل تحميدة صدقة، وكل تهليلة صدقة، وكل تكبيرة صدقة، وأمر بالمعروف صدقة، ونهي عن المنكر صدقة، ويُجزئ من ذلك ركعتان يركعهما من الضحى»",
    category: "prayer",
    difficulty: "medium",
    reward: "تجزئ عن صدقة كل مفاصل جسمك.",
    rewardSource: "«...ويُجزئ من ذلك ركعتان يركعهما من الضحى» (رواه مسلم 720).",
    notificationSchedule: {
      reminderSlots: ["morning"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "خصص دقيقتين لركعتي الضحى ☀️",
      "ركعتان تغنيك عن صدقة كل مفاصل جسمك",
    ],
  },
  {
    id: "7",
    title: "دعاء دخول الخلاء",
    action: "قبل ما تدخل الحمام، قول: «اللهم إني أعوذ بك من الخبث والخبائث».",
    hadith:
      "كان النبي ﷺ إذا دخل الخلاء قال: «اللهم إني أعوذ بك من الخبث والخبائث»",
    category: "hygiene",
    difficulty: "easy",
    reward: "حماية من أذى الشياطين في هذا المكان.",
    rewardSource: null,
    notificationSchedule: {
      reminderSlots: ["morning", "evening"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "قبل الدخول، تذكّر دعاء دخول الخلاء 🚪",
      "سنة بسيطة تتكرر كل يوم",
    ],
  },
  {
    id: "8",
    title: "دعاء الخروج من الخلاء",
    action: "بعد ما تخرج من الحمام، قول: «غفرانك».",
    hadith: "كان النبي ﷺ إذا خرج من الخلاء قال: «غفرانك»",
    category: "hygiene",
    difficulty: "easy",
    reward: "طلب المغفرة من الله.",
    rewardSource: null,
    notificationSchedule: {
      reminderSlots: ["morning", "evening"],
      endOfDayCheckIn: true,
    },
    notificationMessages: ["بعد الخروج، قول: غفرانك", "سنة صغيرة بلفظ واحد بس"],
  },
  {
    id: "9",
    title: "الدعاء عند الخروج من المنزل",
    action:
      "وأنت بتقفل باب البيت وراك، قول: «بسم الله، توكلت على الله، ولا حول ولا قوة إلا بالله».",
    hadith:
      "كان النبي ﷺ إذا خرج من بيته قال: «بسم الله، توكلت على الله، ولا حول ولا قوة إلا بالله»",
    category: "general",
    difficulty: "easy",
    reward: "تنال الهداية والحماية والكفاية من الله.",
    rewardSource:
      "«يقال له: كُفيت، وهُديت، ووُقيت، وتنحّى عنه الشيطان» (رواه أبو داود 5095 والترمذي، وصححه الألباني).",
    notificationSchedule: {
      reminderSlots: ["morning"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "قبل ما تخرج، قول دعاء الخروج 🚪",
      "توكل على الله وابدأ يومك",
    ],
  },
  {
    id: "10",
    title: "قول سبحان الله وبحمده مئة مرة في اليوم",
    action:
      "كرر 'سبحان الله وبحمده' مية مرة خلال اليوم، ممكن توزعها بعد كل صلاة بدل ما تقولها دفعة واحدة.",
    hadith:
      "قال رسول الله ﷺ: «من قال سبحان الله وبحمده في يوم مائة مرة، حُطّت خطاياه وإن كانت مثل زبد البحر»",
    category: "dhikr",
    difficulty: "easy",
    reward: "تُحط خطاياه ولو كانت كتير جداً.",
    rewardSource:
      "«من قال سبحان الله وبحمده في يوم مائة مرة، حُطّت خطاياه وإن كانت مثل زبد البحر» (متفق عليه، البخاري 6405 ومسلم 2691).",
    notificationSchedule: {
      reminderSlots: ["morning", "afternoon", "evening"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "سبحان الله وبحمده... كرّرها اليوم 📿",
      "مية مرة بسيطة، وخطايا كتير بتتحط",
    ],
  },
];
