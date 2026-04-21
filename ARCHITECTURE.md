# Architecture — cyberschedule-rn

React Native + Expo (SDK 55, expo-router) app for schedule + time-slot rating with cloud sync. TypeScript strict. Android primary, web dev via `npm run web`.

## 1. File Structure

### App shell (expo-router)
- `app/_layout.tsx` — Root layout. Wraps `<Tabs>` in `ThemeProvider` + `RatingServiceProvider` + `SafeAreaProvider`. Hides native tab bar for minimal theme. Registers Orbitron (legacy), Fraunces (starlight headings: Regular/Medium/SemiBold/Bold), and Inter (starlight body: Regular/Medium/SemiBold/Bold) via `useFonts()`.
- `app/index.tsx` — TODAY route. Resolves palette, delegates to `ThemePackage.renderRoot('home')`.
- `app/matrix.tsx` — Week route → `renderRoot('matrix')`.
- `app/rating.tsx` — Rating route → `renderRoot('rating')`.
- `app/settings.tsx` — Settings route → `renderRoot('settings')`.

### Theme registry
- `src/themes/index.ts` — Exports `resolvePalette(id)`, `getAllPalettes()`, `legacyPackage`, `minimalPackage`, `starlightPackage`, `themePackages`.
- `src/themes/index.test.ts` — Registry tests: starlight palette(s) discoverable via `getAllPalettes()` / `resolvePalette(id)` alongside legacy + minimal.
- `src/themes/types.ts` — `ThemePackage { id, name, palettes[], renderRoot(route) }`, `ThemePalette`, `RouteName`.
- `src/theme/ThemeContext.tsx` — `ThemeProvider`, `useTheme()`, `useThemeSettings()` (persists themeName to AsyncStorage).
- `src/theme/index.ts` — `getTheme()`, `isThemeName()`, `DEFAULT_THEME`.
- `src/theme/types.ts` — `ThemeConfig` (colors, fonts, radius).

### Minimal theme (`src/themes/minimal/`)
- `package.ts` — Exports `minimalPackage: ThemePackage`. `renderRoot(route)` returns `<MinimalRoot route={route} />`.
- `palettes/{black,ghost,graphite,ink,paper,slate}.ts` — Palette color constants.
- `components/MinimalRoot.tsx` — Container. Holds tab/sheet state; renders 4 tabs + modal sheets. Exports `withState(events, nowMs)` timeline classifier.
- `components/MinimalRoot.test.tsx` — withState + route render tests.
- `components/MinHome.tsx` — TODAY screen (timeline, nudge, todo/rating strips, 7-day trends footer).
- `components/MinHome.test.tsx` — Renders MinTrends section + bucketing smoke test.
- `components/MinMatrix.tsx` — Weekly grid screen.
- `components/MinTodos.tsx` — Todos list screen.
- `components/MinSettings.tsx` — Settings + palette picker screen.
- `components/MinEventSheet.tsx` — Event detail/edit modal.
- `components/MinRatingSheet.tsx` — Rate-event modal.
- `components/MinTodoSheet.tsx` — Todo create/edit modal.
- `components/minimalTypes.ts` — `MinimalEvent`, `MinimalPaletteColors`, `MinimalTab`, `MOOD_LABELS/FACES`, `categoryLabel`, `formatTime`, `formatDateDots`, `durationMinutes`, `moodToIndex`, `todoDueLabel`, `MINIMAL_COLORS_BY_ID`.
- `components/parts/MinTimelineRow.tsx` — Single timeline row. Exports `softenCategoryColor(hex, alpha?)`.
- `components/parts/MinTimelineRow.test.tsx` — Rail color + past-state opacity tests.
- `components/parts/MinTrends.tsx` — 7-day rating trends footer. Exports `MinTrends`, `buildSevenDayTrendBuckets`, `MinTrendDay`. Uses `react-native-svg` for mood line/points.
- `components/parts/MinTrends.test.tsx` — Bucketing + render tests (empty-day placeholder, mood polyline).
- `components/parts/MinNowLine.tsx` — Pulsing NOW marker line.
- `components/parts/MinPaletteCell.tsx` — Palette picker cell.
- `components/parts/MinSettingsBlock.tsx` — Settings section wrapper.
- `components/parts/MinSheetBtn.tsx` — Modal button.
- `components/parts/MinSheetRow.tsx` — Modal row (input/control).
- `components/parts/MinTabBar.tsx` — Bottom tab bar with `+` FAB.
- `components/parts/MinTodoRow.tsx` — Single todo row.
- `components/parts/usePulse.ts` — Opacity loop hook (1.0 ↔ 0.55, 2.4s).

