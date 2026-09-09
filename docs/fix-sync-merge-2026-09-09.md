# 服务端建的事件同步不回 app —— 修复记录（2026-09-09）

服务端 `POST /v1/schedule` 建的记录，经 sync 拉回来以后在 app 里永远看不见。两个独立缺陷叠在一起，
单修任何一个都不够：数据先在冷启动时被丢掉，就算不丢，UI 也不会刷新。

## 虫 1：远端行被冷启动校验器整条丢弃

服务端回吐的每一行，未填的可空列都是**显式 `null`**（`repeat_until` / `location` /
`reminder_minutes` / `notes` / `source`），而 app 的校验器只放行 `undefined`。

链路：`mergeRemoteRecords` → `repository.save()` 不校验，带 `null` 的行照样落盘 → 下次冷启动
`loadEventsFromStorage` 用 `isScheduleEvent` 过滤 → `isValidRepeatUntil(null)` 等返回 false →
**整条记录被丢弃**（连带 title、时间全没了），并只在 console 留一行 warn。

修法以**归一化为主**：在存储写入口把这些字段的 `null` 抹成 `undefined`，让本地存储只存在一种形状；
校验器同时放行 `null` 作为第二道保险（应付旧版本已经写进磁盘的脏行）。归一化没有放进 UI 层。

## 虫 2：merge 写进来的数据不触发 UI 刷新

`useEvents` 订阅的是 `events.service.ts` 的模块级 `listeners`，但 merge 走的是
`localScheduleEventRepository.save()`，只通知 repository 自己那套监听集——**那套没有任何订阅者**。
于是远端行即使成功落盘，也要等下次冷启动才看得见。

修法：在 service 模块初始化时把 repository 的变更通知桥接到 service 的 listeners。

todo 侧两个虫都是同款，一并修了。

## 改动清单

| 文件 | 改了什么 | 为什么 |
| --- | --- | --- |
| `src/features/schedule/storage/events.storage.ts` | 新增导出的 `normalizeEventRecord()`，把 `repeat_until` / `location` / `reminder_minutes` / `notes` / `source` 上的 `null` 删成缺省字段；在 `cloneEvents()` 里调用 | `cloneEvents` 是 `saveEventsToStorage` 和 `loadEventsFromStorage` 共用的唯一收口，一处改，读写全路径都归一化 |
| 同上 | `isValidReminder` / `isValidSource` / `isValidRepeatUntil` 的 `value === undefined` 放宽成 `value == null` | 第二道保险：旧版本已经写进磁盘的带 `null` 脏行不再被丢 |
| 同上 | `loadEventsFromStorage` 里对每行先跑 `normalizeEventRecord`，变了就计入 `upgraded` 触发一次写回 | 磁盘上的历史脏行被就地洗一次，只洗一次 |
| `src/features/todo/storage/todo.storage.ts` | 同款：新增 `normalizeTodoRecord()`（字段为 `notes`）、在 `cloneTodos()` 调用、`isTodoItem` 的 notes 校验放宽为 `== null`、load 时归一化并触发写回 | 同上 |
| `src/features/schedule/services/events.service.ts` | 模块级 `localScheduleEventRepository.subscribe(() => notify())` | 把 repository 的变更桥到 service listeners，merge 进来的远端行当场刷新 UI |
| `src/features/todo/services/todo.service.ts` | 模块级 `localTodoRepository.subscribe(() => notify())` | 同上 |
| `src/features/schedule/services/events.sync.test.ts` | 新增 describe「events sync merge of server-shaped rows」3 个用例 | 见下 |
| `src/features/todo/services/todo.sync.test.ts` | 新增 describe「todo sync merge of server-shaped rows」3 个用例 | 见下 |

`synced_at` / `deleted_at` **故意不归一化**：这两个字段的 `null` 是有意义的状态（"没同步过" /
"没删除"），不是"字段缺省"。

既有测试一条没删、没减弱。

## 新增测试

用真实的服务端行形状：所有可空字段显式 `null`、`source: 'claude'`、`start_time` 是裸上海格式
`2026-09-12T13:00:00`（无时区后缀）。每个用例都跑完整一轮 `CloudSyncScheduler.pullNow()`
（stub 掉 apiClient），而不是直接调内部方法：

