# Minimal Theme P2 — Implementation Spec

> 给 codex 用：把 Minimal 主题从"建设中"占位推到完整可用。
> 验收方式：先在 expo web 上看效果对齐 design，再打 APK。

---

## 0. Source of truth

Design 原案：`D:\_AI\design-drops\2026-04-19-theme-01\主题01-Minimal.html`

文件结构（HTML 顶部是 Babel 编译产物，**底部 4020 行往下才是源 JSX**——读后者）：

| 部分 | 行号范围 |
|---|---|
| MinimalApp shell + 状态 | 4062–4148 |
| MinHome (timeline + nudge + unrated strip + todo collapsible) | 4167–4330 |
| TimelineRow（含 rating 行内显示） | 4332–4413 |
| NowLine（含 pulse 动画） | 4415–4449 |
| MinMatrix + MatrixBlock | 4451–4640 |
| MinTabBar + TabBtn | 4641–4675 |
| MinRatingSheet（efficiency bar + mood 5 格 + reflection） | 4682–4850 |
| MinEventSheet | 4855–4908 |
| MinSettings + SettingsBlock + PaletteCell | 4954–5080 |
| MinTodos + TodoRow | 5085–end |

Palettes 在 HTML 同文件 line 3925–4018，跟 codebase 已有 `src/themes/minimal/palettes/*.ts` 完全对得上。

---

## 1. 已决定的事（不再问）

| 项 | 决定 |
|---|---|
| 字体 | `'Inter', system-ui, sans-serif`（design 写死）。RN 端用 system fallback；如果要装 Inter 字体文件后续再说 |
| Mood 字段策略 | 存为固定 5 字符串 `'困' \| '躁' \| '平' \| '好' \| '极'`，写到现有 `TimeSlotRating.mood: string` 字段。**不动 schema** |
| Overall rating 字段 | Minimal 不暴露 overall rating；保存时让 service 层自动 `rating = efficiency` |
| Mood 颜文字 | **保留** design 里的颜文字切换动效（`MOOD_FACES = ['(๑-_-๑)', '(>﹏<)', '( ･_･)', '( ´ ▽ ` )', '(๑>ᴗ<๑)']`），选中态从汉字 fade 到颜文字 |
| Nudge 触发 | event end_time 已过 + 未评 + 当天范围内 → 显示 nudge。取最近一个；其它的进 Unrated strip 计数 |
| Sprint 范围 | **一次性全做完**（Home / Matrix / Todos / Settings / EventSheet / RatingSheet 全 minimal 化），先 web 验证 |
| Legacy 区不动 | `src/themes/legacy/**` 一行不改；`src/features/*` 里的 components（EventCard / RatingInputSheet / StarRating / WhutImportModal 等）不改、不复用——minimal 重写一份 |
| Tab 结构 | TODAY / WEEK / TODOS / SETTINGS（4 个，没有 RATING tab）。Todos 升 tab 是 minimal 独有，legacy 不动 |
| FAB | minimal 不要浮动 FAB；改成 tab bar 右侧固定 + 按钮（按下缩放） |

**核心原则**：功能最小改动，UI 全部复刻设计稿。

---

## 2. 文件清单

### 创建
```
src/themes/minimal/components/
  MinHome.tsx              ← timeline + 顶部 nudge / unrated strip / todo collapsible
  MinMatrix.tsx            ← 7 列周视图，今日列反色，hero 事件反色，now line + pulse
  MinTodos.tsx             ← 独立 todos 页面（Open / Done 分组，行内编辑）
  MinSettings.tsx          ← 编辑器风格 settings；含主题切换、palette 选择、Semester 编辑、WHUT 导入入口、Sync token、JSON 导出
  MinEventSheet.tsx        ← 事件 sheet（编辑器风格，slide up）
  MinRatingSheet.tsx       ← 评分 sheet（efficiency bar + mood 5 格 + reflection textarea）
  parts/
    MinTabBar.tsx          ← 4 tab + 右侧 + 按钮
    MinTimelineRow.tsx     ← 单行 event 渲染（含 rating 行内显示 + 未评+按钮）
    MinNowLine.tsx         ← 当前时间分隔条 + pulse 动画
    MinSheetRow.tsx        ← editorial 元数据行（label small caps + value）
    MinSheetBtn.tsx        ← 主/次按钮（无圆角，反色为主）
    MinSettingsBlock.tsx   ← settings 分块容器（title small caps + 可选 subtitle italic）
    MinPaletteCell.tsx     ← palette swatch + name + sub
    MinTodoRow.tsx         ← 单行 todo（checkbox + 标题 + due + delete）
    usePulse.ts            ← Animated.loop 通用 hook，opacity 1 ↔ 0.55，2400ms
```

