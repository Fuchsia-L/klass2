# CyberSchedule RN — Architecture

Single source of truth for all agents (coders and reviewers). Keep this file in sync with the code: if a symbol exists, it must be listed here; if it is listed here, it must exist.

## Related Docs

- Android build & packaging: `BUILD_ANDROID.md`
- Time-slot rating feature spec: `docs/spec-time-slot-rating.md`
- Minimal P2 theme spec: `docs/minimal-p2-spec.md`
- Minimal P2 review report: `docs/minimal-p2-review.md`
- Minimal P2 fix-round requirement: `docs/minimal-p2-fixes-requirement.md`

## Tech Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Expo + React Native | SDK 55 / RN 0.83 |
| Language | TypeScript | 5.9 |
| Routing | Expo Router (file-based) | 55.0.5 |
| Storage | @react-native-async-storage/async-storage | 2.2.0 |
| Icons | lucide-react-native | 0.577.0 |
| Fonts | expo-font + Orbitron | 55.0.4 |
| Test | Jest + jest-expo + @testing-library/react-native | 29 / 55 / 13 |
| Platform | Android only | — |

---

## 1. File Structure

### Root / config
- `app.json` — Expo config (name, icons, splash, Android bundle).
- `package.json` — deps, scripts (`start`, `android`, `ios`, `web`, `test`).
- `tsconfig.json` — TypeScript compiler options.
- `jest.config.js` — Jest config (jest-expo preset).
- `jest.setup.ts` — Jest setup (AsyncStorage / WebView mocks).
- `metro.config.js` — Metro bundler config.
- `index.ts` — Expo Router entry.
- `ARCHITECTURE.md` — this document.
- `BUILD_ANDROID.md` — Android build/packaging guide.
- `docs/spec-time-slot-rating.md` — time-slot rating feature spec.
- `docs/minimal-p2-spec.md` — Minimal P2 theme spec.
- `docs/minimal-p2-review.md` — Minimal P2 opus audit (issue list + fix sketches).
- `docs/minimal-p2-fixes-requirement.md` — Minimal P2 fix-round requirement (B1–B4, H1/H2/H4/H8).
- `scripts/create-release.js` — release helper.
- `scripts/get-git-cred.js` — git credential helper.
- `scripts/upload-apk.js` — APK upload helper.

### `app/` — Expo Router screens
- `app/_layout.tsx` — root layout: font loading, `SafeAreaProvider`, `ThemeProvider`, `RatingServiceProvider`, bottom Tabs (`TODAY`, `MATRIX`, `RATING`, `SETTINGS`). When the active theme package supplies a `RootComponent` (minimal), it renders that root instead of the tabbed layout.
- `app/_layout.test.tsx` — layout tests: tab order/icons, plus RatingServiceProvider boot wiring.
- `app/index.tsx` — Home page: TODAY / TOMORROW event lists, TodoSection footer, FAB for new event.
- `app/index.test.tsx` — smoke test for Home.
- `app/matrix.tsx` — Matrix page: 7-column weekly grid 06:00–24:00, current-time line, week navigation, ISO/semester week label.
- `app/rating.tsx` — Rating page: loads local ratings, renders `RatingHistoryList`, opens `RatingInputSheet`, detail modal with destructive 删除.
- `app/rating.test.tsx` — screen tests for empty state/FAB indicator, default slot orchestration, save refresh, persistence, and detail-delete flow.
- `app/settings.tsx` — Settings page: theme picker (grouped Legacy/Minimal), semester form, WHUT import, 云端同步 section, rating JSON export, data management.
- `app/settings.test.tsx` — settings tests for WHUT import, rating export, and cloud-sync section.

### `src/features/schedule/`
- `src/features/schedule/index.ts` — public barrel exporting components, hooks, services, storage, helpers, types, import helpers.
- `src/features/schedule/types.ts` — `CategoryKey`, `CATEGORIES`, `RepeatType`, `SCHEDULE_EVENT_SOURCES`, `ScheduleEventSource`, `ScheduleEvent`, `SemesterConfig`.
- `src/features/schedule/categoryColors.ts` — `getCategoryColor(theme, category)` resolver.
- `src/features/schedule/categoryColors.test.ts` — tests for category color resolver.

