const assert = require("node:assert/strict");
const { test } = require("node:test");
const React = require("react");
const { createLoader } = require("./load-ts.cjs");

// Drive the screen's event handlers and effect boundaries without pretending
// that host stubs verify native layout. Hooks retain state between renders.
function screenHarness() {
  const hooks = [];
  let cursor = 0;
  let effects = [];
  const equalDeps = (a, b) =>
    a &&
    b &&
    a.length === b.length &&
    a.every((value, i) => Object.is(value, b[i]));
  const mockedReact = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!hooks[index])
        hooks[index] = {
          value: typeof initial === "function" ? initial() : initial,
        };
      return [
        hooks[index].value,
        (value) => {
          hooks[index].value =
            typeof value === "function" ? value(hooks[index].value) : value;
        },
      ];
    },
    useRef(initial) {
      const index = cursor++;
      if (!hooks[index]) hooks[index] = { current: initial };
      return hooks[index];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!hooks[index] || !equalDeps(hooks[index].deps, deps))
        hooks[index] = { callback, deps };
      return hooks[index].callback;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!hooks[index] || !equalDeps(hooks[index].deps, deps)) {
        const previous = hooks[index];
        hooks[index] = { deps, cleanup: previous?.cleanup };
        effects.push(() => {
          hooks[index].cleanup?.();
          hooks[index].cleanup = effect();
        });
      }
    },
  };
  const types = {};
  const mockComponent = (name) =>
    (types[name] = function Host() {
      return null;
    });
  const mocks = {
    react: mockedReact,
    "react-native": {
      View: mockComponent("View"),
      ScrollView: mockComponent("ScrollView"),
      Pressable: mockComponent("Pressable"),
      ActivityIndicator: mockComponent("ActivityIndicator"),
      Platform: { OS: "android" },
      Vibration: { vibrate() {} },
    },
    "react-native-safe-area-context": {
      useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
    },
    "@expo/vector-icons": { Ionicons: mockComponent("Ionicons") },
    "expo-haptics": {},
    "@/components/onboarding/TourTarget": { useTourTarget: () => null },
  };
  for (const name of [
    "Card",
    "ArabicText",
    "Button",
    "BaseModal",
    "PaperBackground",
  ])
    mocks[`@/components/ui/${name}`] = { [name]: mockComponent(name) };
  for (const name of [
    "AlreadyDoingModal",
    "RoutineActionsPanel",
    "RoutineMenu",
    "RoutineRewardsPanel",
    "RoutineSourcesModal",
    "SkipModal",
    "StreakBrokenToast",
    "StreakCompleteModal",
    "StreakDots",
  ])
    mocks[`@/screens/ActiveSunnah/components/${name}`] = {
      [name]: mockComponent(name),
    };
  // Relative imports resolve to these absolute files in the loader.
  const path = require("node:path");
  // The loader resolves relative component files before consulting mocks.
  for (const name of Object.keys(types)) {
    const componentPath = path.resolve(
      __dirname,
      `../screens/ActiveSunnah/components/${name}`,
    );
    if (mocks[`@/screens/ActiveSunnah/components/${name}`])
      mocks[componentPath] = mocks[`@/screens/ActiveSunnah/components/${name}`];
  }
  const calls = { mark: 0, already: 0, postpone: 0, ready: [] };
  let snapshot = {
    currentRoutine: { id: "one", title: "المجموعة الأولى" },
    remainingMembers: [{ id: "1", title: "السنة الأولى" }],
    streakCount: 0,
    hasMarkedToday: false,
    streakBrokenToday: false,
    isLoading: false,
    markDoneToday: () => {
      calls.mark++;
      return null;
    },
    markAlreadyDoing: () => {
      calls.already++;
    },
    postponeRoutine: () => {
      calls.postpone++;
    },
  };
  const onboarding = {
    registerScroller() {},
    setHomeReady(value) {
      calls.ready.push(value);
    },
  };
  mocks["@/context/OnboardingContext"] = { useOnboarding: () => onboarding };
  mocks["@/context/SunnahContext"] = { useSunnah: () => snapshot };
  const Screen = createLoader(mocks)("@/screens/ActiveSunnah/index").default;
  let tree;
  const find = (name, predicate = () => true) => {
    let result;
    const visit = (element) => {
      if (!element || result) return;
      if (Array.isArray(element)) return element.forEach(visit);
      if (typeof element !== "object") return;
      if (element.type === types[name] && predicate(element.props)) {
        result = element;
        return;
      }
      visit(element.props?.children);
    };
    visit(tree);
    assert.ok(result, `Missing ${name}`);
    return result;
  };
  return {
    calls,
    find,
    update(value) {
      snapshot = { ...snapshot, ...value };
    },
    render(flush = true) {
      cursor = 0;
      tree = Screen();
      if (flush) this.flush();
      return tree;
    },
    flush() {
      const pending = effects;
      effects = [];
      pending.forEach((effect) => effect());
    },
  };
}

