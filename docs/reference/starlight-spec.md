# Starlight 主题 — 集成规格

## 目标

在 `src/themes/` 下新增 Starlight 主题 package，和现有的 `legacy` / `minimal` 并排。用户可在设置里切换到 Starlight，效果 1:1 还原参考 HTML 的视觉。

## 硬约束（MUST）

1. **视觉 1:1 还原** 参考文件 `docs/reference/starlight.html`（完整单页 HTML 原型）的：
   - 配色（深紫宇宙色系，主色 `#04050f` 背景 / `#e6dffb` 文字，以及 HTML 里定义的所有色槽）
   - 字体组合（Fraunces 衬线用于标题 / 装饰、Inter 无衬线用于正文）
   - 动画（星星 twinkleA/B/C、流星 shootA/B/C、萤火虫 flyA/B/C、月亮 moonPulse、云漂 cloudDrift、nowShimmer 等）
   - 布局细节（matrix / home / rating / event / todo / settings 各屏幕的间距、圆角、阴影、分隔线）

2. **逻辑 / API / 数据层严格不变**：
   - 不改 `src/features/**`（schedule / rating / todo 的 hooks / services / domain / types）
   - 不改 `src/theme/` 下的 Context / types（可以扩展 `ThemeConfig` 的 color 槽，但不能破坏 minimal/legacy）
   - 不改 navigation（`app/` 目录下的 expo-router 结构）
   - 不改数据 schema、存储、同步 API
   - Starlight 组件只通过现有 hooks（`useEvents` / `useRatings` / `useTodos` / `useTheme` 等）取数据

3. **和 Minimal 同构的目录结构**（参照 `src/themes/minimal/` 逐一对应）：
   ```
   src/themes/starlight/
   ├── package.ts                    # 导出 starlightPackage
   ├── palettes/
   │   └── <至少一套>.ts              # 对应 HTML 里的深紫配色
   └── components/
       ├── StarlightRoot.tsx          # 顶层 router（对应 MinimalRoot）
       ├── StarHome.tsx
       ├── StarMatrix.tsx
       ├── StarRatingSheet.tsx
       ├── StarEventSheet.tsx
       ├── StarTodos.tsx
       ├── StarTodoSheet.tsx
       ├── StarSettings.tsx
       ├── starlightTypes.ts
       └── parts/                     # 原子 UI（星空背景、nowLine、tabBar、sheetRow 等）
   ```
   严格按 `src/themes/minimal/components/MinimalRoot.tsx` 的 "UI shell 取 hooks 数据分发给子组件" 模式。不新增业务逻辑分支。

4. **字体注册**：
   - `assets/fonts/` 下已下载 8 个 ttf：`Fraunces-{Regular,Medium,SemiBold,Bold}.ttf` + `Inter-{Regular,Medium,SemiBold,Bold}.ttf`（fontsource 默认 opsz 静态档位）
   - `app/_layout.tsx` 的 `useFonts({ ... })` 加上这 8 条
   - Starlight palette 的 `fonts.heading` 填 `'Fraunces-SemiBold'`（或按屏幕视觉选档），`fonts.body` 填 `'Inter-Regular'`

5. **注册**：`src/themes/index.ts` 的 `themePackages` 数组加 `starlightPackage`。Settings 屏的主题切换列表会自动发现新 package（因为是走 `getAllPalettes()` / `resolvePalette(id)`）。

## 范围外（MUST NOT）

- 不动 `src/features/**`、`src/shared/**`（除非是纯 Starlight 专属的新建内容）
- 不动现有 palette 或 legacy/minimal 组件
- 不新增 API 调用、数据库字段、同步协议
- 不引入新 npm 依赖（字体走 expo-font 即可，动画优先用 RN 内置 Animated / 已有的 Reanimated 如果项目已装；新装依赖先停下问）

## 动画实现备注

Starlight HTML 的动画都是 CSS keyframes。在 RN 里对应：
- 简单 opacity / transform 循环 → `Animated.loop(Animated.sequence(...))`
- 多元素叠加的星空 → 预生成固定位置数组 + 各自独立 `Animated.Value`
- 流星 / 萤火虫随机位移 → 同上，按 HTML 里的 keyframes 时间线 1:1 映射
- 如果项目已装 `react-native-reanimated`，优先用 Reanimated 3（shared value + withRepeat + withSequence）；否则 `Animated`

## 验收

- `npm test`（或项目定义的测试命令）全绿
- TypeScript 严格模式 pass
- 在 Expo dev server 启动后，Settings → 主题切换列表里能看到 Starlight，切过去主屏 / 矩阵 / 评分 / Todo / 设置五个界面都按 HTML 原型呈现
- 切回 minimal / legacy 仍正常
- Matrix 屏 / Home 屏在深色宇宙背景下的动画（星空 + 流星 + 萤火虫）可见且流畅（不卡 < 60fps 目标，不强求，但不能明显掉帧）

## 参考锚点

- 当前主题系统入口：`src/themes/index.ts`
- Minimal package 样板：`src/themes/minimal/package.ts`
- Minimal 顶层组件：`src/themes/minimal/components/MinimalRoot.tsx`
- Theme types：`src/theme/types.ts`（注意 `ratingFill: string` 是必需字段）
- 字体加载：`app/_layout.tsx`
- HTML 原型全文：`docs/reference/starlight.html`