#### `components/`
- `EventCard.tsx` — themed event card (list row).
- `EventCard.test.tsx` — tests for EventCard.
- `MatrixEventBlock.tsx` — matrix cell block with adaptive title/location layout; exports `MATRIX_HOUR_HEIGHT`, `getMatrixEventContentLayout`.
- `MatrixEventBlock.test.tsx` — tests for MatrixEventBlock.
- `EventSheet.tsx` — bottom-sheet modal for view/create/edit of events.
- `EventSheet.test.tsx` — tests for EventSheet.
- `DateTimePicker.tsx` — custom wheel-style date+time picker (default export).

#### `domain/`
- `index.ts` — barrel for domain helpers.
- `calendar.ts` — `WEEKDAY_LABELS`, `getISOWeekNumber`, `getWeekStart`, `getSemesterWeek`.
- `conflicts.ts` — `detectConflicts` — expands repeats in ±1 month window and reports overlaps.
- `repeat.ts` — `expandRepeatingEvents` — emits virtual instances of daily/weekly events within a range.
- `repeat.test.ts` — tests for repeat expansion.
- `validation.ts` — `validateTimeRange`, `validateTimeHour`, `validateEventTimeWindow`.

#### `hooks/`
- `index.ts` — barrel.
- `useEvents.ts` — loads events, subscribes to service listener.
- `useSemesterConfig.ts` — loads semester config, subscribes to service listener.

#### `services/`
- `index.ts` — barrel.
- `events.service.ts` — in-memory listeners + CRUD orchestration (validation, conflict detect, persistence).
- `events.service.test.ts` — tests for events service.
- `semester.service.ts` — listener-wrapped semester load/save.

#### `storage/`
- `index.ts` — barrel.
- `events.storage.ts` — AsyncStorage cache + load/save/clear for events with schema validation.
- `events.storage.test.ts` — tests for events storage.
- `semester.storage.ts` — AsyncStorage load/save for `SemesterConfig`.

#### `import/` (WHUT course-table import)
- `contracts.ts` — constants (`WHUT_CLASS_PERIOD_TIME_MAP`, etc.) + types and normalizers.
- `contracts.test.ts` — tests for contract helpers.
- `term-code.ts` — term-code resolution.
- `term-code.test.ts` — tests for term-code helpers.
- `whut-import.ts` — `convertWhutArrangedListToEvents`, `importWhutArrangedList`.
- `whut-import.test.ts` — tests for import pipeline.
- `WhutImportModal.tsx` — modal shell wrapping WebView + status UI.
- `WhutImportWebViewContainer.tsx` — embeds CAS login WebView, drives probe/fetch scripts.
- `WhutImportWebViewContainer.test.tsx` — tests for WebView container.

### `src/features/todo/`
- `src/features/todo/index.ts` — barrel: `TodoSection`, `useTodos`, service CRUD, types.
- `src/features/todo/types.ts` — `TodoType`, `Priority`, `PRIORITY_ORDER`, `PRIORITY_LABELS`, `TODO_TYPE_LABELS`, `TodoItem`.
- `components/TodoSection.tsx` — tabs (daily/weekly/longterm) + list + embedded TodoSheet.
- `components/TodoSection.test.tsx` — tests for TodoSection.
- `components/TodoItemCard.tsx` — themed row with toggle / delete affordances.
- `components/TodoSheet.tsx` — bottom-sheet modal for create/detail/edit of todos.
- `domain/index.ts` — barrel.
- `domain/refresh.ts` — `refreshTodos` resets daily/weekly completion at boundary crossings.
- `domain/sort.ts` — `sortTodosForDisplay`.
- `domain/sort.test.ts` — tests for sort helper.
- `hooks/index.ts` — barrel.
- `hooks/useTodos.ts` — loads todos, subscribes to service listener.
- `services/index.ts` — barrel including `TodoInput`.
- `services/todo.service.ts` — listener-wrapped CRUD with auto daily/weekly refresh on load.
- `storage/index.ts` — barrel.
- `storage/todo.storage.ts` — AsyncStorage cache + load/save/clear with validation.

### `src/features/settings/`
- `src/features/settings/index.ts` — barrel exporting `useSettingsForm`.
- `hooks/useSettingsForm.ts` — form state for semester + theme, plus `resetAll`.
- `services/settings.service.ts` — `loadSettings`, `saveSemesterSettings`, `clearAllData`.
- `services/rating-export.service.ts` — rating JSON export helper.
- `services/rating-export.service.test.ts` — export serialization and share-path tests.

