const assert = require("node:assert/strict");
const { test } = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { createLoader } = require("./load-ts.cjs");

// Render the real component content with host-only native stubs. This checks
// complete catalog coverage and attribution; it makes no native layout claims.
const host = ({ children }) => React.createElement("div", null, children);
const load = createLoader({
  "react-native": {
    Platform: { OS: "android" },
    View: host,
    Text: host,
    ScrollView: host,
    Pressable: host,
    useWindowDimensions: () => ({ width: 360, height: 800 }),
  },
  "react-native-safe-area-context": {
    useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
  },
  "@expo/vector-icons": { Ionicons: () => null },
  "@/components/ui/Card": { Card: host },
  "@/components/ui/BaseModal": {
    BaseModal: ({ visible, children }) =>
      visible ? React.createElement(host, null, children) : null,
  },
});
const { ROUTINES } = load("@/constants/routines");
const { SUNNAHS } = load("@/constants/sunnahs");
const { RoutineActionsPanel } = load(
  "@/screens/ActiveSunnah/components/RoutineActionsPanel",
);
const { RoutineSourcesModal } = load(
  "@/screens/ActiveSunnah/components/RoutineSourcesModal",
);
const { RoutineRewardsPanel } = load(
  "@/screens/ActiveSunnah/components/RoutineRewardsPanel",
);
const render = (component, props) =>
  renderToStaticMarkup(React.createElement(component, props));
const text = (value) =>
  renderToStaticMarkup(React.createElement("span", null, value)).slice(6, -7);
const membersFor = (routine) =>
  routine.sunnahIds.map((id) => SUNNAHS.find((sunnah) => sunnah.id === id));

test("Arabic text accounts for native RTL alignment mirroring and preserves centered labels", () => {
  for (const os of ["android", "ios", "web"]) {
    const { ArabicText } = createLoader({
      "react-native": { Text: host, Platform: { OS: os } },
    })("@/components/ui/ArabicText");
    const result = ArabicText({
      children: "١. سنن اليوم",
      style: { fontSize: 20 },
    });
    const style = Object.assign({}, ...result.props.style);
    assert.equal(style.direction, "rtl");
    assert.equal(style.writingDirection, "rtl");
    // RN 0.81 mirrors left/right for RTL paragraph layouts; CSS does not.
    const physicalAlignment =
      os === "web"
        ? style.textAlign
        : { left: "right", right: "left" }[style.textAlign];
    assert.equal(physicalAlignment, "right", os);
    assert.equal(style.fontSize, 20);
    const centered = ArabicText({ align: "center", children: "سنن اليوم" });
    assert.equal(
      Object.assign({}, ...centered.props.style).textAlign,
      "center",
    );
  }
});

test("every routine exposes all full actions in order, without hadiths on the main panel", () => {
  for (const routine of ROUTINES) {
    const members = membersFor(routine);
    const result = render(RoutineActionsPanel, { members });
    let cursor = 0;
    for (const member of members) {
      const titleIndex = result.indexOf(text(member.title), cursor);
      assert.ok(titleIndex >= cursor, member.title);
      const actionIndex = result.indexOf(text(member.action), titleIndex);
      assert.ok(actionIndex > titleIndex, member.id);
      cursor = actionIndex + text(member.action).length;
      for (const hadith of member.hadiths)
        assert.ok(!result.includes(text(hadith.text)), member.id);
    }
  }
});

test("sources render every exact evidence text, citation and Arabic grading in original order", () => {
  const labels = { sahih: "صحيح", hasan: "حسن", daif: "ضعيف" };
  let evidenceCount = 0;
  for (const routine of ROUTINES) {
    const members = membersFor(routine);
    const props = {
      visible: true,
      members,
      title: routine.title,
      onClose() {},
    };
    const result = render(RoutineSourcesModal, props);
    let cursor =
      result.indexOf(text(routine.title)) + text(routine.title).length;
    for (const member of members) {
      const titleIndex = result.indexOf(text(member.title), cursor);
      assert.ok(titleIndex >= cursor, member.title);
      cursor = titleIndex + text(member.title).length;
      for (const hadith of member.hadiths) {
        for (const value of [
          hadith.text,
          hadith.source,
          `درجة الحديث: ${labels[hadith.grading]}`,
        ]) {
          const index = result.indexOf(text(value), cursor);
          assert.ok(index >= cursor, `${member.id}: ${value.slice(0, 50)}`);
          cursor = index + text(value).length;
        }
        evidenceCount++;
      }
    }
    assert.equal(render(RoutineSourcesModal, { ...props, visible: false }), "");
  }
  assert.equal(evidenceCount, 39);
});

test("reward preview skips empty rewards and preserves the first full reward's attribution", () => {
  const first = {
    ...SUNNAHS[0],
    id: "first",
    title: "عنوان الفضيلة الأولى",
    reward: "النص الكامل للفضيلة الأولى",
  };
  const second = {
    ...SUNNAHS[1],
    id: "second",
    title: "عنوان الفضيلة الثانية",
    reward: "النص الكامل للفضيلة الثانية",
  };
  const empty = { ...SUNNAHS[2], reward: "   " };
  const result = render(RoutineRewardsPanel, {
    members: [empty, first, second],
  });
  assert.ok(result.includes(text(first.title)));
  assert.ok(result.includes(text(first.reward)));
  assert.ok(!result.includes(text(second.reward)));
  assert.ok(result.includes("عرض بقية الفضائل"));
  assert.ok(
    !render(RoutineRewardsPanel, { members: [first] }).includes(
      "عرض بقية الفضائل",
    ),
  );
  assert.equal(render(RoutineRewardsPanel, { members: [empty] }), "");
});