1. **merge → 冷加载 → listAll 仍在**：merge 后清缓存模拟冷启动，记录还在，`source`、`start_time`
   原样保留，`synced_at` 被打上 server_time，并且能出现在 `loadEvents()` 的活动列表里。
2. **归一化生效**：冷加载后那几个字段是 `undefined`；直接读 AsyncStorage 原始 JSON 确认落盘的
   对象里根本没有这些 key；`deleted_at` 仍是 `null`。
3. **UI 监听被通知**：`subscribeToEvents` / `subscribeToTodos` 的 listener 在 merge 当场被调用。

**已验证这 3+3 个用例在修复前确实是红的**：把 storage + service 两个改动 stash 掉重跑，
schedule 侧 3 failed / 4 passed，todo 侧 3 failed / 5 passed；改动恢复后全绿。也就是说这些用例真的
钉住了两个虫，不是摆设。

## 测试结果

- `npx jest src/features/schedule/services/events.sync.test.ts` → 7 passed
- `npx jest src/features/todo/services/todo.sync.test.ts` → 8 passed
- 受影响面（schedule/todo storage + schedule services + whut-import + shared/sync）9 suites → 87 passed
- 全量 `npm test`（脚本本身带 `--runInBand`）→ **60 suites passed / 1 failed，356 passed / 1 failed**
- `npx tsc --noEmit` → 干净无报错（TS strict）

顺带一个坑记在这：Jest 走 Babel、只剥类型不做类型检查，所以第一版归一化函数写成
`<T extends Record<string, unknown>>` 时测试全绿但 `tsc` 报了 12 条错（`ScheduleEvent` 没有索引签名）。
已改成直接以 `ScheduleEvent` / `TodoItem` 为参数类型、在读取处做窄转换。**光看 jest 绿不够，
这个仓是 TS strict，验收请连 `npx tsc --noEmit` 一起跑。**

唯一那条失败是 `src/features/rating/components/rating-components.test.tsx` 的
`RatingHistoryList groups by date descending and renders themed cards`，断言
`18:00 - 19:00` 这个渲染出来的时间文本。

**这条是既有失败，不是本次改动引入的**：把工作树整个 stash 到干净基线单跑这个文件，同样 1 failed /
8 passed。原因基本可以确定是时区——VPS 跑在 UTC，这条断言吃的是本地时区渲染，在上海时区的本机上应该
是绿的。它落在 rating UI，和本次 schedule/todo 同步链路零交集，也在 CLAUDE.md 划的 rating off-limits
区域里，所以没动。

## 给本机验收的交接

改动只落在 klass2，**没有 commit、没有 push、没动 git 基线**，工作树留给你验收。`git status --short`
应该正好这 6 个文件（4 个源文件 + 2 个测试文件），没有新增源文件。`work/ratings-api` 一个字没碰。

验收建议按这个顺序：

1. **先在本机跑一次 `npm test`**。预期全绿 357/357——上面那条 rating 时区失败在上海时区应该自己好了。
   如果本机也红，那它就是一条真实的既有 bug，但和本次修复无关，另开一单。
2. **真机验一遍闭环**：服务端 `POST /v1/schedule` 建一条事件（可空字段全不填，最能打到这个虫），
   然后在 app 里等一次同步。预期是**不用重启 app，列表当场多出这条**——这一点是虫 2 的验收点，
   以前必须冷启动才看得见。
3. **老脏数据的回收**：如果你的测试机上已经有一批被丢弃过的行，它们其实一直躺在 AsyncStorage 里
   （被丢弃的是内存里的读取结果，磁盘没删）。这次冷启动会把它们归一化后救回来并写回一次。
   所以升级后第一次打开可能会**凭空多出几条以前"消失"的事件**——这是预期行为，不是新 bug。
4. Android release 包没重新构建过，只跑了 Jest。

一个设计上的取舍值得你过一眼：归一化放在 `cloneEvents` / `cloneTodos` 里，因为这是读写两条路唯一的
共同收口，改一处覆盖全部落盘路径（包括 `replaceImportedEvents` 那种绕过 repository 直接写 storage 的）。
代价是每次 clone 多一次小对象扫描——字段是常量数组、行数是课表量级，可以忽略。如果你更希望它显式地
待在 merge 路径上（`sync-scheduler.ts` 的 `mergeRemoteRecords`），那需要把归一化做成泛型注入到
scheduler，shared 层要知道每个 feature 的可空字段表，反而更绕，所以选了现在这条。