### `src/features/rating/`
- `src/features/rating/index.ts` — public barrel exporting rating components, `useRatings`, rating service APIs, repository types, provider, and the cloud-sync surface.
- `src/features/rating/RatingServiceProvider.tsx` — app-level context that constructs the `SyncScheduler` singleton, wraps `localRatingRepository` in `SyncingRatingRepository`, installs the wrapped service, and drives boot-token `start()` + AppState-`active` `pullNow()`.
- `src/features/rating/RatingServiceProvider.test.tsx` — provider tests covering save fan-out, boot start-once, AppState wiring, and context exposure.
- `src/features/rating/types.ts` — `RatingValue`, `TimeSlotRating` entity (includes tombstone `deleted_at`).
- `src/features/rating/components/index.ts` — component barrel.
- `src/features/rating/components/StarRating.tsx` — themed 1–5 star input.
- `src/features/rating/components/EfficiencySlider.tsx` — themed discrete 1–5 slider.
- `src/features/rating/components/RatingInputSheet.tsx` — bottom-sheet rating form.
- `src/features/rating/components/RatingHistoryList.tsx` — grouped history list with empty-state quip.
- `src/features/rating/components/DayView.tsx` — rating day-view component (used by `LegacyRating`).
- `src/features/rating/components/EventPicker.tsx` — event picker used inside `RatingInputSheet`.
- `src/features/rating/components/rating-components.test.tsx` — component smoke tests.
- `src/features/rating/copy/empty-state-quips.ts` — 50 locked quips + `pickRandomQuip`.
- `src/features/rating/copy/empty-state-quips.test.ts` — quip count and picker tests.
- `src/features/rating/hooks/index.ts` — barrel exporting `useRatings`.
- `src/features/rating/hooks/useRatings.ts` — ratings hook with `loading`/`error`/`refresh`/`save`/`remove`.
- `src/features/rating/services/index.ts` — barrel exporting service APIs and types.
- `src/features/rating/services/ratings.service.ts` — `createRatingService` factory + mutable module-level singleton, forwarder functions, `configureRatingsService` / `getRatingsService`.
- `src/features/rating/services/ratings.service.test.ts` — service tests against a fake repository.
- `src/features/rating/storage/index.ts` — barrel: `LocalRatingRepository`, `localRatingRepository`, `RatingRepository` type, storage functions.
- `src/features/rating/storage/repository.ts` — `RatingRepository` interface contract.
- `src/features/rating/storage/ratings.storage.ts` — AsyncStorage-backed store (key `cs-rn:time-slot-ratings:v1`).
- `src/features/rating/storage/ratings.storage.test.ts` — storage tests.
- `src/features/rating/storage/local-repository.ts` — `LocalRatingRepository` class with tombstone-aware `list` / `listAll` / `remove`.
- `src/features/rating/storage/local-repository.test.ts` — repository tests.

#### `src/features/rating/sync/`
- `index.ts` — barrel re-exporting sync surface.
- `sync-state.ts` — `SyncStatus` union, `SyncStateEmitter`.
- `sync-state.test.ts` — emitter tests.
- `api-client.ts` — `CloudRatingApiClient` (fetch wrapper, `SyncError`, timeout, token scrubbing).
- `api-client.test.ts` — client tests.
- `syncing-repository.ts` — `SyncingRatingRepository` wrapper + `SyncScheduler` seam.
- `syncing-repository.test.ts` — wrapper tests.
- `sync-scheduler.ts` — `SyncScheduler` class with debounce + retry + LWW merge; `getSyncScheduler`/`resetSyncSchedulerForTests`.
- `sync-scheduler.test.ts` — scheduler tests.
- `wiring.ts` — `SYNC_TOKEN_STORAGE_KEY`, token helpers, `getConfiguredSyncScheduler`.

### `src/platform/`
- `src/platform/storage/async-storage.ts` — `STORAGE_KEYS` registry, `loadJSON<T>`, `saveJSON<T>`.

### `src/shared/`
- `src/shared/components/AppBar.tsx` — top bar with title, subtitle, optional right slot.
- `src/shared/components/FAB.tsx` — draggable + snappable floating action button.
- `src/shared/components/FAB.test.tsx` — FAB tests.
- `src/shared/components/fabPosition.ts` — FAB geometry helpers.
- `src/shared/lib/date.ts` — `formatTime`, `formatLocalDate`, `formatDate`, `isSameDay`.
- `src/shared/lib/id.ts` — `generateId()`.

