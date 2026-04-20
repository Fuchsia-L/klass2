# Minimal P2 — Adversarial Code Review

Reviewer: Lux. Scope: code-level only (Iris owns visual validation).
Reference: `docs/minimal-p2-spec.md`, `D:\_AI\design-drops\2026-04-19-theme-01\主题01-Minimal.html` (line 4020+).

---

## Verdict

**Needs fixes.** The skeleton is correct and the spec contract (5 fixed mood strings, `rating = efficiency`, no schema change, all routes implemented, no new deps, legacy untouched) is honored. But there are real bugs that will affect both behavior and visual validation:

- One **functional blocker** in the rating-save path that silently drops the user's value mapping under a common edit case.
- Several **design-fidelity gaps** Iris will spot immediately (sheet button border seam, missing Inter font fallback weights, mood-cell font swap not actually applied, mistargeted "next" detection, etc).
- A **wrong palette gets passed to MinPaletteCell**, breaking the swatch grid display under non-paper palettes.

Net: don't merge as-is. Two of the items below will produce visibly wrong UI on first open.

---

## Blockers

### B1. `MinSettings.tsx:230` — "Change theme" jumps to a hardcoded `'cyber'` palette, not the legacy package

```ts
<Pressable onPress={() => setThemeName('cyber')} ...>
```

Spec section 5 says "Change → 切回 legacy". This works coincidentally because `'cyber'` is a legacy palette id, but it's brittle (renames break it) and there is no concept of "previously selected legacy palette" preserved. Also, since `setThemeName` only takes a palette id, picking a fixed one means a user who had `hanami` last gets thrown to `cyber`. Sketch: read `themeName` history from settings or just pick the first palette of the legacy package via `legacyPackage.palettes[0].id` so it tracks renames. Better: persist last-non-minimal palette and restore it.

### B2. `MinPaletteCell.tsx:14` + `MinPaletteCell.tsx:21-33` — palette swatch grid uses each palette's own colors, not the active one

```ts
const colors = MINIMAL_COLORS_BY_ID[palette.id];   // colors of the cell being rendered
...
<View style={[styles.swatch, { backgroundColor: colors.bg, borderColor: colors.line }]}>
  ...
  <Text style={[styles.name, { color: colors.ink, ... }]}>{palette.label.replace('Minimal ', '')}</Text>
```

This is wrong twice:

1. The label color (`colors.ink`) and sub color (`colors.subtle`) come from the **cell's** palette. So the *Black* row's text is rendered in `#fff` even when the active page background is `#faf7f2` (Paper) — i.e. invisible white-on-cream text. Design (HTML 5063-5074) uses the active palette's `p.ink` / `p.subtle` for the labels and only the swatch uses the cell palette. Fix: use `p.ink` for `name`, `p.subtle` for `sub`, keep `colors.bg`/`colors.ink` only for the swatch rectangles.
2. `MINIMAL_COLORS_BY_ID[palette.id]` may be `undefined` if the palette id isn't keyed (it is for the 5 minimal ones, fine today, but no defensive fallback). At minimum add `colors ?? p` fallback.

### B3. `MinRatingSheet.tsx:26-35` + `MinimalRoot.tsx:135-155` — `existing` rating is invalidated on save, breaking edits of an already-rated event

After `handleSaveRating` succeeds, `MinimalRoot` does `setDismissedNudgeId(ratingTarget.id)` but doesn't close the sheet *before* the next ratings refresh from `useRatings`. That part is OK. The real bug is the effect deps in `MinRatingSheet`:

```ts
React.useEffect(() => {
  if (open) {
    setEfficiency(existing?.efficiency ?? 0);
    setMood(moodToIndex(existing?.mood));
    setReflection(existing?.reflection ?? '');
  }
}, [open, existing?.id, existing?.efficiency, existing?.mood, existing?.reflection]);
```

Every time `useRatings` refreshes (which happens on every save via `refresh()` inside `useRatings.save`), `existing` becomes a new object reference. The effect compares scalar fields (good) — but if the user is **mid-edit** of an already-rated event and the auto-refresh of ratings races a re-render, the effect resets local state back to `existing.*` while the user is typing reflection. Fix: only re-seed on `event?.id` change (mirror HTML 4694 which does `[open, event?.id]`). Keep efficiency/mood/reflection out of the deps.

### B4. `MinimalRoot.tsx:42-48` — "next" event detection picks a still-active past event when `events.find(end >= now)` returns the current ongoing one

```ts
function withState(events: MinimalEvent[], nowMs: number): MinimalEvent[] {
  const upcoming = events.find((event) => new Date(event.end_time).getTime() >= nowMs);
  return events.map((event) => {
    if (new Date(event.end_time).getTime() < nowMs) return { ...event, state: 'past' };
    if (upcoming?.id === event.id && upcoming.start_time === event.start_time) return { ...event, state: 'next' };
    return { ...event, state: 'upcoming' };
  });
}
```

