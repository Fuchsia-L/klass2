# Agent instructions

Read [CONTRIBUTING.md](CONTRIBUTING.md), [CLAUDE.md](CLAUDE.md) and the relevant feature documentation before editing.

- `main` is the shared accepted baseline. Older theme and schedule-sync branches are historical references, not new-task starting points.
- Report the branch, HEAD and `git status --short` before editing. Preserve all existing changes. If the task baseline differs, ask the coordinating maintainer to reconcile it.
- The coordinating maintainer creates task branches and handles collection, commits, merges, synchronization and authorized releases. Remote editing agents change assigned files and run tests; they do not independently pull, push, reset or change branches.
- Handoff includes starting SHA, changed files, checks actually run and unresolved failures. Wait for collection before another overlapping task.
- Use `npm test -- --silent` and `npx --no-install tsc --noEmit`. On Linux, run Jest with `TZ=Asia/Shanghai`: an existing rating display test assumes that timezone.
- Preserve server-null normalization, cold-start persistence, repository-to-UI sync notifications, soft deletions and optimistic concurrency. Keep UI-only changes away from sync/storage internals; an explicitly assigned sync fix may change those internals with regression coverage.
- Tests use isolated storage and fake data. Do not change real courses or todos to test a repair.
- Signing material, environment files, credentials, databases and client/session state never belong in Git or handoff archives.
- Source synchronization does not build or install an APK. Coordinate Android packaging and device validation separately with the local maintainer.