### `src/theme/` (core theme registry — legacy path)
- `src/theme/index.ts` — theme registry helpers used through the legacy package.
- `src/theme/index.test.ts` — registry tests.
- `src/theme/types.ts` — `ThemeConfig` (colors, categoryColors, fonts, radius).
- `src/theme/ThemeContext.tsx` — `ThemeProvider`, `useTheme`, `useThemeSettings` (persists selected palette id).

### `src/themes/` — theme package architecture (P1 + Minimal P2)
- `src/themes/index.ts` — top-level package registry: exposes `THEME_PACKAGES`, resolves active package from palette id, and feeds the grouped picker in Settings.
- `src/themes/types.ts` — shared theme-package types: `ThemePackage`, `ThemePalette`, `RootComponentProps`, `ThemeGroup`.

#### `src/themes/legacy/`
- `src/themes/legacy/package.ts` — legacy package descriptor: palette list (cyber / hanami / midnight / ocean / sakura), root screens, and per-palette `ThemeConfig` lookup.
- `src/themes/legacy/components/LegacyHome.tsx` — tabbed legacy Home (TODAY/TOMORROW + Todos).
- `src/themes/legacy/components/LegacyMatrix.tsx` — tabbed legacy Matrix screen.
- `src/themes/legacy/components/LegacyRating.tsx` — tabbed legacy Rating screen with DayView + RatingHistoryList.
- `src/themes/legacy/components/LegacySettings.tsx` — tabbed legacy Settings screen; serves as the Minimal-theme settings fallback.
- `src/themes/legacy/themes/cyber.ts` — Cyber (default, dark neon) palette.
- `src/themes/legacy/themes/hanami.ts` — Hanami / Sakura 桜 palette.
- `src/themes/legacy/themes/midnight.ts` — Midnight palette.
- `src/themes/legacy/themes/ocean.ts` — Ocean palette.
- `src/themes/legacy/themes/sakura.ts` — Sakura palette.

#### `src/themes/minimal/`
- `src/themes/minimal/package.ts` — minimal package descriptor: palette list (minimal-black / minimal-ghost / minimal-ink / minimal-paper / minimal-slate), `RootComponent = MinimalRoot`, and per-palette `ThemeConfig`.
- `src/themes/minimal/palettes/black.ts` — `MINIMAL_BLACK_COLORS` constants.
- `src/themes/minimal/palettes/ghost.ts` — `MINIMAL_GHOST_COLORS` constants.
- `src/themes/minimal/palettes/ink.ts` — `MINIMAL_INK_COLORS` constants.
- `src/themes/minimal/palettes/paper.ts` — `MINIMAL_PAPER_COLORS` constants.
- `src/themes/minimal/palettes/slate.ts` — `MINIMAL_SLATE_COLORS` constants.
- `src/themes/minimal/components/MinimalRoot.tsx` — minimal top-level shell that selects the active tab, computes `MinimalEvent[]` (past / next / upcoming), hosts tab switcher, and renders MinHome/MinMatrix/MinTodos/MinSettings.
- `src/themes/minimal/components/MinHome.tsx` — today-oriented minimal home screen: NOW line, timeline rows, footer FAB.
- `src/themes/minimal/components/MinMatrix.tsx` — minimal weekly matrix screen; scroll position auto-aligns to current time.
- `src/themes/minimal/components/MinTodos.tsx` — minimal todos screen: grouped rows, create flow.
- `src/themes/minimal/components/MinSettings.tsx` — minimal settings screen: palette grid, semester form, cloud-sync entry, export action, "切换至 Legacy 主题" button that falls back to the last non-minimal palette.
- `src/themes/minimal/components/MinSettings.test.tsx` — minimal settings tests: theme-exit palette restoration (B1) and palette-cell label color (B2).
- `src/themes/minimal/components/MinEventSheet.tsx` — minimal event bottom sheet (read detail + planned edit/create per H8).
- `src/themes/minimal/components/MinRatingSheet.tsx` — minimal rating input bottom sheet (stars + efficiency + mood + reflection).
- `src/themes/minimal/components/minimalTypes.ts` — minimal-specific types/helpers: `MinimalTab`, `MinimalPaletteColors`, `MINIMAL_COLORS_BY_ID`, `MinimalEvent` (`state: 'past' | 'next' | 'upcoming'`), `RatingsByEventId`, `MinimalTodoPatch`, `PaletteChoice`, `MOOD_LABELS`, `MOOD_FACES`, `moodToIndex`, `categoryLabel`, `formatTime`, `formatDateDots`, `durationMinutes`, `todoDueLabel`.
- `src/themes/minimal/components/parts/MinNowLine.tsx` — NOW indicator with pulsating dot used by MinHome/MinMatrix.
- `src/themes/minimal/components/parts/MinPaletteCell.tsx` — palette picker cell: renders a swatch with that palette's own `{ bg, ink, line }`, but **label text + selected dot use the currently active palette's `p.ink` / `p.subtle`** so labels never collide with the palette they sit on (e.g. "Black" row on a Paper background now stays black, not white). Fallback `previewColors = MINIMAL_COLORS_BY_ID[palette.id] ?? p` keeps unknown ids rendering.
- `src/themes/minimal/components/parts/MinSettingsBlock.tsx` — monochrome editorial "block" used throughout MinSettings (title + body wrapper).
- `src/themes/minimal/components/parts/MinSheetBtn.tsx` — minimal sheet button (primary/secondary variants, edge-to-edge stroke join).
- `src/themes/minimal/components/parts/MinSheetRow.tsx` — sheet key/value row with bordered separator.
- `src/themes/minimal/components/parts/MinTabBar.tsx` — minimal bottom tab bar with icon + label + active underline.
- `src/themes/minimal/components/parts/MinTimelineRow.tsx` — timeline row renderer (time label + title + optional rating strip) used by MinHome.
- `src/themes/minimal/components/parts/MinTodoRow.tsx` — minimal todo row renderer used by MinTodos.
- `src/themes/minimal/components/parts/usePulse.ts` — `Animated.Value` pulse hook used by `MinNowLine` (opacity/scale oscillation).