### Starlight theme (`src/themes/starlight/`)
- `package.ts` — Exports `starlightPackage: ThemePackage` with id `'starlight'`. `renderRoot(route)` returns `<StarlightRoot route={route} />`.
- `components/StarlightRoot.tsx` — Container. Wires `useTheme`/`useThemeSettings`/`useEvents`/`useSemesterConfig`/`useRatings`/`useTodos` into palette-driven Starlight screens + modal sheets. Delegates Today/Week/Todos/Settings rendering to `StarHome`/`StarMatrix`/`StarTodos`/`StarSettings`; mounts `StarTodoSheet` for create/edit, `StarEventSheet` for event detail/create, and `StarRatingSheet` for event rating. Holds tab/event-sheet/rating-sheet/todo-sheet/week-offset/nudge-dismissal state. `TodoSheetState` union is `{mode:'create'} | {mode:'edit', todo} | null`. Internal `Screen` wrapper cross-fades screens with RN `Animated.timing`. Module-local helpers `withState(events, nowMs)`, `latestRatingsByEventId(ratings)`, `nudgeCopy`, `routeToTab`, `sameDay`. `handleSaveRating({efficiency, moodIndex, reflection})` awaits `ratingsApi.save(input, existingRating?.id)` with `mood=STARLIGHT_MOOD_LABELS[moodIndex-1]`, `rating=efficiency`, dismissing the sheet + nudge on success and surfacing an `Alert.alert` on failure.
- `components/StarlightRoot.test.tsx` — Route→tab mapping, tab-bar screen switching, and add-button sheet dispatch tests (all hooks mocked).
- `components/StarHome.tsx` — Today screen. Renders starlight title treatment, todo summary (expand/collapse via `LayoutAnimation`), rating nudge, unrated summary, and timeline via `StarlightTimelineRow`; inserts `StarlightNowLine` above the first `state==='next'` event. Exports `StarHome`, `StarEvent = ScheduleEvent & { state }`, `StarRatingsByEventId`. Module-local `formatTime`, `todoDueLabel`, `toTimelineEvent`.
- `components/StarHome.test.tsx` — Header/timeline/nudge/todo-summary rendering, press forwarding (event/rate/dismiss/unrated), and empty-state rendering under fake timers.
- `components/StarMatrix.tsx` — Week screen. Header kicker + `Constellation` title + prev/next/reset `StarlightSheetBtn` controls, day strip with today highlight, hour gutter, dashed hour lines, positioned event blocks, `StarlightMoon`-anchored NOW marker, and empty-state panel. Exports `StarMatrix`, `StarMatrixEvent`. Internal `MatrixBlockData`, `MatrixBlock`, `blockForEvent`, `rgbaFromHex`. Constants: `HOUR_HEIGHT=60`, `START_HOUR=6`, 19 hour rows (06:00–00:00).
- `components/StarMatrix.test.tsx` — Header/day-strip/now-marker rendering, prev/next/reset week callbacks, clipped-spanning event rendering + event press forwarding, and empty-week panel (reset button hidden at `weekOffset=0`).
- `components/StarTodos.tsx` — Todos screen. Exports `StarTodos`, `todoDueLabel(todo)` (`'DAILY'|'WEEKLY'|'LONG'`). Splits todos into Open/Done sections via internal `TodoSection` component, each rendering `StarlightTodoRow`s inside a `panel`-backed card; empty-state `Clear sky` panel when `todos.length===0`. ScrollView uses `testID="starlight-todos"`.
- `components/StarTodos.test.tsx` — Open/Done partitioning, toggle + open-todo forwarding, and empty-state rendering.
- `components/StarTodoSheet.tsx` — Todo create/edit bottom-sheet modal. Calls `addTodo`/`updateTodo`/`deleteTodo` directly. Two-tap delete confirmation (3s window, ref-tracked timer cleared on unmount/re-open); pill selectors for `TodoType` (`TYPE_KEYS`) + `Priority` (`PRIORITY_KEYS`) using `TODO_TYPE_LABELS`/`PRIORITY_LABELS`. Translucent sheet surface keyed off `p.dark`; title/type/priority/notes inputs reset on visibility change via `visible` + `todo?.id` deps. Internal state: `displayTodo`, `draftTitle`, `draftType`, `draftPriority`, `draftNotes`, `error`, `saving`, `confirmingDelete`.
- `components/StarTodoSheet.test.tsx` — Create vs edit mode, save calls `addTodo`/`updateTodo`, two-tap delete, and close.
- `components/StarEventSheet.tsx` — Event detail/create bottom-sheet modal. Pure prop-driven (`p`, `event`, `visible`, `onClose`, `onSave`) — no feature-hook imports. Glass panel over Starlight scrim (`p.sheetScrim`) with a top glint accent. Header shows category kicker (or `New · 新建` in create mode), tabular time range, and `WEEK N · WEEKDAY` badge computed from `isoWeek(draftStart)`. Rows: italic Fraunces title input, start/end text inputs (`YYYY-MM-DD HH:mm`), Location input, Category label row + category pill grid (`CATEGORY_KEYS` from `CATEGORIES`), multiline Note input. Validates title / time format / end>start into inline `error`; save builds `StarEventSheetPayload` and awaits `onSave`. Defaults for new events: `draftCategory='工作'`, start = top of next hour clamped to 06:00–23:00, end = start + 60min. Resets draft on `visible` + `event?.id` change.
- `components/StarEventSheet.test.tsx` — Closed/open render, title validation error, category selection, save payload shape + `onClose` after success, and scrim tap dismissal.
- `components/StarRatingSheet.tsx` — Event rating bottom-sheet modal. Pure prop-driven (`p`, `event`, `existing?`, `onClose`, `onSave`) — no feature-hook imports. Glass panel over Starlight scrim (`p.sheetScrim`) with top glint; header renders `Rate · <category>` kicker, `HH:mm - HH:mm` time range, italic Fraunces title, and optional location line. Three sections: 5-bar efficiency selector, 5-cell mood grid (selected cell shows ASCII face + label), and multiline reflection `TextInput`. Save is disabled until `efficiency > 0 && mood > 0`; when enabled, emits `StarRatingSavePayload = {efficiency:1-5, moodIndex:1-5, reflection:string}`. Draft resets on `visible` + `event?.id` + `existing?.id` change; existing ratings prefill via `moodToIndex(existing?.mood)`. Exports `StarRatingSheet`, `STARLIGHT_MOOD_LABELS = ['困','躁','平','好','极']`, `StarRatingSavePayload`.
- `components/StarRatingSheet.test.tsx` — Visibility gating, save-disabled-until-complete rule, payload shape, existing-rating prefill, and skip/scrim dismissal.
- `components/StarSettings.tsx` — Settings screen. Renders palette grid via `StarlightPaletteCell` (each calls `onSelectPalette(palette.id)`) and a read-only "Current palette" card showing `palette.label` + `palette.id`. Purely presentational; does not touch storage. ScrollView uses `testID="starlight-settings"`; the current-palette card exposes `starlight-settings-current-palette` + `starlight-settings-current-palette-id`.
- `components/StarSettings.test.tsx` — Palette cell rendering, selection forwarding, and current-palette display.
- `palettes/nebula.ts` — Exports `starlightNebulaPalette` (id `'starlight-nebula'`), `STARLIGHT_NEBULA_COLORS: StarlightPaletteColors`, and `buildStarlightNebulaThemeConfig(id)`. `ThemeConfig.fonts` is `{ heading: 'Fraunces-SemiBold', body: 'Inter-Regular' }`; `colors.ratingFill` maps to the firefly accent.
- `components/starlightTypes.ts` — `StarlightPaletteColors` (dark, bg, bgGrad, ink, dim, line, subtle, panel, panelSolid, accent, accent2, nowLine, nowGlow, moonFace, moonShadow, star, firefly, sheetScrim, galaxy), `StarlightPaletteId`, `StarlightPaletteMap`.
- `components/parts/starlightMotion.ts` — Reanimated hooks: `useTwinkle(variant, duration, delay)`, `useShootingStar(variant)`, `useFirefly(variant, duration, delay)`, `useMoonPulse(enabled)`, `useCloudDrift(duration?, delay?)`, `useNowShimmer()`. Variant unions `TwinkleVariant` / `ShootVariant` / `FlyVariant` drive irregular motion curves matching the HTML prototype.
- `components/parts/StarlightBackground.tsx` — Exports `StarlightBackground`, `Starfield`, and deterministic layout arrays `STARLIGHT_STARS` (72 seeded star points), `STARLIGHT_SHOOTING_STARS` (3 variants, only rendered when `p.dark`), `STARLIGHT_FIREFLIES` (5 drifting fireflies). Internal `Star` / `ShootingStar` / `Firefly` / `CloudWash` components consume `p: StarlightPaletteColors`.
- `components/parts/StarlightBackground.test.tsx` — Deterministic layout + dark-only shooting-star visibility tests.
- `components/parts/StarlightMoon.tsx` — `StarlightMoon({ p, size?, phase?, testID? })` moon face with phase shadow + `useMoonPulse(p.dark)` glow.
- `components/parts/StarlightNowLine.tsx` — `StarlightNowLine({ p, time, testID? })` — time column (moon + label) + shimmering NOW bar driven by `useNowShimmer`.
- `components/parts/StarlightTabBar.tsx` — `StarlightTabBar({ p, tab, setTab, onAdd, testID? })`; tabs `today|week|todos|settings`, labels `TODAY / WEEK / TODOS / SET`, trailing `+` add button. Exports `StarlightTab` union.
- `components/parts/StarlightSheetBtn.tsx` — `StarlightSheetBtn({ p, label, onPress, primary?, flex?, disabled?, testID? })` pill button.
- `components/parts/StarlightSheetRow.tsx` — `StarlightSheetRow({ p, label, value, testID? })` label/value row.
- `components/parts/StarlightPaletteCell.tsx` — `StarlightPaletteCell({ p, palette, selected, onPress, testID?, selectedTestID? })` settings palette picker cell with mini starfield preview derived from `palette.preview`; when `selected`, exposes a `Selected` marker under `selectedTestID`.
- `components/parts/StarlightTimelineRow.tsx` — `StarlightTimelineRow({ p, event, rating?, onOpen, onRate?, testID? })`. Props `event: StarlightTimelineEvent` with state `'past'|'now'|'next'|'upcoming'`; upcoming rows render `ROW_FIREFLIES` via `useFirefly`. Exports `StarlightTimelineEvent`, `StarlightTimelineRating`, `StarlightTimelineState`.
- `components/parts/StarlightTodoRow.tsx` — `StarlightTodoRow({ p, todo, onToggle, onOpen, testID? })`. Exports `StarlightTodoItem { id, title, dueLabel, note?, done }`.
- `components/parts/StarlightTabBar.test.tsx` — Active-tab tint + `+` add callback tests.
- `components/parts/StarlightParts.style.test.tsx` — Palette-token propagation tests for shared parts (ensures no hard-coded minimal/legacy colors).
- `components/parts/index.ts` — Barrel re-export of the parts above.

