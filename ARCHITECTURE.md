Updated `ARCHITECTURE.md` with the Phase 4 changes:

- Added `MinimalRoot.test.tsx` to the file list and described its three test cases.
- Updated the `MinimalRoot.tsx` file-list entry to note the Phase 4 `start_time >= nowMs` fix.
- Rewrote the `MinimalRoot` API entry to reflect its actual `{ route }` signature, and added a separate contract entry for the newly exported `withState(events, nowMs)` helper with the Phase 4 invariant.
- Added a "Minimal timeline classification flow" section under Data Flow.
- Appended Phase 4 changelog entry (H-next: Timeline Next Event Classification).
- Updated acceptance notes to include the new test file.