### `src/test/` / `src/types/`
- `src/test/smoke.test.tsx` — smoke test.
- `src/types/react-native-webview.d.ts` — ambient typings for `react-native-webview`.

### `assets/`
- `assets/fonts/Orbitron-Regular.ttf`, `Orbitron-Bold.ttf` — bundled fonts.
- `assets/icon.png`, `splash-icon.png`, `favicon.png`, `android-icon-*.png` — app icons & splash.

---

## 2. API / Interface Contracts

### Platform storage — `src/platform/storage/async-storage.ts`
- `STORAGE_KEYS` — `{ events, semester, theme, todos, ratings }`. Callers: every storage module, `settings.service.ts`.
- `loadJSON<T>(key: string): Promise<T | null>` — callers: `events.storage`, `semester.storage`, `todo.storage`, `ratings.storage`, `ThemeContext`.
- `saveJSON<T>(key: string, data: T): Promise<void>` — callers: same as above.

### Schedule types — `src/features/schedule/types.ts`
- `CategoryKey`, `CategoryInfo`, `CATEGORIES` (record) — callers: `EventCard`, `EventSheet`, `events.storage`, `categoryColors`, `matrix.tsx`, minimal components via `categoryLabel`.
- `RepeatType` — callers: `EventSheet`, `events.storage`, `repeat.ts`.
- `SCHEDULE_EVENT_SOURCES`, `ScheduleEventSource` — callers: `events.storage`, `events.service`, `whut-import`.
- `ScheduleEvent` — primary domain entity.
- `SemesterConfig` — `{ start_date, total_weeks }`.

### Schedule storage / services / hooks / domain / components / import
Unchanged since cloud-sync Phase 7. See prior revisions of this doc for exhaustive signatures of `loadEventsFromStorage`, `saveEventsToStorage`, `loadEvents`, `addEvent`, `updateEvent`, `deleteEvent`, `toggleComplete`, `subscribeToEvents`, `resetEventsState`, `loadSemester`, `saveSemester`, `subscribeToSemester`, `resetSemesterState`, `useEvents`, `useSemesterConfig`, `WEEKDAY_LABELS`, `getISOWeekNumber`, `getWeekStart`, `getSemesterWeek`, `detectConflicts`, `expandRepeatingEvents`, `validateTimeRange`, `validateTimeHour`, `validateEventTimeWindow`, `EventCard`, `MatrixEventBlock`, `EventSheet`, `DateTimePicker`, `getCategoryColor`, and the WHUT import surface (`normalizeRawScheduleItem`, `normalizeArrangedScheduleItem`, `extractArrangedScheduleItems`, `isValidWhutTermCode`, `deriveWhutTermCodeFromDate`, `deriveWhutTermCodeFromSemesterStart`, `resolveWhutTermCode`, `convertWhutArrangedListToEvents`, `importWhutArrangedList`, `WhutImportModal`, `WhutImportWebViewContainer`).