test("a rejected stale daily tap does not lock the refreshed screen; rapid repeated taps dispatch once", () => {
  const screen = screenHarness();
  screen.render();
  const stalePress = screen.find("Button").props.onPress;
  stalePress();
  stalePress();
  assert.equal(screen.calls.mark, 1);
  screen.update({
    markDoneToday: () => {
      screen.calls.mark++;
      return null;
    },
  });
  screen.render();
  // An event retaining the previous render's callback must not re-lock the
  // newly rendered screen after its effects have already released the lock.
  stalePress();
  assert.equal(screen.calls.mark, 1);
  screen.find("Button").props.onPress();
  assert.equal(screen.calls.mark, 2);
});

test("cancelled confirmations cannot dispatch queued callbacks, and rotation hides stale dialogs before effects", () => {
  const screen = screenHarness();
  screen.render();
  screen
    .find(
      "Pressable",
      (props) => props.accessibilityLabel === "أفعل هذه السنن بالفعل",
    )
    .props.onPress();
  screen.render();
  const confirm = screen.find("AlreadyDoingModal").props;
  confirm.onClose();
  confirm.onConfirm();
  assert.equal(screen.calls.already, 0);
  screen.render();
  screen
    .find(
      "Pressable",
      (props) => props.accessibilityLabel === "تأجيل هذه السنن",
    )
    .props.onPress();
  screen.render();
  screen.update({ currentRoutine: { id: "two", title: "المجموعة الثانية" } });
  screen.render(false);
  assert.equal(screen.find("BaseModal").props.visible, false);
  screen.flush();
});

test("sources preserve reward identity and progress, and defer automatic onboarding while open", () => {
  const screen = screenHarness();
  screen.render();
  const rewardKey = screen.find("RoutineRewardsPanel").key;
  screen
    .find("Pressable", (props) => props.accessibilityLabel === "عرض المصادر")
    .props.onPress();
  screen.render();
  assert.equal(screen.find("RoutineSourcesModal").props.visible, true);
  assert.equal(screen.calls.ready.at(-1), false);
  assert.equal(screen.find("RoutineRewardsPanel").key, rewardKey);
  screen.find("RoutineSourcesModal").props.onClose();
  screen.render();
  assert.equal(screen.find("RoutineRewardsPanel").key, rewardKey);
  assert.equal(screen.calls.ready.at(-1), true);
  assert.deepEqual(
    [screen.calls.mark, screen.calls.already, screen.calls.postpone],
    [0, 0, 0],
  );
  screen.update({ currentRoutine: { id: "two", title: "المجموعة الثانية" } });
  screen.render();
  assert.notEqual(screen.find("RoutineRewardsPanel").key, rewardKey);
});

test("the final celebration keeps the completed routine and credited members after rotation to all-complete", () => {
  const screen = screenHarness();
  screen.update({
    streakCount: 6,
    markDoneToday: () => ({ id: "one", title: "المجموعة الأولى" }),
  });
  screen.render();
  screen.find("Button").props.onPress();
  screen.update({ currentRoutine: null, remainingMembers: [], streakCount: 0 });
  screen.render();
  const celebration = screen.find("StreakCompleteModal").props;
  assert.equal(celebration.visible, true);
  assert.equal(celebration.routineTitle, "المجموعة الأولى");
  assert.deepEqual(celebration.memberTitles, ["السنة الأولى"]);
  assert.equal(screen.calls.ready.at(-1), false);
});