### Legacy theme (`src/themes/legacy/`)
- `package.ts` — `legacyPackage`. Lazy-requires per-route root (LegacyHome/Matrix/Rating/Settings).
- `components/Legacy{Home,Matrix,Rating,Settings}.tsx` — Route-level screens.
- `themes/{cyber,hanami,midnight,ocean,sakura}.ts` — Palette + ThemeConfig bundles.

### Feature: schedule (`src/features/schedule/`)
- `types.ts` — `ScheduleEvent`, `CategoryKey` (`学习`/`工作`/`生活`/`运动`/`娱乐`/`其他`), `CATEGORIES: Record<CategoryKey, {key,label,color}>`, `SemesterConfig`.
- `categoryColors.ts` — Theme-level category color overrides.
- `hooks/useEvents.ts` → `{ events, loading, refresh }`.
- `hooks/useSemesterConfig.ts` → `{ semester, loading, refresh }`.
- `services/events.service.ts` — `loadEvents`, `addEvent`, `updateEvent`, `deleteEvent`, `toggleComplete`, `subscribeToEvents`, `replaceImportedEvents`.
- `services/semester.service.ts` — Semester config load/save.
- `domain/calendar.ts` — `getWeekStart`, `getSemesterWeek`, `getISOWeekNumber`.
- `domain/repeat.ts` — `expandRepeatingEvents(events, rangeStart, rangeEnd)` (DO NOT MODIFY).
- `domain/conflicts.ts` — `detectConflicts(candidate, all)`.
- `domain/validation.ts` — `validateEventTimeWindow`, `validateTimeRange`, `validateTimeHour`.
- `storage/events.storage.ts` — `loadEventsFromStorage`, `saveEventsToStorage`, `clearEventsCache` (DO NOT MODIFY).
- `storage/semester.storage.ts` — Semester persistence.
- `components/EventCard.tsx`, `EventSheet.tsx`, `MatrixEventBlock.tsx`, `DateTimePicker.tsx` — shared event UI.
- `import/whut-import.ts`, `term-code.ts`, `contracts.ts`, `WhutImportModal.tsx`, `WhutImportWebViewContainer.tsx` — WHUT timetable import.

### Feature: rating (`src/features/rating/`) — sync layer is off-limits
- `types.ts` — `TimeSlotRating`, `RatingInput`. Schema bound to VPS API (DO NOT MODIFY).
- `RatingServiceProvider.tsx` — Boot-time wiring of local + syncing repo; listens to AppState foreground.
- `hooks/useRatings.ts` → `{ ratings, loading, error, refresh, save, remove }`.
- `services/ratings.service.ts` — `RatingsService`; `configureRatingsService()` swaps in SyncingRatingRepository.
- `storage/{ratings.storage,local-repository,repository}.ts` — Local persistence (DO NOT MODIFY).
- `sync/{api-client,syncing-repository,sync-scheduler,sync-state,wiring}.ts` — Cloud sync. Off-limits for UI work.
- `components/{DayView,EventPicker,RatingHistoryList,RatingInputSheet,StarRating,EfficiencySlider}.tsx` — Rating UI (UI-layer, OK to refactor).
- `copy/empty-state-quips.ts` — `EMPTY_STATE_QUIPS`, `pickRandomQuip()`.

### Feature: todo (`src/features/todo/`)
- `types.ts` — `TodoItem` (`type: daily|weekly|longterm`, `priority: high|medium|low`), `PRIORITY_ORDER`, `PRIORITY_LABELS`, `TODO_TYPE_LABELS`.
- `hooks/useTodos.ts` → `{ todos, loading, refresh }`.
- `services/todo.service.ts` — `loadTodos`, `addTodo`, `updateTodo`, `deleteTodo`, `toggleTodoComplete`, `subscribeToTodos`.
- `storage/todo.storage.ts` — `loadTodosFromStorage`, `saveTodosToStorage`.
- `domain/refresh.ts` — daily/weekly auto-reset.
- `domain/sort.ts` — priority + due ordering.
- `components/{TodoItemCard,TodoSection,TodoSheet}.tsx`.

### Feature: settings (`src/features/settings/`)
- `hooks/useSettingsForm.ts` — Settings form state.
- `services/settings.service.ts` — `loadSettings`, `saveSemesterSettings`.
- `services/rating-export.service.ts` — `exportLocalRatingsAsJson()`.

### Shared & platform
- `shared/components/AppBar.tsx`, `FAB.tsx`, `fabPosition.ts`.
- `shared/lib/date.ts`, `id.ts`.
- `platform/storage/async-storage.ts` — AsyncStorage wrapper.

## 2. API / Interface Contracts