### Todo — `src/features/todo/`
Unchanged: `loadTodos`, `subscribeToTodos`, `addTodo`, `updateTodo`, `deleteTodo`, `toggleTodoComplete`, `resetTodosState`, `TodoInput`, storage helpers, `refreshTodos`, `sortTodosForDisplay`, `useTodos`, `TodoSection`, `TodoItemCard`, `TodoSheet`.

### Settings — `src/features/settings/`
Unchanged: `useSettingsForm`, `loadSettings`, `saveSemesterSettings`, `clearAllData`, `serializeRatingRecords`, `serializeRatingsExportData`, `shareRatingsJson`, `exportLocalRatingsAsJson`.

### Rating — `src/features/rating/`
Unchanged feature surface established across Phases 1–5 and cloud-sync Phases 1–7. See prior revision for: `TimeSlotRating`, `RatingRepository`, `LocalRatingRepository`, `ratings.storage`, `createRatingService`, `configureRatingsService`, `getRatingsService`, `listRatings`, `createRating`, `updateRating`, `removeRating`, `listPendingSyncRatings`, `markRatingSynced`, `exportRatings`, `subscribeToRatingChanges`, `useRatings`, `StarRating`, `EfficiencySlider`, `RatingInputSheet`, `RatingHistoryList`, `DayView`, `EventPicker`, `EMPTY_STATE_QUIPS`, `pickRandomQuip`, `RatingServiceProvider`, `useRatingService`, `RatingServiceContextValue`, full `src/features/rating/sync/**` surface (`SyncStateEmitter`, `CloudRatingApiClient`, `SyncingRatingRepository`, `SyncScheduler`, `getSyncScheduler`, `resetSyncSchedulerForTests`, `SYNC_TOKEN_STORAGE_KEY`, `loadSyncToken`, `saveSyncToken`, `clearSyncToken`, `getConfiguredSyncScheduler`).

### Shared — `src/shared/`
Unchanged: `AppBar`, `FAB`, FAB geometry helpers and constants, `formatTime`, `formatLocalDate`, `formatDate`, `isSameDay`, `generateId`.

### Theme core — `src/theme/`
- `ThemeConfig` — used by every themed component.
- `<ThemeProvider>` — callers: `app/_layout.tsx`.
- `useTheme(): ThemeConfig` — callers: nearly all UI components.
- `useThemeSettings(): { themeName, setThemeName }` — callers: `useSettingsForm`, Settings screens (legacy + minimal).

### Theme packages — `src/themes/`
- `ThemePackage` (from `src/themes/types.ts`) — `{ id: string; label: string; palettes: ThemePalette[]; getThemeConfig(paletteId): ThemeConfig; RootComponent?: React.ComponentType<RootComponentProps> }`. Drives which root shell `app/_layout.tsx` renders and populates the Settings palette picker. Implementers: `legacyPackage` (no `RootComponent`, falls through to tabs), `minimalPackage` (root `MinimalRoot`).
- `ThemePalette` — `{ id: string; label: string; sub?: string }`.
- `THEME_PACKAGES: readonly ThemePackage[]` — registry consumed by `app/_layout.tsx` and `MinSettings` / `LegacySettings` palette pickers.
- `minimalPackage.palettes` — `minimal-black`, `minimal-ghost`, `minimal-ink`, `minimal-paper`, `minimal-slate`.
- `legacyPackage.palettes` — `cyber`, `hanami`, `midnight`, `ocean`, `sakura`.