### 修改
```
src/themes/minimal/components/MinimalRoot.tsx
  ← 把当前的 settings fallback 替换成完整的路由分发，render Min* 组件
  ← 路由集合 = ['home', 'matrix', 'todos', 'settings']（多了 todos）
```

### 不动
- `src/themes/legacy/**`
- `src/features/**` 里所有 component 文件（hook / service / domain / type 都用，但 component 不复用）
- 现有 navigation / shell

### Navigation/路由集合更新
当前 `src/themes/types.ts` 里 `RouteName = 'home' | 'matrix' | 'rating' | 'settings'`。

需要扩展加 `'todos'`：
- 改 `RouteName` 类型加 `'todos'`
- legacy package.renderRoot 里如果碰到 `'todos'` 就 fallback 到 `'home'`（legacy 没有 todos 独立页）
- 路由列表 + tab bar 数据源也要相应更新

⚠️ tab bar 是哪个组件管的需要 codex 排查：
- 如果是各主题包内部自管（minimal 自己 render MinTabBar，legacy 自己 render legacy tab bar），只在 minimal 这边加 todos tab，legacy 维持 4 tab（home/matrix/rating/settings）
- 如果是 shell 层共享 tab bar，需要主题包 declare 自己有哪些 tab

**优先选第一种方案**——主题包自治 tab。这样 legacy 和 minimal tab 集合不一样不会互相绑架。当前 `package.ts` 的 `renderRoot(route)` 已经是这样的接口。

---

## 3. 数据适配

### 3.1 RouteName 扩展
`src/themes/types.ts` → `RouteName` 加 `'todos'`。Legacy 包不实现 todos 路由（用现有 home 即可）；minimal 包必须实现。

### 3.2 Rating 数据流
入口 → Sheet → 保存：

```typescript
// 用户在 MinHome 或 nudge 触发 onRate(eventId)
// → MinimalRoot 状态 ratingTargetEventId = eventId
// → 显示 MinRatingSheet
// → 用户填 efficiency(1-5) + mood(1-5 索引) + reflection(string)
// → onSave({ efficiency, moodIndex, reflection })
//   - moodIndex → MOOD_LABELS[moodIndex - 1] = '困'|'躁'|'平'|'好'|'极'
//   - 调 features/rating 的 saveRating service：
//     {
//       slot_start: event.start_time,
//       slot_end: event.end_time,
//       linked_event_id: event.id,
//       efficiency,
//       rating: efficiency,            // ← overall = efficiency（决定 B）
//       mood: MOOD_LABELS[moodIndex-1],
//       reflection,
//     }
```

读取已有 rating（用于 timeline 行内显示 / sheet 编辑回填）：
- 通过 `useRatings()` hook 拿全量 rating list
- 按 `linked_event_id === event.id` 过滤，取最新一条
- 显示文本：`EFF {rating.efficiency}/5 · {rating.mood}`（mood 已经是字符串）

### 3.3 Mood 字符串 → 索引（Sheet 回填用）
```typescript
const MOOD_LABELS = ['困', '躁', '平', '好', '极'] as const;
function moodToIndex(mood: string | undefined): number {
  if (!mood) return 0;
  const i = MOOD_LABELS.indexOf(mood as any);
  return i === -1 ? 0 : i + 1;
}
```