### Theme dispatch
- `ThemePackage.renderRoot(route: RouteName) → ReactNode` — Called by each `app/*.tsx`. `RouteName ∈ 'home'|'matrix'|'rating'|'settings'`.
- `resolvePalette(id: string) → { pkg, palette } | null` — Used by app routes to pick package + palette. Searches `themePackages` in order: legacy → minimal → starlight.
- `getAllPalettes() → ThemePalette[]` — Flattens every package's palettes (used by settings palette picker and registry tests).
- `getThemeConfigById(id: string) → ThemeConfig | null` — Convenience resolver to a palette's `ThemeConfig`.
- `useTheme() → ThemeConfig` / `useThemeSettings() → { themeName, setThemeName }` — Context hooks.
- `starlightPackage.renderRoot(route)` — Returns `<StarlightRoot route={route} />`. Shared primitives under `src/themes/starlight/components/parts/` remain palette-driven only (no feature-hook imports); feature wiring lives in `StarlightRoot`.

### StarlightRoot (`src/themes/starlight/components/StarlightRoot.tsx`)
- `StarlightRoot({ route }: { route: RouteName }) → ReactNode`. Caller: `starlightPackage.renderRoot`. Maps `route` → internal `StarlightTab` via `routeToTab` (`home→today`, `matrix→week`, `todos→todos`, `settings→settings`, `rating→today`). A `useEffect` on `route` keeps the internal tab in sync when navigation pushes a new route prop.
- Palette resolution: `p = STARLIGHT_COLORS_BY_ID[theme.id] ?? STARLIGHT_COLORS_BY_ID[themeName] ?? STARLIGHT_NEBULA_COLORS`. `STARLIGHT_COLORS_BY_ID` currently keys only `starlight-nebula`.
- `withState(events: ScheduleEvent[], nowMs: number) → StarlightEvent[]` (module-local). `end_time < nowMs → past`; `start_time ≤ nowMs < end_time → now`; first event with `start_time > nowMs → next`; rest → `upcoming`. `StarlightEvent = ScheduleEvent & { state: StarlightTimelineState }`.
- `latestRatingsByEventId(ratings: TimeSlotRating[]) → Record<string, TimeSlotRating>` (module-local). Picks latest `updated_at` per `linked_event_id`; ratings with no `linked_event_id` are skipped.
- Today/Week/Todos/Settings rendering is delegated to `StarHome`/`StarMatrix`/`StarTodos`/`StarSettings` (see below). `StarTodoSheet`, `StarEventSheet`, and `StarRatingSheet` are real create/edit/rating sheets. All screens accept palette colors + plain data props — feature-hook calls live only in `StarlightRoot` and `StarTodoSheet` (todo service).
- Add-button dispatch (`StarlightTabBar.onAdd`): sets `todoSheetState={mode:'create'}` when `tab==='todos'`, otherwise opens `StarEventSheet` in create mode (`eventSheetId='new'`).
- Event sheet wiring: `StarEventSheet.visible = eventSheetId !== null`; `event = selectedEvent` (resolved from `eventSheetId`). `onClose` and (currently) `onSave` both clear `eventSheetId`; `onSave` is the integration point for future event-service writes but does not call any service yet.
- Rating sheet wiring: `StarRatingSheet.event = ratingTarget` (visibility derived from non-null event); `existing = ratingsByEventId[ratingTargetId]`. `onSave` dispatches `handleSaveRating`, which calls `ratingsApi.save({slot_start, slot_end, linked_event_id, efficiency, rating: efficiency, mood, reflection}, existingRating?.id)`; on success clears `ratingTargetId` and sets `dismissedNudgeId=ratingTarget.id` so the nudge hides. Failures surface via `Alert.alert('保存评分失败', …)`.
- Settings palette selection: `StarSettings.onSelectPalette` is wired to `useThemeSettings().setThemeName` — no direct storage writes.
- Todo row interactions: `StarTodos.onToggle(id)` calls `toggleTodoComplete(id)`; `StarTodos.onOpenTodo(todo)` sets `todoSheetState={mode:'edit', todo}`.

### StarHome (`src/themes/starlight/components/StarHome.tsx`)
- `StarHome(props) → ReactNode`. Props: `p`, `events: StarEvent[]`, `todos`, `ratingsByEventId: StarRatingsByEventId`, `categoryByEventId: Record<string,CategoryKey>`, `semesterWeek`, `nudgeEvent: StarEvent | null`, `nudgeText`, `unratedCount`, `openTodos`, `doneTodos`, `onOpenEvent(id)`, `onRate(id)`, `onDismissNudge()`, `onToggleTodo(id)`, `onGoTodos()`. Caller: `StarlightRoot`.
- `StarEvent = ScheduleEvent & { state: StarlightTimelineState }`. `StarRatingsByEventId = Record<string, TimeSlotRating>`.
- Timeline rows are built per event via module-local `toTimelineEvent(event, categoryByEventId)` (resolves label from `CATEGORIES[category]`, falls back to `其他`). `StarlightNowLine` is inserted above the first event with `state==='next'` using `time=formatTime(new Date().toISOString())`. Rating strip for a row is `{ efficiency, moodLabel: rating.mood }`.
- Todo summary Pressable toggles `todoExpanded` with `LayoutAnimation.configureNext(easeInEaseOut)`; expanded preview shows up to four open todos and a "View all" link that fires `onGoTodos()`. Unrated summary press calls `onRate(firstPastUnrated.id)`. Nudge rate/dismiss buttons fire `onRate(nudgeEvent.id)` / `onDismissNudge()`.
- Empty states: `events.length===0` renders a `Quiet sky` panel; empty open-todos preview renders `No open todos tonight`.

### StarMatrix (`src/themes/starlight/components/StarMatrix.tsx`)
- `StarMatrix(props) → ReactNode`. Props: `p`, `events: StarMatrixEvent[]`, `weekStart: Date`, `semesterWeek`, `weekOffset`, `onPrevWeek()`, `onNextWeek()`, `onResetWeek()`, `onOpenEvent(id)`. Caller: `StarlightRoot`.
- `StarMatrixEvent = ScheduleEvent & { state: StarlightTimelineState }`.
- Layout constants: `START_HOUR=6`, `HOURS=6..24` (19 rows), `HOUR_HEIGHT=60`, day gutter width `36`. `blockForEvent(event, weekStart)` clips to `[weekStart, weekStart+7d)`, drops out-of-range days, enforces a 30-min minimum height, and caps the end at `START_HOUR + HOURS.length`. `rgbaFromHex(hex, alpha)` renders `rgba(...)`; invalid hex falls back to `rgba(255,255,255,alpha)`.
- Visual states: `state==='now'|'next'` → accent-filled block with italic Fraunces title + glow shadow; `state==='past'` → dim text, line-through, opacity 0.78; else category-tinted fill via `rgbaFromHex(CATEGORIES[category].color, p.dark ? 0.2 : 0.14)` with left-edge category accent. NOW marker renders only when `todayIndex ∈ [0,6]` (today is in the visible week).
- Reset button (`starlight-matrix-reset-week`) is only rendered when `weekOffset !== 0`. Empty week (`blocks.length===0`) renders a `No constellations` panel inside the grid scroll view without overlapping the header.
- Platform note: on web, the day strip and grid scroll view apply `overflowY:'auto' / scrollbarGutter:'stable'` to prevent header shift when the scrollbar appears.
- Cross-fade: internal `Screen` uses `Animated.timing` (180ms, native driver) on opacity; inactive screens receive `pointerEvents='none'`. Each screen root sets `testID="starlight-screen-<tab>"` and `accessibilityState.selected` for test assertions.

