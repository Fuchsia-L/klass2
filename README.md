# klass2 / CyberSchedule

React Native + Expo app for schedules, todos and time-slot ratings, with cloud synchronization through the separate [ratings-api](https://github.com/Fuchsia-L/ratings-api) backend.

Start development from `main`. Local and remote checkouts share this accepted baseline; task branches are collected and reviewed by the local maintainer before merging.

- [Development and handoff workflow](CONTRIBUTING.md)
- [Agent instructions](AGENTS.md)
- [Project conventions](CLAUDE.md)
- [Architecture](ARCHITECTURE.md)
- [Android build notes](BUILD_ANDROID.md)

Validation: `npm test -- --silent` and `npx --no-install tsc --noEmit`. Use `TZ=Asia/Shanghai` for Jest on Linux.