### 3.4 Nudge 候选
`MinHome` 内部计算：
```typescript
const now = Date.now();
const today = new Date(); today.setHours(0,0,0,0);
const todayEnd = new Date(today); todayEnd.setDate(todayEnd.getDate()+1);

const pastUnratedToday = events
  .filter(e => {
    const end = new Date(e.end_time).getTime();
    return end < now && end >= today.getTime() && end < todayEnd.getTime();
  })
  .filter(e => !ratingsByEventId[e.id])
  .sort((a,b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime());

const nudgeEvent = pastUnratedToday[0] ?? null;          // 最近一个
const unratedCount = pastUnratedToday.length;            // 包括 nudgeEvent
const endedMinAgo = nudgeEvent
  ? Math.max(0, Math.floor((now - new Date(nudgeEvent.end_time).getTime()) / 60000))
  : 0;
```

显示文案：
- `endedMinAgo === 0` → "刚结束"
- `endedMinAgo < 60` → `刚结束 ${endedMinAgo} 分钟`
- `endedMinAgo >= 60` → `结束 ${Math.floor(endedMinAgo/60)} 小时前`

### 3.5 Todo 适配
Design 用的 `SAMPLE_TODOS` 字段 `{ id, title, due, note, done }`，codebase `TodoItem` 是 `{ id, title, type, priority, is_completed, last_reset, created_at, notes }`。

映射：
| design | codebase |
|---|---|
| `done` | `is_completed` |
| `note` | `notes` |
| `due` | 派生自 `type`（daily/weekly/longterm）+ `last_reset`，文案：`今日` / `本周` / `长期` |
| `title` | 同名 |

行内编辑：design 是点击行进入 input mode。codebase `updateTodo(id, patch)` service 已有，直接调。

新建 todo 在 minimal 通过 tab bar 的 + 按钮触发（仅当 tab === 'todos' 时新建 todo；其它 tab 时新建 event）。新 todo 默认 `{ type: 'daily', priority: 'medium', is_completed: false, title: '' }`，进编辑态。

---

## 4. Per-component spec

每个组件的 props / 行为已经在 HTML 里完整给出。codex 翻译时严格按 HTML 像素级复刻。下面只列**翻译时需要特别注意的点**。

### 4.1 通用 React Native 翻译规则

| Design (HTML/CSS) | RN 等价 |
|---|---|
| `<div>` 容器 | `View` |
| `<span>` / `<div>` 文本 | `Text` |
| `<button>` | `Pressable`（不是 TouchableOpacity——要 hover/press 状态） |
| `<input>` | `TextInput` |
| `<textarea>` | `TextInput multiline numberOfLines={N}` |
| `onClick` | `onPress` |
| `cursor: 'pointer'` | 删（RN 不需要） |
| `userSelect: 'none'` | 删（仅 web） |
| `borderTop: '1px solid X'` | `{ borderTopWidth: 1, borderTopColor: X }` |
| `border: '1px solid X'` | `{ borderWidth: 1, borderColor: X }` |
| `background: 'X'` | `backgroundColor: 'X'` |
| `transform: 'scale(0.985)'` | `transform: [{ scale: 0.985 }]` |
| `transform: 'rotate(90deg)'` | `transform: [{ rotate: '90deg' }]` |
| `transition: 'X 200ms ease'` | 用 `Animated.timing` 替代；不能直接写在 style |
| `fontVariantNumeric: 'tabular-nums'` | `fontVariant: ['tabular-nums']` |
| `textDecoration: 'line-through'` | `textDecorationLine: 'line-through'` |
| `fontStyle: 'italic'` | 同（RN 支持） |
| `textTransform: 'uppercase'` | 同（RN 支持） |
| `letterSpacing: 2` | 同 |
| `gap: 8` | 同（RN 0.71+ OK；codebase 是 0.83） |
| `position: 'absolute', inset: 0` | `position: 'absolute', top:0, right:0, bottom:0, left:0` |
| `cubic-bezier(0.22, 0.9, 0.3, 1)` | `Easing.bezier(0.22, 0.9, 0.3, 1)` |
| `pointerEvents: 'none'` | `pointerEvents="none"` prop 写在 View 上 |
| `boxSizing: 'border-box'` | RN 默认就是 border-box，删 |
| `overflow: 'hidden'` | 同 |
| 字体 family `'Inter', sans-serif` | `fontFamily: 'System'`（没装 Inter 字体文件就用 System，视觉差异接受） |

