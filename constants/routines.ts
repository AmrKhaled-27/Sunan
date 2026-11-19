import { Routine, RoutineGroup } from "@/types";

// Families of routines that are parts of one topic; shown together in the UI.
export const ROUTINE_GROUPS: RoutineGroup[] = [
  { id: "after_prayer", title: "أذكار ما بعد الصلاة" },
  { id: "rawatib", title: "السنن الرواتب" },
  { id: "sleep", title: "سنن النوم" },
];

// Array/member order is learning order, not a prescribed religious sequence.
// Schedules combine the original member reminder slots without duplicates.
export const ROUTINES: Routine[] = [
  {
    id: "after_prayer_core",
    groupId: "after_prayer",
    partTitle: "التسبيح والتهليل",
    title: "أذكار ما بعد الصلاة (١): التسبيح والتهليل",
    sunnahIds: ["1", "3", "4", "2"],
    notificationSchedule: {
      reminderSlots: ["fajr", "dhuhr", "asr", "maghrib", "ishaa"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بأذكار ما بعد الصلاة (١): الاستغفار، والتهليل، والتسبيح دبر كل صلاة",
    ],
  },
  {
    id: "after_prayer_recitation",
    groupId: "after_prayer",
    partTitle: "الآيات والدعاء",
    title: "أذكار ما بعد الصلاة (٢): الآيات والدعاء",
    sunnahIds: ["6", "5", "7"],
    notificationSchedule: {
      reminderSlots: ["fajr", "dhuhr", "asr", "maghrib", "ishaa"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بأذكار ما بعد الصلاة (٢): قراءة آية الكرسي والمعوذات والدعاء دبر كل صلاة",
    ],
  },
  {
    id: "rawatib_day",
    groupId: "rawatib",
    partTitle: "الفجر والظهر",
    title: "السنن الرواتب (١): الفجر والظهر",
    sunnahIds: ["27", "28"],
    notificationSchedule: {
      reminderSlots: ["fajr", "dhuhr"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بالسنن الرواتب (١): ركعتا الفجر وأربع ركعات قبل الظهر وركعتان بعدها",
    ],
  },
  {
    id: "rawatib_night",
    groupId: "rawatib",
    partTitle: "المغرب والعشاء",
    title: "السنن الرواتب (٢): المغرب والعشاء",
    sunnahIds: ["29", "46", "30"],
    notificationSchedule: {
      reminderSlots: ["maghrib", "ishaa"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بالسنن الرواتب (٢): ركعتان بعد المغرب وركعتان بعد العشاء وأداؤهما في البيت",
    ],
  },
  {
    id: "adhan",
    title: "سنن الأذان",
    sunnahIds: ["14", "15"],
    notificationSchedule: {
      reminderSlots: ["fajr", "dhuhr", "asr", "maghrib", "ishaa"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بسنن الأذان: الترديد خلف المؤذن والصلاة على النبي ﷺ والدعاء بعده",
    ],
  },
  {
    id: "wudu",
    title: "سنن الوضوء",
    sunnahIds: ["31", "32", "33", "34"],
    notificationSchedule: {
      reminderSlots: ["fajr", "dhuhr", "asr", "maghrib", "ishaa"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بسنن الوضوء: التسمية، إسباغ الوضوء، الذكر بعده، وركعتا الطهور",
    ],
  },
  {
    id: "waking_up",
    title: "سنن الاستيقاظ من النوم",
    sunnahIds: ["39", "40", "49", "42"],
    notificationSchedule: {
      reminderSlots: ["fajr", "morning"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بسنن الاستيقاظ: مسح النوم عن الوجه، دعاء اليقظة، قراءة خواتيم آل عمران، وإسباغ الطهارة",
    ],
  },
  {
    id: "home_in_out",
    title: "سنن الخروج من المنزل ودخوله",
    sunnahIds: ["43", "44"],
    notificationSchedule: {
      reminderSlots: ["morning", "dhuhr", "asr", "maghrib"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بسنن المنزل: دعاء الخروج، وذكر الله عند الدخول",
    ],
  },
  {
    id: "eating",
    title: "سنن الطعام",
    sunnahIds: ["16", "17"],
    notificationSchedule: {
      reminderSlots: ["morning", "afternoon", "maghrib"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بسنن الطعام: التسمية والأكل باليمين ومما يليك، وحمد الله بعد الفراغ",
    ],
  },
  {
    id: "toilet",
    title: "آداب الخلاء",
    sunnahIds: ["8", "9"],
    notificationSchedule: {
      reminderSlots: [
        "fajr",
        "morning",
        "dhuhr",
        "asr",
        "maghrib",
        "ishaa",
        "before_sleep",
      ],
      endOfDayCheckIn: true,
    },
    notificationMessages: ["تذكير بآداب الخلاء: دعاء الدخول ودعاء الخروج"],
  },
  {
    id: "siwak",
    title: "سنن السواك",
    sunnahIds: ["41", "47", "48", "45"],
    notificationSchedule: {
      reminderSlots: ["fajr", "morning", "dhuhr", "asr", "maghrib", "ishaa"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بسنن السواك: عند الاستيقاظ، وعند الوضوء، وعند الصلاة، وعند دخول البيت",
    ],
  },
  {
    id: "sleep_prep",
    groupId: "sleep",
    partTitle: "الوضوء وآداب المضجع",
    title: "سنن النوم (١): الوضوء وآداب المضجع",
    sunnahIds: ["18", "10", "11", "24"],
    notificationSchedule: {
      reminderSlots: ["ishaa", "before_sleep"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بسنن النوم (١): الوضوء، ونفض الفراش، والاضطجاع على الشق الأيمن",
    ],
  },
  {
    id: "sleep_dhikr",
    groupId: "sleep",
    partTitle: "التسبيح وأذكار الفراش",
    title: "سنن النوم (٢): التسبيح وأذكار الفراش",
    sunnahIds: ["13", "23", "25", "26"],
    notificationSchedule: {
      reminderSlots: ["ishaa", "before_sleep"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بسنن النوم (٢): التسبيح وأذكار الإيواء إلى الفراش",
    ],
  },
  {
    id: "sleep_recitation",
    groupId: "sleep",
    partTitle: "الآيات والسور القصيرة",
    title: "سنن النوم (٣): الآيات والسور القصيرة",
    sunnahIds: ["19", "12", "20", "22"],
    notificationSchedule: {
      reminderSlots: ["ishaa", "before_sleep"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بسنن النوم (٣): النفث بالمعوذات، وآية الكرسي، وآخر البقرة، وسورة الكافرون",
    ],
  },
  {
    id: "sajda_mulk",
    groupId: "sleep",
    partTitle: "سورتا السجدة والملك",
    title: "سنن النوم (٤): سورتا السجدة والملك",
    sunnahIds: ["21"],
    notificationSchedule: {
      reminderSlots: ["ishaa", "before_sleep"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بسنن النوم (٤): قراءة سورتي السجدة والملك قبل النوم",
    ],
  },
  {
    id: "qiyam_al_layl",
    title: "قيام الليل وصلاة الوتر",
    sunnahIds: ["35", "36", "37", "38"],
    notificationSchedule: {
      reminderSlots: ["ishaa", "before_sleep"],
      endOfDayCheckIn: true,
    },
    notificationMessages: [
      "تذكير بقيام الليل والوتر: اجعل آخر صلاتك وترًا، واستحضر القنوت والتسبيح",
    ],
  },
];