### StarTodos (`src/themes/starlight/components/StarTodos.tsx`)
- `StarTodos(props) → ReactNode`. Props: `p`, `todos: TodoItem[]`, `onToggle(id)`, `onOpenTodo(todo)`. Caller: `StarlightRoot`.
- Partitions `todos` into open / done; renders each in a `StarlightTodoRow` wrapped by an internal `TodoSection` panel. Empty-state `Clear sky` panel renders when `todos.length===0`.
- `todoDueLabel(todo: Pick<TodoItem,'type'>) → 'DAILY'|'WEEKLY'|'LONG'`. Re-exported and consumed by `StarTodoSheet`.

### StarTodoSheet (`src/themes/starlight/components/StarTodoSheet.tsx`)
- `StarTodoSheet(props) → ReactNode`. Props: `p`, `todo: TodoItem | null`, `isNew: boolean`, `onClose()`. Caller: `StarlightRoot`.
- Visible iff `isNew || todo !== null`. Resets draft on visibility change (`visible` + `todo?.id` deps). Save flow: if existing → `updateTodo(id, input)`; else → `addTodo(input)`. Delete requires two taps within `CONFIRM_TIMEOUT_MS=3000` (ref-tracked timer cleared on unmount). `input = { title, type, priority, notes? }` — notes trimmed; empty title sets inline `error` state.
- `TYPE_KEYS: TodoType[] = ['daily','weekly','longterm']`, `PRIORITY_KEYS: Priority[] = ['high','medium','low']`; labels come from `TODO_TYPE_LABELS` / `PRIORITY_LABELS` in `src/features/todo/types`.

### StarEventSheet (`src/themes/starlight/components/StarEventSheet.tsx`)
- `StarEventSheet(props) → ReactNode`. Props: `p: StarlightPaletteColors`, `event: ScheduleEvent | null`, `visible: boolean`, `onClose()`, `onSave(payload: StarEventSheetPayload) => void | Promise<void>`. Caller: `StarlightRoot`. No feature-layer imports.
- `StarEventSheetPayload = Omit<ScheduleEvent, 'id'> & { id?: string }` — exported. Populated from trimmed title, selected `CategoryKey`, ISO-string start/end from `parseEditableDateTime`, optional trimmed `location` / `notes`, and the current `repeat`/`repeat_until`/`reminder_minutes`/`source`/`is_completed` from the source event (defaults `repeat='none'`, `source='manual'`, `is_completed=false` for new events).
- `isNew` derived as `visible && event === null`. Draft resets on `visible` or `event?.id` change. Validation order: non-empty title → both `YYYY-MM-DD HH:mm` parse → end > start; failures set inline `error`. Save awaits `onSave`, then calls `onClose()`; rejection populates `error`. While awaiting, `saving=true` disables the primary button and relabels it `Saving`.

### StarRatingSheet (`src/themes/starlight/components/StarRatingSheet.tsx`)
- `StarRatingSheet(props) → ReactNode`. Props: `p: StarlightPaletteColors`, `event: ScheduleEvent | null`, `existing?: TimeSlotRating`, `onClose()`, `onSave(payload: StarRatingSavePayload)`. Caller: `StarlightRoot`. No feature-layer imports.
- `StarRatingSavePayload = { efficiency: 1|2|3|4|5; moodIndex: 1|2|3|4|5; reflection: string }` — exported.
- `STARLIGHT_MOOD_LABELS = ['困','躁','平','好','极']` — exported and reused by `StarlightRoot` to translate `moodIndex` back to the schema string for `ratingsApi.save`.
- Visibility: `visible = event !== null` (the sheet is a controlled component — parent clears `ratingTargetId` to close). Draft resets on `visible` + `event?.id` + `existing?.id` change; `efficiency`, `mood` (1-5 index), and `reflection` prefill from `existing?.efficiency`, `moodToIndex(existing?.mood)`, and `existing?.reflection`.
- `canSave = efficiency > 0 && mood > 0`; the Save button is disabled until both are selected and does not call `onSave` while disabled. The Skip button just calls `onClose`. Scrim tap (`starlight-rating-sheet-scrim`) also calls `onClose`.

- `StarSettings(props) → ReactNode`. Props: `p`, `paletteId: string`, `palettes: ThemePalette[]`, `onSelectPalette(id)`. Caller: `StarlightRoot`.
- Presentational: maps `palettes` → `StarlightPaletteCell` and forwards taps to `onSelectPalette`. Reads `palettes.find(id===paletteId)` to display the "Current palette" card; does not import theme context or storage.

### MinimalRoot (`src/themes/minimal/components/MinimalRoot.tsx`)
- `MinimalRoot({ route }: { route: RouteName }) → ReactNode`. Caller: `minimalPackage.renderRoot`.
- `withState(events: MinimalEvent[], nowMs: number) → MinimalEvent[]`. Invariant: `state='past'` iff `end_time <= nowMs`; `state='now'` iff `start_time <= nowMs < end_time`; first `start_time > nowMs` is `'next'`; the rest `'upcoming'`. Callers: MinimalRoot internals; `MinimalRoot.test.tsx`.

### MinTimelineRow (`src/themes/minimal/components/parts/MinTimelineRow.tsx`)
- `MinTimelineRow(props) → ReactNode`. Props: `event: MinimalEvent`, `p: MinimalPaletteColors`, `rating?: TimeSlotRating`, `onOpen: () => void`, `onRate: () => void`. Caller: `MinHome`.
- `softenCategoryColor(hex: string | undefined, alpha?: number) → string`. Converts `#RRGGBB` to `rgba(r,g,b,alpha)`; falls back to `CATEGORIES['其他'].color` for invalid input. Default alpha `0.55`. Callers: MinTimelineRow, `MinTimelineRow.test.tsx`.

### MinTrends (`src/themes/minimal/components/parts/MinTrends.tsx`)
- `MinTrends(props) → ReactNode`. Props: `p: MinimalPaletteColors`, `ratings: TimeSlotRating[]`, `now?: Date`. Caller: `MinHome` (rendered at bottom of Today ScrollView).
- `buildSevenDayTrendBuckets(ratings: TimeSlotRating[], now?: Date) → MinTrendDay[]`. Produces exactly 7 `MinTrendDay` entries (oldest → today) keyed by local-day boundaries via `created_at`; `efficiencyAverage` / `moodAverage` are `null` on empty days. Mood averages use `moodToIndex(rating.mood)` and skip `0` (unset). Callers: `MinTrends`, `MinTrends.test.tsx`.
- `MinTrendDay { key: string; label: string; date: Date; count: number; efficiencyAverage: number|null; moodAverage: number|null }`.

