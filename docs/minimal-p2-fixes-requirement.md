# Minimal P2 — Fix Round Requirement

修 minimal 主题 P2 实现的 8 个已知问题（4 blocker + 4 polish）。所有问题在 review 文档里有详细分析。

## 必读文档

- `docs/minimal-p2-spec.md` — 原 spec（数据模型 / 文件清单 / 翻译规则 / 禁区）
- `docs/minimal-p2-review.md` — opus 审核报告（issue 详情 + fix sketch + 文件:行号）
- `D:/_AI/design-drops/2026-04-19-theme-01/主题01-Minimal.html`（line 4020+ 是源 JSX）— UI 像素级源头

## 必修问题（blockers）

### B1 — `MinSettings.tsx:230` "Change theme" 跳到硬编码 `'cyber'`
应改为：跳到上一个非 minimal palette（持久化 last-non-minimal palette），或退而求其次用 `legacyPackage.palettes[0].id` 对抗 rename。

### B2 — `MinPaletteCell.tsx` palette 网格用了**每行 palette 自己的 ink 色**当 label 字色
导致 Paper 背景下 Black 行的字 = 白色 = 隐形。Fix：label 用当前 active palette 的 `p.ink/p.subtle`，swatch 矩形保留 `colors.bg/ink`。

### B3 — `MinRatingSheet.tsx:26-35` useEffect 依赖把 `existing.efficiency/mood/reflection` 都包进去
导致 ratings refresh 触发时 mid-edit 的本地 state 被重置。Fix：依赖只留 `[open, event?.id]`，对齐 design HTML line 4694。

### B4 — `MinimalRoot.tsx:42-48` `withState` 把进行中的 event 标 `next`
NOW line 因此被推到正在进行的 event 之上，而不是夹在 past / 未开始之间。Fix：`upcoming` finder 改成 `start_time > nowMs`（让进行中 event 走 upcoming），保证 next = 真正下一个 start。

## 必修问题（polish）

### H1 — `MinSheetBtn.tsx` `marginLeft: -1` 接缝 react-native-web 上 z-order 漂
Fix：去掉负 margin，primary 按钮改 `borderLeftWidth: 0`，效果一致但 web 安全。

### H2 — `MinRatingSheet.tsx` mood 选中态没切 mono font，且没做 design 的 fade 动画
spec 4.2 #4 明确要保留：
1. selected 时 fontFamily 切 monospace（`Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })`）
2. 汉字 ↔ 颜文字 双层 crossfade 160ms（用两个 `Animated.Value` opacity）

### H4 — `MinMatrix.tsx:77` `contentOffset` iOS-only，web 上 no-op
Fix：保留 ScrollView ref，`useEffect` 里 `ref.current?.scrollTo({ y: Math.max(0, nowTop - 100), animated: false })`。在 web/android/iOS 都生效。

### H8 — `MinEventSheet.tsx` "新建事件" 模式没有可编辑字段
当前 `+` 按钮在非 todos tab 调 `setEventSheetId('new')`，但 sheet 是只读 metadata 显示。Save 按钮等于关闭，没创建任何 event。

**两选其一，挑简单的那条**：
- **首选 (a)**：`MinEventSheet` 在 `isNew` 模式下显示**最简表单**——title TextInput / start time picker / end time picker / category select。Save 调 `useEvents()` 的 create service 落库
- **退而求其次 (b)**：`+` 按钮在非 todos tab 改成弹个 toast "新建事件请走导入流程"，不打开 sheet

> 选 (a)。复用 features/schedule 现有 hooks/services；保持 minimal 视觉风格（无圆角、editorial label）。

## 验收

- `npx tsc --noEmit` 必须 exit 0
- `npm test` 必须 全过（不许引入回归）
- 不动 `src/themes/legacy/**`、`src/features/*/components/**`、`app/**`、schema、依赖
- 所有改动落在已存在的文件里（不新建文件，除非必要）

## 不做的事

- 不要"顺便重构"——只改这 8 条
- review 里 H3 / H5 / H6 / H7 + 所有 L1-L10 是低优 / 已撤回 / 设计意图，**不要碰**
- 不要改 spec / review 文档本身

## 期望产出

每修一条：commit 一次，commit msg 写 `fix(themes-minimal): <issue id> <一句话>`。或者最后一次性 commit 也行，但 commit msg 必须列清 8 条都做了什么。