### Minimal theme components — `src/themes/minimal/components/`
- `MinimalRoot({ themeConfig, paletteId })` — top-level root. Builds `MinimalEvent[]` with `state: 'past' | 'next' | 'upcoming'` (the upcoming finder uses `start_time > nowMs` so in-progress events are classified `upcoming`, keeping the NOW line sandwiched between past and the true next start). Renders MinHome / MinMatrix / MinTodos / MinSettings + bottom `MinTabBar`. Called by `app/_layout.tsx` when `minimalPackage` is active.
- `MinHome`, `MinMatrix`, `MinTodos`, `MinSettings`, `MinEventSheet`, `MinRatingSheet` — tab bodies consumed by `MinimalRoot`. `MinSettings` exposes `onChangeTheme` which, per B1, switches to the most recently used non-minimal palette (or falls back to `legacyPackage.palettes[0].id`).
- `MinPaletteCell({ p: MinimalPaletteColors, palette: PaletteChoice, selected: boolean, onPress: () => void })` — palette picker cell. **Swatch rectangle paints the cell's own palette colors** (`previewColors.bg`, `previewColors.line`, `previewColors.ink`, resolved from `MINIMAL_COLORS_BY_ID[palette.id] ?? p`). **Label name (`styles.name`), subtitle (`styles.sub`), and the selected dot all read from the currently active palette (`p.ink`, `p.subtle`)** so a "Black" cell on a Paper-active background stays legible — this is the B2 fix. Caller: `MinSettings` palette grid.
- `MinNowLine({ color })` — NOW indicator driven by `usePulse`. Callers: `MinHome`, `MinMatrix`.
- `MinSettingsBlock({ title, children })` — editorial section wrapper. Caller: `MinSettings`.
- `MinSheetBtn({ label, variant, onPress, disabled? })` — primary/secondary bottom-sheet action button (B1 fix set: `borderLeftWidth: 0` instead of negative margin for web-safe z-order). Callers: `MinEventSheet`, `MinRatingSheet`.
- `MinSheetRow({ label, value })` — key/value row with bordered separator used by both minimal sheets.
- `MinTabBar({ active, onChange })` — minimal bottom tab bar. Caller: `MinimalRoot`.
- `MinTimelineRow({ event, rating, ... })` — timeline row used by `MinHome`.
- `MinTodoRow({ todo, ... })` — minimal todo row used by `MinTodos`.
- `usePulse(): { opacity, scale }` — animated pulse values. Caller: `MinNowLine`.
- Helpers in `minimalTypes.ts`: `moodToIndex(mood?) → number`, `categoryLabel(event) → string`, `formatTime(iso) → 'HH:mm'`, `formatDateDots(iso) → 'DD.MM.YYYY'`, `durationMinutes({ start_time, end_time }) → number`, `todoDueLabel(todo) → string`.

---

## 3. Data Flow

### Event / Schedule flow
```
User action (HomePage / MatrixPage / EventSheet / MinimalRoot tabs)
  → features/schedule/services/events.service.ts
      (validateEventTimeWindow → detectConflicts → persist)
  → features/schedule/storage/events.storage.ts
  → platform/storage/async-storage.ts (cs-rn events key)
  → in-memory cache + listeners
  → features/schedule/hooks/useEvents.ts re-renders screens (legacy tabs or MinimalRoot)
```

### Semester / Settings flow
```
SettingsScreen / MinSettings ↔ useSettingsForm
  → features/settings/services/settings.service.ts
      → schedule/services/semester.service.ts → semester.storage.ts → AsyncStorage
      → schedule/services/events.service.ts (resetEventsState on clearAllData)
  → schedule/hooks/useSemesterConfig.ts triggers re-render on matrix.tsx / MinMatrix
```

### Theme package flow
```
app/_layout.tsx
  → ThemeProvider reads persisted palette id from AsyncStorage
  → resolves active ThemePackage from palette id (legacy vs minimal)
  → if package.RootComponent present → render RootComponent(themeConfig, paletteId) (minimal)
  → else → render the default Tabs tree (legacy)

Settings → palette picker
  → MinSettings uses MinPaletteCell × N (swatch uses cell palette; label uses active palette)
  → LegacySettings uses grouped picker (Legacy vs Minimal sections)
  → selection writes theme via useThemeSettings → AsyncStorage
  → "切换至 Legacy 主题" in MinSettings reads last non-minimal palette and restores it
    (fallback legacyPackage.palettes[0].id)
```

### Rating flow
Unchanged from cloud-sync Phase 7 — local service writes fan out through `SyncingRatingRepository` to `scheduler.notifyLocalChange()`; `AppState` active triggers `scheduler.pullNow()`; merges persist via `LocalRatingRepository` and propagate to UI through `subscribeToRatingChanges` → `useRatings`.

### Todo / Theme / Import / Rating export flows
Unchanged from prior revision.

---

## 4. Dependencies

