# Development and handoff workflow

`origin/main` is the accepted source baseline shared by local and remote development checkouts. Both this app and its CLI companion use the same production `ratings-api` service; the API remains a separate repository with its own `main`.

## Development cycle

1. The coordinating maintainer checks local main, remote main and origin/main for equal commits and verifies both worktrees are clean. A remote worktree with edits must be compared by file content, not just commit ID.
2. The maintainer creates a short-lived task branch from that baseline and records its starting SHA. The editing agent works on the assigned feature and runs isolated tests without modifying Git history.
3. At handoff, save the remote HEAD, full patch and reviewed untracked files. Import changes into a local task branch and verify that the collected file content matches the remote worktree. Exclude dependencies, native build output, credentials and runtime state.
4. Run `npm test -- --silent` and `npx --no-install tsc --noEmit`. On Linux use `TZ=Asia/Shanghai` for Jest because of an existing timezone-sensitive rating test. Add targeted regression coverage when a behavior change requires it.
5. Review and commit named files, merge the accepted work into main and push main without force. Keep a bundle or backup branch before reconciling diverged histories.
6. Pause edits to this repository for collection. Immediately before refreshing the remote baseline, verify its HEAD, patch and untracked file content still match the saved snapshot. If anything changed, preserve it and collect again.
7. Clear only work proven to have been collected. A retained stash or archive may preserve the old workspace while switching to the accepted main. Do not discard uncollected changes. Verify equal HEADs, clean worktrees and matching tracked-file hashes afterward.

Historical feature branches remain available for reference. New work starts from the current main. Remote editing agents follow the host workspace boundary: commits and Git synchronization are driven by the local coordinating maintainer.

## Source version and installed version

An accepted source commit is not an APK deployment. When runtime code changes, coordinate packaging, signing and device validation separately; record the source commit and APK hash in the private release log. Documentation-only synchronization needs no new APK.

Build instructions are in [BUILD_ANDROID.md](BUILD_ANDROID.md). Keep signing secrets in local secure configuration, never in the repository, logs or handoff documents. Tests must not use real user data or production write endpoints.

## Initial shared baseline

The initial accepted app code is `d29ec51201fb8193be06f775db7cd0b29aa2d94b` (2026-09-09). It prevents valid remote records with nullable optional fields from being lost on cold start, and notifies the UI when cloud synchronization writes local storage. Both checkouts already contained this code; reconciliation preserves it and adds the shared-main workflow. Use the current main SHA for later tasks, not this historical baseline.