The HTML data labels "next" as the *next-to-start* event (start_time > now), with currently-running events in their own visual state — but here, "next" = first event whose end is in the future, which means an event in progress at 14:30 (start 14:00 end 15:30) is `next`. That's debatable, but the **actual bug** is `MinHome.tsx:51` + `:136`:

```ts
const nextIndex = events.findIndex((event) => event.state === 'next');
...
{index === nextIndex ? <MinNowLine ... /> : null}
```

The NOW line is rendered **above** the event flagged as `next`. If `next` is an in-progress event, the NOW divider gets pushed up to just above that event (e.g. above the 14:00–15:30 row at 14:30), instead of between past and the actual next-to-start. Compare HTML 4314: `if (e.state === 'next') rows.push(<NowLine .../>)` — but in the HTML demo `next` *is* the next-to-start event by construction (id=3 starts at 11:00, "now" is 10:30). The translation to live data needs `next = first event with start_time >= now`. Sketch: change `withState`'s upcoming finder to `start_time > nowMs` (or `>=`) so currently-running events don't claim `next`. Ratings rendering also depends on this — rateable rows are `state === 'past'`, which currently *excludes* an event still running, correct.

---

## High-priority polish

### H1. `MinSheetBtn.tsx:25` — primary button overlaps cancel via `marginLeft: -1` regardless of position

The marginLeft trick assumes the primary button is always to the right of the cancel button. In `MinRatingSheet` the layout is `[Skip] [Save]` — fine. In `MinEventSheet` it's `[Cancel] [Save]` — fine. But the button has `borderColor: p.ink` border on all 4 sides, so the negative margin only collapses the seam if the cancel button's right border lines up with the primary's left border (it does, both are 1px ink). Visually OK; but on **react-native-web** the overlap will render with z-order ambiguity — primary may bleed under cancel border. Sketch: drop the negative margin and instead set `borderLeftWidth: 0` on the primary button. Matches HTML's `borderLeft: ... marginLeft: -1` intent more cleanly in RN.

### H2. `MinRatingSheet.tsx:114-117` — mood selected-state font swap doesn't actually swap to mono font

Spec section 4.2 #4 explicitly calls out: "选中时 ... font 切 mono". HTML 4789 does `fontFamily: sel ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit'`. The implementation only changes font size and color, no `fontFamily`. The kaomoji `(๑-_-๑)` rendered in the system proportional font looks visibly off-balance vs mono. Sketch: add `fontFamily: selected ? Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) : undefined` to the moodFace style.