### 4.2 动画清单

**只有这几处需要 Animated**：

1. **NowLine pulse**（HTML 4441–4445）
   - `opacity 1 ↔ 0.55, 2400ms ease-in-out, infinite loop`
   - 用 `Animated.loop(Animated.sequence([Animated.timing(opacity, {to:0.55, duration:1200, useNativeDriver:true, easing: Easing.inOut(Easing.ease)}), Animated.timing(opacity, {to:1, duration:1200, ...})]))`
   - 抽到 `parts/usePulse.ts` hook 复用（matrix now line 也用）

2. **Sheet slide up**（MinEventSheet / MinRatingSheet）
   - `transform: translateY(0) ↔ translateY(100%) over 260ms cubic-bezier(0.22, 0.9, 0.3, 1)`
   - 用 `Animated.spring` 或 `Animated.timing` + `Easing.bezier`
   - `pointerEvents` 在 closed 态设 `'none'`，open 态设 `'auto'`

3. **Press scale**（TimelineRow / TabBar + 按钮 / Sheet 按钮）
   - 按下 `scale(0.96~0.985)`，松开回 1，120–150ms
   - 简化方案：`Pressable` 的 `style={({pressed}) => [base, pressed && {transform:[{scale:0.97}]}]}`，不用动画也能接受
   - design 说 120ms transition——如果觉得突兀，加 `Animated.timing` 80–120ms

4. **Mood 选中态：汉字 → 颜文字 fade**（HTML 4768–4803）
   - 选中时 fontSize 16→12, font 切 mono, content 从 `'困'` 变成 `'(๑-_-๑)'`
   - 同时下方出现 `label.toUpperCase()` small caps
   - 用 `Animated.timing` 做 opacity / size 过渡，160ms。**这条 Iris 明确要保留**
   - 实现建议：两层 Text 叠在一起，selected → 上层（颜文字）opacity 0→1 + scale up，下层（汉字）opacity 1→0；下方 label 从 height 0 展开到 auto

5. **Todo 折叠展开**（HTML 4226–4229）
   - `maxHeight 0 ↔ 280, 240ms ease`
   - RN 没法 animate height: 'auto'。用 `LayoutAnimation.configureNext({duration:240, ...})` 配合 conditional rendering，或者用 `react-native-reanimated`（**未安装**，不要引入）
   - 简化：直接 conditional render，不做平滑动画也行；如果要平滑用 LayoutAnimation
   - 旋转的 ▸ 符号正常做 transform rotate

6. **Screen crossfade**（HTML 4150–4162）
   - tab 切换时各 screen `opacity 0/1, 180ms ease`
   - 实现：保留所有 4 个 Screen 同时挂载，active 的 opacity=1, 其它 opacity=0 + pointerEvents='none'
   - 用 `Animated.timing` on opacity

### 4.3 Web vs Native 差异

她会先在 expo web 验收。已知 web 路径走 `react-native-web`：
- 大部分 RN style 自动翻译成 CSS——上面动画方案在 web 上也成立
- `LayoutAnimation` 在 web 上会 no-op（可以接受，无折叠动画）
- Animated 在 web 上 OK
- Pressable 在 web 上正常响应 hover/press
- `fontVariant` 在 web 上正常应用 tabular-nums