### Other minimal parts (prop shapes)
- `MinHome { p, events, todos, ratings, ratingsByEventId, semesterWeek, nudgeEvent?, nudgeText?, unratedCount, on* callbacks }`. `ratings` feeds `MinTrends`.
- `MinMatrix { p, events, weekStart, semesterWeek, weekOffset, onPrevWeek, onNextWeek, onOpenEvent, … }`.
- `MinTodos { p, todos, onOpen, onToggle, onAdd }`.
- `MinSettings { p, paletteId, palettes }`.
- `MinEventSheet { p, event, isNew, onClose }`.
- `MinRatingSheet { p, event, existing?, onClose, onSave }`.
- `MinTodoSheet { p, todo, isNew, onClose }`.
- `MinTabBar { p, tab: MinimalTab, setTab, onAdd }`.
- `MinNowLine { p, time }`.
- `MinSheetBtn { p, label, onPress, primary?, flex?, disabled?, testID? }`.
- `usePulse() → Animated.Value`.

### Starlight parts (`src/themes/starlight/components/parts/`)
- `useTwinkle(variant, duration, delay) → AnimatedStyle` — opacity + scale loop per variant (`twinkleA`: smooth two-beat, `twinkleB`: long-linear + flash, `twinkleC`: three-stage pulse).
- `useShootingStar(variant) → AnimatedStyle` — diagonal translate+rotate with opacity envelope scheduled over a 22s cycle; offsets per `shootA|B|C`.
- `useFirefly(variant, duration, delay) → AnimatedStyle` — irregular x/y/opacity interpolation along seeded path.
- `useMoonPulse(enabled) → AnimatedStyle` — 3.2s opacity + scale pulse; inert when `enabled=false` (non-dark palette).
- `useCloudDrift(duration?, delay?) → AnimatedStyle` — x translate `-90 → 520` over `duration` (default 50s).
- `useNowShimmer() → AnimatedStyle` — 3s opacity 0.6 ↔ 1 loop for the NOW bar.
- `StarlightBackground { p, testID?, children? }` — Full-bleed starfield host. Mounts `Starfield`, a drifting cloud wash, and the firefly cluster; children render above the scene at `zIndex: 2`.
- `Starfield { p }` — Galaxy wash + 72 deterministic stars + dark-only shooting stars. Safe to mount standalone in cells/previews.
- `StarlightMoon { p, size?, phase?, testID? }` — Self-contained moon disc (default size 14, phase 0.75).
- `StarlightNowLine { p, time, testID? }` — Row renderer for current-time indicator.
- `StarlightTabBar { p, tab, setTab, onAdd, testID? }` — Controlled tab bar with fixed label set.
- `StarlightSheetBtn { p, label, onPress, primary?, flex?, disabled?, testID? }` / `StarlightSheetRow { p, label, value, testID? }` — Sheet primitives.
- `StarlightPaletteCell { p, palette, selected, onPress, testID? }` — Settings picker cell; reads `palette.preview` for mini-starfield swatch.
- `StarlightTimelineRow { p, event, rating?, onOpen, onRate?, testID? }` — Timeline row; fireflies decorate `state='upcoming'`, past rows get strike-through + muted text; unrated past rows expose an `onRate` pill.
- `StarlightTodoRow { p, todo, onToggle, onOpen, testID? }` — Todo row with accent checkbox + due label.

### Schedule feature
- `ScheduleEvent { id, title, category: CategoryKey, start_time, end_time, repeat: 'none'|'daily'|'weekly', location?, reminder_minutes?: 5|15|30, notes?, source?, is_completed }` — bound to storage; DO NOT MODIFY.
- `useEvents() → { events, loading, refresh }`. Called by MinimalRoot, LegacyHome/Matrix.
- `events.service` exports listed in §1 — used by sheets and root containers.
- `expandRepeatingEvents(events, start, end) → ScheduleEvent[]` — repeat materialization. Callers: MinimalRoot.

### Rating feature
- `TimeSlotRating { id, slot_start, slot_end, linked_event_id?, rating: 1-5, efficiency: 1-5, mood?, activity?, reflection?, created_at, updated_at, synced_at?, deleted_at?, schema_version: 1 }` — cloud-sync schema; DO NOT MODIFY.
- `useRatings() → { ratings, loading, error, refresh, save(input, id?), remove(id) }`. Callers: MinimalRoot, LegacyRating.
- `configureRatingsService(repo)` — RatingServiceProvider only.

### Todo feature
- `TodoItem { id, title, type, priority, is_completed, last_reset, created_at, notes? }`.
- `useTodos() → { todos, loading, refresh }`.

## 3. Data Flow

### Events → Today timeline
AsyncStorage → `loadEventsFromStorage` → `useEvents` (subscribes) → MinimalRoot → `expandRepeatingEvents(range)` → `withState(events, Date.now())` → MinHome → `MinTimelineRow` (rail color via `softenCategoryColor(CATEGORIES[event.category].color)`, row opacity via `event.state==='past'`).

### Ratings (local ↔ cloud)
`useRatings` → `RatingsService` (default local) → `RatingServiceProvider` rewires to `SyncingRatingRepository` at boot → local write triggers `SyncScheduler` → `CloudRatingApiClient` posts to `api.epoch0.org/v1/ratings` → foreground AppState change triggers refetch. `subscribeToRatingChanges` pushes updates to MinHome strip.

### Ratings → Today trends footer
`useRatings().ratings` → MinimalRoot passes `ratings` prop to MinHome → `MinTrends` → `buildSevenDayTrendBuckets(ratings, now)` buckets by local-day boundaries on `created_at`, averaging `efficiency` (1–5) and `moodToIndex(mood)` (1–5, skipping unset). Empty days render a 1px placeholder bar; mood polyline draws only when ≥2 populated days exist.

### Theme palette propagation
`useThemeSettings` (AsyncStorage-backed) → `resolvePalette(themeName)` → `ThemePackage.renderRoot(route)` → MinimalRoot derives `p: MinimalPaletteColors` from `MINIMAL_COLORS_BY_ID[palette.id]` → passes `p` prop down (MinHome, MinTimelineRow, sheets, MinTabBar). StarlightRoot derives `p: StarlightPaletteColors` from `STARLIGHT_COLORS_BY_ID[theme.id]` (fallback `themeName`, fallback `STARLIGHT_NEBULA_COLORS`) and threads it through every Starlight primitive + sheet.

