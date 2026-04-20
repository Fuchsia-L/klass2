# Minimal P3 — Three Features

三个独立小 feature，都落在 minimal 主题内，不影响 legacy。

## 必读

- `docs/minimal-p2-spec.md`（原 spec，翻译规则 + 禁区清单仍适用）
- `docs/minimal-p2-review.md` + `docs/minimal-p2-fixes-requirement.md`（上下文）
- Design 原案 `D:/_AI/design-drops/2026-04-19-theme-01/主题01-Minimal.html`（minimal 视觉基调）

## Feature 1: Matrix 横向 swipe 切周

**现状**：Matrix 头部有 `‹ ›` 按钮切上/下周。

**目标**：加横向 swipe 手势——左滑 → next week（等价于 onNextWeek），右滑 → prev week。按钮保留，swipe 是附加交互。

**实现要点**：
- 在 `MinMatrix.tsx` 的 ScrollView 外层（或全屏区域）套一个 `PanResponder` 或 `react-native-gesture-handler` 的手势识别器
- 判定：`|dx| > 50` 且 `|dy| < 30`（横向为主，避开 grid 的纵向滚动）
- 水平阈值触发后调用 `onPrevWeek` 或 `onNextWeek`
- 原生 + web 都要生效；web 端用 touchstart/touchmove 自然可用（PanResponder 在 RN-Web 也通过）
- 不要引入新依赖——用 `PanResponder` from 'react-native'

**acceptance**：
- 在 matrix 视图上横滑 > 50px 触发切周
- 纵向滚动不被劫持（还是能正常滚到 20 点时段）
- 按钮 `‹ ›` 依然正常工作（不能因此失效）
- `npx tsc --noEmit` 干净，`npm test` 全过

## Feature 2: Timeline 行 category 左侧 1px 彩色竖线

**现状**：`MinTimelineRow` 在 time 列和标题之间有一条纯 `p.line` 色的 1px `rail`。

**目标**：把 rail 改成 **category 色**（依旧 1px），但**带透明度**（alpha ~0.5），不破坏 minimal 整体灰阶调性。past 事件保持现在的 0.5 opacity 灰化。

**实现要点**：
- Category 色来源：`CATEGORIES[event.category].color`（在 `src/features/schedule/types.ts`）
- 这些色值是 legacy 时代的彩色：`#00F0FF`（STUDY）、`#A855F7`（WORK）、`#39FF14`（LIFE）、`#F59E0B`（SPORT）、`#FF2D78`（FUN）、`#64748B`（OTHER）
- 直接用可能过艳。用 `rgba(R, G, B, 0.55)` 降透明度。或者混合向 palette `p.line` 做一个柔化。
- 过去 event 再降一档（整条 rail 现有 `opacity: 0.5`，叠加即可，不用特殊处理）
- 仅 1px 宽，不要加粗——保持克制

**acceptance**：
- Today timeline 每行左侧竖线是对应 category 的柔化色，能区分类别又不喧宾夺主
- past 事件的竖线更淡（灰化 + 透明度叠加）
- 色板切换（Paper / Ghost / Graphite 等）下都不丑
- tsc + tests 干净

## Feature 3: Rating 趋势段（Today 底部）

**现状**：Today 页面是 header + unrated-strip + timeline。没有趋势展示。

**目标**：在 Today 的 timeline 下方新增一个 **"TRENDS"** 段，展示过去 7 天的评分趋势。Minimal 风格——不用引入 chart 库，手画极简图形。

**内容 + 布局**：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRENDS  ·  7 DAYS

EFFICIENCY
┌─┐           ┌─┐
│ │ ┌─┐   ┌─┐ │ │ ┌─┐   ← 每天一根 bar，高度 ∝ 当日 avg efficiency
│ │ │ │ ┌─┐ │ │ │ │ │ │
└─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘
 M   T   W   T   F   S   S       ← 周几标签（当前是 Sun 就右对齐）

MOOD
困 ──────────────────────
躁 ───────●─────────────    ← 每天一个点，y 对应当日 avg mood 索引
平 ─●───────●─●───────
好 ───────────────●─●──
极 ──────────────────●
```

**数据来源**：
- `useRatings()` 全量 rating 数组
- 只拿 `created_at` 在过去 7 天（或 updated_at，选 created_at 更合适）
- 按天 bucket（local time day boundaries）
- 每天：`efficiency` 平均值（1-5，rating 缺失的天空 bar），`mood` 平均索引（MOOD_LABELS 映射 '困'=1 ... '极'=5）

**实现要点**：
- 新建 `src/themes/minimal/components/parts/MinTrends.tsx`
- 用 `View` 画 bar chart（每 bar 宽度 `flex: 1`，高度按 efficiency 值算 px）。**不引入任何 chart 库**
- Mood 用 SVG 不方便的话用 `View` 绝对定位做点阵：5 行 × 7 列，每列一个点。可以用 `react-native-svg`（已有依赖）画更干净的 line，**推荐用 svg Line 画趋势线**
- Empty 天显示虚线 placeholder 或空白
- 进入 Today 的 ScrollView 末段，空间不足时可滚动查看

**acceptance**：
- Today 底部能看到 TRENDS 段，宽度跟 timeline 一致
- 有数据的日子显示 bar/点，无数据的日子显示虚位或 '—'
- 切换 palette 颜色同步跟随 `p.ink/p.subtle/p.line`
- 不引入新依赖
- 响应式：窄屏不错位
- tsc + tests 干净

## 约束（三个 feature 共同）

- 只动 `src/themes/minimal/**`、可能的一小块 `docs/`。legacy / features/*/components / schema / 外层 navigation 一行不动
- 不引入新 npm 依赖（`react-native-svg` 已有可用）
- 每个 feature 独立 commit（pipeline 每 phase 自己一个 commit 即可）
- `npx tsc --noEmit` + `npm test` 必须双绿
- 不写额外测试是可以的（spec 的老规矩：Iris 走视觉验收）

## 期望

三个 feature = 三个 phase。Pipeline 的新 decompose 规则（禁止独立 verify phase）已在模板中，codex 应该不会再生成 phase 8 那种空转。如果最后一个 impl phase 的 acceptance 里想加一条"跑一遍 tsc + tests 确认"，OK，允许。