**web 验收阶段重点看**：
- 颜色 / 间距 / 字号是否完全对得上 design HTML
- 动效：NOW pulse / sheet slide / 颜文字切换 / press scale 是否流畅
- 切换 5 个 palette 是否颜色对得上
- 切换 4 个 tab 是否 crossfade
- nudge / unrated strip / 行内 rating 是否显示对（mock 一些 past + 未评 event 测）

---

## 5. MinSettings 内容（design 之外的功能补充）

Design 的 MinSettings 只有 Theme / Palette / Semester 三块。但 LegacySettings 还有：
- WHUT 课表导入
- Sync token 设置 + sync 状态
- JSON 导出 ratings

**功能不能丢**，统一塞进 MinSettings，按 editorial 风格新增 SettingsBlock：

```
[PREFERENCES]
Settings (大标题)

[THEME]
Current: Minimal              [CHANGE]   ← 切回 legacy

[PALETTE]
(2 列 swatch 网格，5 个 minimal palette 选)

[SEMESTER]
Start    23.02.2026
Current  Week 6
Total    18 weeks
                           [EDIT]        ← 改进入编辑模式（沿用 legacy 的 form 逻辑，但 UI 走 SheetRow 风格）

[SCHEDULE IMPORT]
Import from WHUT           [IMPORT]      ← 弹 WhutImportModal（直接复用 legacy 的 modal，可接受跳风格）

[CLOUD SYNC]
Token  ••••••••••           [PASTE]
Last sync  2 min ago
                           [SYNC NOW]

[DATA]
Export ratings as JSON     [EXPORT]
```

每个 block 用 `MinSettingsBlock` 包裹（HTML 5025–5040）。复用 legacy 的 service / hook（`useSettingsForm` / `getConfiguredSyncScheduler` / `exportLocalRatingsAsJson` / `importWhutArrangedList`），UI 重写。

WHUT modal 例外：直接复用 `WhutImportModal`（包内逻辑复杂，不重写），接受 modal 风格不 minimal。

---

## 6. Web 验证流程

```bash
cd D:/_PROJECTS/cyberschedule-rn
npm run web        # = expo start --web
```

打开浏览器（默认 8081/19006），手机模式宽度 ~390px 看效果。

**验收 checklist**：
- [ ] 切到 Minimal 主题，5 个 palette 各切一遍颜色对
- [ ] TODAY tab：顶部日期/标题、todo collapsible、unrated strip、nudge 横幅、timeline 行（past 灰+删除线、next 加粗+实心 dot、upcoming 普通）、行内 rating 显示
- [ ] 点 timeline 行 → MinEventSheet slide up，metadata 表格、Cancel/Save 按钮
- [ ] 点未评 + → MinRatingSheet slide up，efficiency bar 5 段递增、mood 5 格选中切颜文字、reflection 输入、Skip/Save 状态
- [ ] WEEK tab：7 列 + 时间轴、今日列反色、hero event 反色、now line 横贯 + pulse
- [ ] TODOS tab：Open/Done 分组、checkbox 切换、点击行进入编辑、+ 按钮新增、× 删除
- [ ] SETTINGS tab：5 块（Theme / Palette / Semester / Schedule Import / Cloud Sync / Data），Change 切回 legacy 主题，palette 选中态半透明
- [ ] tab 切换 crossfade
- [ ] press scale 反馈

---

## 7. 不要做的事

- 不要碰 `src/themes/legacy/**`
- 不要碰 `src/features/*/components/**`（hooks / services / types / domain 自由用）
- 不要引入新依赖（特别是 reanimated / moment / dayjs / zustand 等）
- 不要改 schema（`TimeSlotRating` 字段不动；mood 存为既有 string 字段）
- 不要写"P3 待补"占位组件——这次必须每条路由都完整

---

## 8. PR 收口

- 单 commit（或一组合理拆分）push 到 `feat/time-slot-rating` 分支
- commit msg 模板：`feat(themes): minimal P2 复刻 design drop —— Home/Matrix/Todos/Settings/Sheets 全量`
- 不需要写新测试——Iris 走视觉验收
- TypeScript 必须 `npx tsc --noEmit` 干净