### Starlight → Today/Week screens
AsyncStorage → `useEvents` + `useTodos` + `useRatings` + `useSemesterConfig` → `StarlightRoot` → `expandRepeatingEvents(events, currentWeekStart..currentWeekEnd)` for Today (filtered by `sameDay(todayStart, tomorrowStart)`) and `expandRepeatingEvents(events, viewingWeekStart..viewingWeekEnd)` for Matrix → `withState(_, Date.now())`. Today events + `categoryByEventId` + `ratingsByEventId` flow to `StarHome`, which internally builds `StarlightTimelineEvent`s via `toTimelineEvent` and renders `StarlightTimelineRow`s (with `StarlightNowLine` before the first `next` row). Matrix events flow to `StarMatrix`, which positions blocks via `blockForEvent` and renders a NOW marker when today lies in the viewing week. Past-day unrated events drive the nudge (`dismissedNudgeId` gate). Todo toggles call `toggleTodoComplete(id)` directly. Palette changes in Settings call `useThemeSettings().setThemeName(palette.id)`.

### Starlight → Event sheet
`StarHome`/`StarMatrix` forward event presses via `onOpenEvent(id)` → `StarlightRoot` sets `eventSheetId`. `selectedEvent = expandedEvents.find(id===eventSheetId)` (or `null` for `'new'`). `StarEventSheet` renders as a controlled modal: `visible={eventSheetId!==null}`, `event=selectedEvent`. Drafts are local to the sheet; on submit the sheet builds a `StarEventSheetPayload` and calls `onSave`, which currently clears `eventSheetId` without writing to the events service (integration with `addEvent`/`updateEvent` is deferred).

### Starlight → Rating sheet
`StarHome`/`StarlightTimelineRow` rate presses and the rating nudge all call `onRate(eventId)` → `StarlightRoot.setRatingTargetId`. `ratingTarget = findEventById(ratingTargetId)`, `existingRating = ratingsByEventId[ratingTargetId]`. `StarRatingSheet` holds local draft state (efficiency, moodIndex, reflection) prefilled from `existing`. On save, the sheet emits `StarRatingSavePayload`; `StarlightRoot.handleSaveRating` maps it to a `RatingInput` (`slot_start`/`slot_end` from the event, `linked_event_id=event.id`, `rating=efficiency`, `mood=STARLIGHT_MOOD_LABELS[moodIndex-1]`) and awaits `ratingsApi.save(input, existingRating?.id)` — the same wrapper MinimalRoot uses. Success → `setRatingTargetId(null)` + `setDismissedNudgeId(event.id)`; failure → `Alert.alert`. `useRatings()` surfaces the update through the existing subscription.

### Starlight → Todos & Settings screens
`useTodos().todos` → `StarlightRoot` → `StarTodos` (partitioned into open/done). Row toggle → `toggleTodoComplete(id)`; row open → `todoSheetState={mode:'edit', todo}`. `StarlightTabBar` `+` on todos tab → `todoSheetState={mode:'create'}`. `StarTodoSheet` then calls `addTodo`/`updateTodo`/`deleteTodo` from `todo.service` directly; `useTodos` picks up updates via its storage subscription. Settings: `STARLIGHT_PALETTES` + `theme.id` flow into `StarSettings`; `onSelectPalette` → `useThemeSettings().setThemeName`, which persists through the existing theme context (no direct AsyncStorage access from the screen).

### Starlight motion scheduling
`starlightMotion` hooks use `useSharedValue` + `withRepeat(withSequence(...), -1)` scheduled inside a `setTimeout(delay)`; the timer is cleared on unmount to avoid orphan animations. Twinkle/firefly variants start from variant-specific baselines so the deterministic star/firefly arrays produce visually staggered motion without runtime randomness.

### Timeline state classification (MinimalRoot.withState)
`nowMs = Date.now()`; per event: `end ≤ now → past`; `start ≤ now < end → now`; first future-event → `next`; rest → `upcoming`. First-future pick uses `start_time >= nowMs` (Phase 4 fix).

## 4. Dependencies

### Runtime
- `expo ~55.0.6` — managed RN runtime.
- `expo-router ~55.0.5` — file-based routing (`app/**`).
- `react 19.2.0` / `react-native 0.83.2` — core.
- `@react-native-async-storage/async-storage 2.2.0` — local persistence.
- `react-native-gesture-handler ~2.30.0` — gestures.
- `react-native-reanimated 4.2.1` — preferred animation lib; drives all Starlight motion (`useSharedValue` + `useAnimatedStyle` + `withRepeat/Sequence/Timing`). Requires `react-native-worklets/plugin` in `babel.config.js` for Reanimated 4.
- `react-native-safe-area-context ~5.6.2` — safe area.
- `react-native-screens ~4.23.0` — native stack backing.
- `react-native-svg 15.15.3` — SVG primitives (for future trend charts).
- `lucide-react-native ^0.577.0` — icons (`Plus`, `X`, `ChevronLeft/Right`, `Star`…).
- `expo-font`, `expo-linking`, `expo-status-bar`, `expo-constants` — expo utilities. `app/_layout.tsx` loads Orbitron (Regular/Bold) for legacy, Fraunces (Regular/Medium/SemiBold/Bold) for starlight headings, and Inter (Regular/Medium/SemiBold/Bold) for starlight body via `useFonts()`. Font files live under `assets/fonts/`.

### Dev / test
- `jest ^29.7.0`, `jest-expo ^55.0.11`, `@testing-library/react-native ^13.3.3`, `react-test-renderer ^19.2.0`, `typescript ~5.9.2`.
- `jest.setup.ts` mocks `react-native-reanimated` with a lightweight shim (`Easing`, `interpolate`, `useAnimatedStyle`, `useSharedValue`, `withRepeat/Sequence/Timing`) so Starlight motion hooks render in tests without a worklet runtime.
- `babel.config.js` — `expo/node_modules/babel-preset-expo` preset + `react-native-worklets/plugin`. Required for Reanimated 4 worklets; do not revert to the legacy `react-native-reanimated/plugin`.

## 5. Changelog