Also: the design has a **fade transition** between 汉字 and 颜文字 (HTML uses CSS transitions on bg/color; spec section 4.2 #4 explicitly says "保留" with two-layer cross-fade and 160ms). The implementation does an instant switch via conditional rendering. Iris flagged this as a must-keep animation. Sketch: render both `<Text>` layers stacked and crossfade their opacity with two `Animated.Value`s.

### H3. `MinHome.tsx:122-123` and unrated-strip target picks chronologically first past event, not the latest

```ts
const first = events.find((event) => event.state === 'past' && !ratingsByEventId[event.id]);
```

`events` (= `todayEvents`) is sorted ASC, so `find` returns the **earliest** past unrated event — not the most recent. The nudge targets the latest (`pastUnratedToday[0]` after DESC sort). So the nudge says "Rate '站立会' (just ended 2 min ago)" while the unrated-strip jumps the user back to the morning's '晨跑'. HTML matches this same chronological-first logic (4290), so technically design-faithful — but worth flagging because Iris will probably want both entry points hitting the most-recent-first behavior. (Not a bug per spec; raise to her.)

### H4. `MinMatrix.tsx:77` — `contentOffset` on ScrollView is iOS-only and ignored on Android/web

Spec didn't ask for auto-scroll explicitly, but HTML lines 4482-4487 do it. On **react-native-web**, `contentOffset` does nothing — the matrix opens at top, and Iris will see an empty 6am gutter on the first load even though "now" is 14:00. Sketch: keep a `ref` to `ScrollView`, then in a `useEffect` call `ref.current?.scrollTo({ y: Math.max(0, nowTop - 100), animated: false })`. That works on web too.

### H5. `MinMatrix.tsx:41` — `todayIndex` is wrong for Sunday under weeks that start Monday

`getWeekStart` (calendar.ts:11-18) returns Monday as week start. But `todayIndex = floor((today - weekStart) / 86400000)` assumes 0..6 mapping — for **Sunday**, today is `weekStart + 6 days`, so `todayIndex = 6`, and `DAYS = ['一','二','三','四','五','六','日']` indexed 0..6 → `日` at index 6. OK. But: `Math.floor` over a span that includes a DST transition will return 5.96... which floors to 5 (skips a day). Tiny risk — China doesn't observe DST so safe in practice, but worth noting.

### H6. `MinTimelineRow.tsx:45` — `next` event dot is fully filled with `p.ink`, not the design's "filled circle" with border

HTML 4372-4373: `background: isNext ? p.ink : (isPast ? 'transparent' : p.bg), border: 1px solid ${isPast ? p.line : p.ink}`. Implementation matches. OK — withdrawing this; verified consistent.

### H7. `MinHome.tsx:84-98` — todo-collapsible reveals at most 4 items, no "View all" arrow when zero open todos

If `openTodos.length === 0`, the expanded panel shows only the "View all →" pressable with no rows above. HTML behavior is identical. Cosmetic, but jarring with the dashed-top-border styling alone — rows hint at content that isn't there. Consider rendering an "暂无待办" placeholder when `openTodos.length === 0`.

### H8. `MinEventSheet.tsx:48` — "New Event" sheet does not allow editing anything

The sheet is read-only metadata display. Pressing "Save" just calls `onClose` (line 61). No actual title/time/category input fields. The spec said spec-section-2 "MinEventSheet ← 事件 sheet（编辑器风格，slide up）" — ambiguous about whether new-event creation must work. But the tab-bar `+` button calls `setEventSheetId('new')`, so the user IS routed here expecting to create. Right now they can't. Either make the sheet fully editable, or change `+` button to no-op for non-todos tabs with a toast saying "Use the schedule import to add events" (since FAB removed). Recommend Iris decide — flag this as ambiguous spec.

---

## Low-priority

### L1. `MinimalRoot.tsx:92-129` — every render creates a new `now = new Date()` and threads `now.getTime()` into useMemo deps, defeating memoization

`todayEvents` and `matrixEvents` recompute on every render (any setState). On web with frequent rerenders this is mostly fine, but the per-render cost includes `expandRepeatingEvents` over the week. Fix: either memoize `now` to ~1-minute granularity or use a stable `dateKey = todayStart.toDateString()` as the dep.

### L2. `MinTodos.tsx:54` — done todos pass `onChange={() => undefined}`, blocking edit; but the design (HTML 5114-5118) sets `onEdit={() => {}}` and `editing={false}` — same behavior, OK

Pre-emptive — not a bug.

### L3. `MinSettings.tsx:271-272` — secure token TextInput is rendered above the SettingAction row that displays `••••••••••`, but those are decoupled — pasting a value doesn't update the row's masked display because `value` is local state that gets cleared after save

Cosmetic confusion. The user pastes, sees dots, presses "Paste", sees the dots disappear (state cleared on save). Slightly counter-intuitive; legacy may have done this differently. Worth aligning with whatever LegacySettings does.

### L4. `MinTabBar.tsx:30` — inactive tab text border is `'transparent'` with `borderBottomWidth: 1`, which works but reserves the gutter; design uses the same trick. OK.

Pre-emptive — not a bug.

### L5. `MinHome.tsx:48` — `now` declared but never read inside the component (only used for header date)

Actually used at line 62-63. OK, withdrawn.

### L6. `MinimalRoot.tsx:158` — `addTodo` is awaited then `loadTodos()` is called separately; the service could expose the new id directly to avoid the second IO round-trip

Minor.

### L7. `MinTimelineRow.tsx:80-83` — `e.stopPropagation()` is called on `Pressable`'s `GestureResponderEvent`, which works on react-native-web (DOM event) but is a no-op on native iOS/Android (no event bubbling). Functionally fine because RN's responder system doesn't bubble to outer Pressable anyway. Worth a code comment to avoid future confusion.

### L8. `MinMatrix.tsx:42` — `nowTop` is computed even when `now.getHours() < START_HOUR`, producing a negative-then-clamped value. If Iris opens the app at 5 AM, the now line snaps to top. Acceptable.

### L9. `usePulse.ts` — `Animated.loop` with `useNativeDriver: true` works on web (RN-web shims), but won't run if `Animated.timing` is interrupted by component unmount mid-cycle. The cleanup correctly calls `.stop()`. Fine.

### L10. `MinSettings.tsx:102` — `currentWeek` displays `1` even before the user has filled in a semester start (defaults to "-" if empty, but `Date.now() - new Date('') = NaN` → displays "-"). OK, defensive.

---

## What Codex did well

- Spec contract honored: no schema changes, mood maps round-trip via `MOOD_LABELS`, `rating = efficiency` set on save, `RouteName` extended to include `'todos'`, legacy package falls back todos→home as instructed, no new dependencies, legacy/features components untouched.
- File layout matches spec section 2 exactly (parts/ broken out as listed, including `usePulse.ts` as a hook).
- Animation discipline is correct where it matters: `useNativeDriver: true`, `useRef(new Animated.Value())`, sheet `Easing.bezier(0.22, 0.9, 0.3, 1)` matches design. Screen crossfade architecture (all 4 screens mounted, opacity-driven, `pointerEvents` toggled) is faithful to HTML.
- React Native translation rules from spec section 4.1 are mostly applied cleanly — no leftover `cursor: 'pointer'`, no `<div>`, no `transition` strings in style objects, `borderTop` shorthand split into `borderTopWidth` + `borderTopColor` throughout, `transform` arrays correct.
- `LayoutAnimation` configured with the Android experimental flag in `MinHome.tsx:9`.
- Settings preserves the LegacySettings functional surface (semester / WHUT / sync / export) inside the editorial layout, including the import modal lifecycle (`importGenerationRef` cancellation pattern carried over).
