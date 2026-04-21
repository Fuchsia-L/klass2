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

### Starlight theme (`src/themes/starlight/`) — scaffolding only (Phase 1)
- `package.ts` — Exports `starlightPackage: ThemePackage` with id `'starlight'`. `renderRoot` returns an empty Fragment pending Phase 2 screen work.
- `palettes/nebula.ts` — Exports `starlightNebulaPalette` (id `'starlight-nebula'`), `STARLIGHT_NEBULA_COLORS: StarlightPaletteColors`, and `buildStarlightNebulaThemeConfig(id)`. `ThemeConfig.fonts` is `{ heading: 'Fraunces-SemiBold', body: 'Inter-Regular' }`; `colors.ratingFill` maps to the firefly accent.
- `components/starlightTypes.ts` — `StarlightPaletteColors` (dark, bg, bgGrad, ink, dim, line, subtle, panel, panelSolid, accent, accent2, nowLine, nowGlow, moonFace, moonShadow, star, firefly, sheetScrim, galaxy), `StarlightPaletteId`, `StarlightPaletteMap`.

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
- `starlightPackage.renderRoot` — Returns an empty Fragment in Phase 1; screens land in a later phase.

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
`useThemeSettings` (AsyncStorage-backed) → `resolvePalette(themeName)` → `ThemePackage.renderRoot(route)` → MinimalRoot derives `p: MinimalPaletteColors` from `MINIMAL_COLORS_BY_ID[palette.id]` → passes `p` prop down (MinHome, MinTimelineRow, sheets, MinTabBar).

### Timeline state classification (MinimalRoot.withState)
`nowMs = Date.now()`; per event: `end ≤ now → past`; `start ≤ now < end → now`; first future-event → `next`; rest → `upcoming`. First-future pick uses `start_time >= nowMs` (Phase 4 fix).

## 4. Dependencies

### Runtime
- `expo ~55.0.6` — managed RN runtime.
- `expo-router ~55.0.5` — file-based routing (`app/**`).
- `react 19.2.0` / `react-native 0.83.2` — core.
- `@react-native-async-storage/async-storage 2.2.0` — local persistence.
- `react-native-gesture-handler ~2.30.0` — gestures.
- `react-native-reanimated` — preferred animation lib.
- `react-native-safe-area-context ~5.6.2` — safe area.
- `react-native-screens ~4.23.0` — native stack backing.
- `react-native-svg 15.15.3` — SVG primitives (for future trend charts).
- `lucide-react-native ^0.577.0` — icons (`Plus`, `X`, `ChevronLeft/Right`, `Star`…).
- `expo-font`, `expo-linking`, `expo-status-bar`, `expo-constants` — expo utilities. `app/_layout.tsx` loads Orbitron (Regular/Bold) for legacy, Fraunces (Regular/Medium/SemiBold/Bold) for starlight headings, and Inter (Regular/Medium/SemiBold/Bold) for starlight body via `useFonts()`. Font files live under `assets/fonts/`.

### Dev / test
- `jest ^29.7.0`, `jest-expo ^55.0.11`, `@testing-library/react-native ^13.3.3`, `react-test-renderer ^19.2.0`, `typescript ~5.9.2`.

## 5. Changelog

- Phase 1: Matrix swipe-week scaffolding (P2 docs consolidation; no code changes here).
- Phase 2: Minimal timeline rails now use `softenCategoryColor(CATEGORIES[event.category].color)` (rgba alpha 0.55) in `MinTimelineRow.tsx`; past-row `opacity: 0.5` stacks on top of the colored rail. Added `MinTimelineRow.test.tsx` covering helper + past-state rail rendering.
- Phase 3: Added `MinTrends` (parts/MinTrends.tsx) + `buildSevenDayTrendBuckets`; rendered at bottom of Today ScrollView. MinHome gained a `ratings` prop sourced from `useRatings().ratings` in MinimalRoot. Mood line/points via `react-native-svg`; empty days show 1px placeholder, mood polyline drawn only with ≥2 populated days. Added `MinTrends.test.tsx` and `MinHome.test.tsx`.
- Starlight Phase 1: Registered `starlightPackage` (id `'starlight'`) in `src/themes/index.ts` alongside legacy + minimal. Added `src/themes/starlight/{package.ts, palettes/nebula.ts, components/starlightTypes.ts}` with the `starlight-nebula` palette and `StarlightPaletteColors` model. `renderRoot` is a placeholder Fragment. Registered Fraunces (Regular/Medium/SemiBold/Bold) and Inter (Regular/Medium/SemiBold/Bold) fonts in `app/_layout.tsx`; font assets added under `assets/fonts/`. Added `src/themes/index.test.ts` for palette discoverability.