- Phase 1: Matrix swipe-week scaffolding (P2 docs consolidation; no code changes here).
- Phase 2: Minimal timeline rails now use `softenCategoryColor(CATEGORIES[event.category].color)` (rgba alpha 0.55) in `MinTimelineRow.tsx`; past-row `opacity: 0.5` stacks on top of the colored rail. Added `MinTimelineRow.test.tsx` covering helper + past-state rail rendering.
- Phase 3: Added `MinTrends` (parts/MinTrends.tsx) + `buildSevenDayTrendBuckets`; rendered at bottom of Today ScrollView. MinHome gained a `ratings` prop sourced from `useRatings().ratings` in MinimalRoot. Mood line/points via `react-native-svg`; empty days show 1px placeholder, mood polyline drawn only with ≥2 populated days. Added `MinTrends.test.tsx` and `MinHome.test.tsx`.
- Starlight Phase 1: Registered `starlightPackage` (id `'starlight'`) in `src/themes/index.ts` alongside legacy + minimal. Added `src/themes/starlight/{package.ts, palettes/nebula.ts, components/starlightTypes.ts}` with the `starlight-nebula` palette and `StarlightPaletteColors` model. `renderRoot` is a placeholder Fragment. Registered Fraunces (Regular/Medium/SemiBold/Bold) and Inter (Regular/Medium/SemiBold/Bold) fonts in `app/_layout.tsx`; font assets added under `assets/fonts/`. Added `src/themes/index.test.ts` for palette discoverability.
- Starlight Phase 2: Added shared UI primitives under `src/themes/starlight/components/parts/` — `starlightMotion` hooks (`useTwinkle/useShootingStar/useFirefly/useMoonPulse/useCloudDrift/useNowShimmer`), `StarlightBackground` + `Starfield` with deterministic `STARLIGHT_STARS/STARLIGHT_SHOOTING_STARS/STARLIGHT_FIREFLIES` arrays, `StarlightMoon`, `StarlightNowLine`, `StarlightTabBar`, `StarlightSheetBtn`, `StarlightSheetRow`, `StarlightPaletteCell`, `StarlightTimelineRow`, `StarlightTodoRow`, and a parts barrel `index.ts`. All primitives consume `StarlightPaletteColors` only and do not import `src/features/**`. Added `babel.config.js` with `react-native-worklets/plugin` for Reanimated 4 and extended `jest.setup.ts` with a reanimated shim. Added `StarlightBackground.test.tsx`, `StarlightTabBar.test.tsx`, and `StarlightParts.style.test.tsx`.
- Starlight Phase 3: Added `StarlightRoot` (`src/themes/starlight/components/StarlightRoot.tsx`) — the feature-aware shell that wires `useTheme/useThemeSettings/useEvents/useSemesterConfig/useRatings/useTodos` + `expandRepeatingEvents`, `getWeekStart`, `getSemesterWeek`, and `toggleTodoComplete` into the Phase-2 primitives. Holds tab, event-sheet, rating-sheet, todo-sheet, week-offset, and nudge-dismissal state; cross-fades screens via an internal `Animated.timing` `Screen` wrapper. Placeholder `StarlightHome/Matrix/Todos/Settings` + `StarlightEventSheet/RatingSheet/TodoSheet` render today/week timelines, todos, and palette picker using the shared parts. `starlightPackage.renderRoot(route)` now returns `<StarlightRoot route={route} />`. Added `StarlightRoot.test.tsx` for route→tab mapping, tab-bar screen switching, and add-button sheet dispatch (all feature hooks mocked).
- Starlight Phase 4: Extracted Today and Week into dedicated modules. `StarHome.tsx` renders the prototype's kicker/title, expandable todo summary (`LayoutAnimation`), rating nudge, unrated summary, empty-state panel, and timeline via `StarlightTimelineRow` with a `StarlightNowLine` before the first `next` row; exports `StarEvent`/`StarRatingsByEventId`. `StarMatrix.tsx` renders the week header strip, `Constellation` title, prev/next/reset controls, day-cell highlight, hour gutter, dashed hour lines, positioned event blocks (category tint + `next/now` accent fill + past strike-through), and moon-anchored NOW marker only when today lies in the viewing week; empty selected-week panel replaces the grid contents. Internal `blockForEvent` clips week-spanning events and enforces a 30-min minimum block height. `StarlightRoot` now delegates `today`/`week` screens to these modules and passes `categoryByEventId` alongside `ratingsByEventId`. Added `StarHome.test.tsx` + `StarMatrix.test.tsx`.
- Starlight Phase 5: Replaced Phase-3 `StarlightTodos`/`StarlightSettings`/`StarlightTodoSheet` placeholders with real modules. `StarTodos.tsx` renders Open/Done sections of `StarlightTodoRow`s with a `Clear sky` empty panel; exports `todoDueLabel`. `StarTodoSheet.tsx` is a translucent bottom-sheet create/edit modal wired to `addTodo`/`updateTodo`/`deleteTodo` with a two-tap delete confirmation (`CONFIRM_TIMEOUT_MS=3000`) and `TYPE_KEYS`/`PRIORITY_KEYS` pill selectors. `StarSettings.tsx` renders the palette grid + read-only current-palette card; forwards selection to `useThemeSettings().setThemeName` via `StarlightRoot` without touching storage. `StarlightRoot` swaps in these screens, introduces `TodoSheetState` (`create`/`edit`/null), routes the `+` button on the todos tab to todo-create, and imports `toggleTodoComplete` for row toggles. `StarlightPaletteCell` gained a `selectedTestID` prop for the active-marker. Added `StarTodos.test.tsx`, `StarTodoSheet.test.tsx`, `StarSettings.test.tsx`.
- Starlight Phase 6: Replaced Phase-3 inline `StarlightEventSheet` placeholder with `StarEventSheet.tsx` — a prop-driven glass-panel modal (`event`, `visible`, `onClose`, `onSave`) with Starlight scrim, header kicker/time-range/`WEEK · WEEKDAY` badge, italic Fraunces title input, start/end text inputs, Location/Category/Note rows, category pill grid, and Close/Save buttons. Exports `StarEventSheetPayload = Omit<ScheduleEvent,'id'> & {id?}`. `StarlightRoot` now mounts `StarEventSheet` with `visible={eventSheetId!==null}`; the stale module-local `formatTime` helper and the internal `StarlightEventSheet` SheetFrame component were removed. No feature-layer writes are issued yet — `onSave` currently just clears `eventSheetId`. Added `StarEventSheet.test.tsx`.
- Starlight Phase 7: Replaced the Phase-3 `StarlightRatingSheet` + `SheetFrame` placeholder with `StarRatingSheet.tsx` — a prop-driven glass-panel modal (`event`, `existing?`, `onClose`, `onSave`) with Starlight scrim, kicker/time/title/location header, 5-bar efficiency selector, 5-cell mood grid (ASCII face on selection), reflection `TextInput`, and Skip/Save buttons (save disabled until efficiency & mood set). Exports `StarRatingSavePayload` + `STARLIGHT_MOOD_LABELS`. `StarlightRoot` now wires save via `handleSaveRating`, which calls `ratingsApi.save({slot_start, slot_end, linked_event_id, efficiency, rating: efficiency, mood, reflection}, existingRating?.id)` — identical payload shape to MinimalRoot — and dismisses the nudge on success (`Alert.alert` on failure). Removed the internal `SheetFrame` helper and its stale styles from `StarlightRoot.tsx`. `StarlightSheetBtn` now forwards `accessibilityState={{disabled}}` for a11y parity. Added `StarRatingSheet.test.tsx`. Acts as the final gate: full typecheck + test suite pass.