Runtime:
- `expo`, `expo-constants`, `expo-font`, `expo-linking`, `expo-router`, `expo-status-bar`.
- `react`, `react-native`.
- `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`, `react-native-web`.
- `react-native-webview` — CAS login WebView.
- `react-native-reanimated` — minimal theme pulse/fade animations.
- `@react-native-async-storage/async-storage` — persistence backend.
- `lucide-react-native` — icon set across legacy tabs + minimal parts.

Dev / test:
- `typescript`, `jest`, `jest-expo`, `@testing-library/react-native`, `react-test-renderer`, `@types/jest`, `@types/react`.

Optional:
- `expo-sharing` + `expo-file-system` — preferred JSON export path; falls back to RN `Share.share`.

---

## 5. Changelog

- **Phase 1–6 (time-slot rating) + Cloud-sync Phases 1–7**: See prior revisions for the full rollout of the rating feature (types, repository, service, hook, components, tab integration, JSON export) and the cloud-sync layer (tombstone schema, `CloudRatingApiClient`, `SyncingRatingRepository`, `SyncScheduler`, settings cloud-sync section + detail-modal delete, `RatingServiceProvider`/AppState wiring, and documentation + manual test matrix).
- **Themes P1 — Theme package architecture**: introduced `src/themes/` with `ThemePackage` contract, legacy package wrapping the original cyber/hanami/midnight/ocean/sakura palettes + tabbed screens, and minimal package skeleton with `MinimalRoot`. `app/_layout.tsx` now renders a package's `RootComponent` when present; otherwise it falls through to the legacy tab shell.
- **Themes Minimal P2 — Home / Matrix / Todos / Settings / Sheets full drop**: implemented the minimal theme per `docs/minimal-p2-spec.md`. Added 5 minimal palettes (`black` / `ghost` / `ink` / `paper` / `slate`), MinHome/MinMatrix/MinTodos/MinSettings screens, MinEventSheet / MinRatingSheet bottom sheets, and the shared parts (`MinNowLine`, `MinPaletteCell`, `MinSettingsBlock`, `MinSheetBtn`, `MinSheetRow`, `MinTabBar`, `MinTimelineRow`, `MinTodoRow`, `usePulse`). Settings picker is grouped Legacy / Minimal; Minimal theme's Settings currently renders through `MinSettings` with `LegacySettings` as the route fallback for uncovered settings flows.
- **Minimal P2 Fix Round — Phase 1 (B1) Theme Exit Palette Fix**: `MinSettings.tsx` "切换至 Legacy 主题" button no longer jumps to the hardcoded `'cyber'` palette. It now restores the last non-minimal palette the user was on, persisting that value so subsequent minimal↔legacy round-trips remember the choice; when no prior non-minimal palette exists, it falls back to `legacyPackage.palettes[0].id` to survive palette renames. Added `MinSettings.test.tsx` covering the restore-from-last and fallback paths.
- **Minimal P2 Fix Round — Phase 2 (B2) Palette Cell Label Colors**: `MinPaletteCell.tsx` no longer uses each cell's own ink color for the label text (which made the "Black" row's name invisible against the Paper active background). The swatch rectangle still paints with the cell palette's own `{ bg, ink, line }` (resolved via `previewColors = MINIMAL_COLORS_BY_ID[palette.id] ?? p`) so the preview stays faithful, but the label name, subtitle, and selected dot now read from the currently active palette's `p.ink` / `p.subtle`, guaranteeing readable contrast on every active-palette / cell-palette combination. Component now accepts `p: MinimalPaletteColors` as a prop so callers inject the active palette. Extended `MinSettings.test.tsx` to lock the label-uses-active-palette contract.

---

## 6. MVP Acceptance Notes

### Manual rating checklist
Unchanged from prior revision. See the Phase 6 / cloud-sync Phase 7 entries for the full rating persistence, export, and cloud-sync test matrices, plus v1 known limitations.

### Minimal P2 fix-round acceptance
- `npx tsc --noEmit` exits 0.
- `npm test` stays green; minimal-specific tests live in `src/themes/minimal/components/MinSettings.test.tsx`.
- No edits to `src/themes/legacy/**`, `src/features/*/components/**`, `app/**`, storage schema, or `package.json` dependencies.
- Each fix lands either as its own `fix(themes-minimal): <id> …` commit, or the final rollup commit enumerates every fixed id.