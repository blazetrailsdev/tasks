---
title: "load-controllers-shares-collect-constants"
status: draft
updated: 2026-10-26
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/application/finisher.ts`: `loadJobs` and `loadChannels` share `collectConstants` (trails#9319). `loadControllers` / `collectControllers` keep a separate scan with different semantics:

- it imports only `*[-_]controller.(ts|js)` files, where `collectConstants` imports every `.ts`/`.js`;
- it takes any export whose name ends in `Controller`, where `collectConstants` takes the export named `camelize(filename)`;
- it keys by the underscored path prefix (`admin/users`).

Zeitwerk eager-loads every file under `app/controllers`, `concerns/` included (`railties/lib/rails/application/finisher.rb`, `eager_load!`). `eager-load-app-channels-in-finisher` asked for one helper across all three scans.

## Acceptance criteria

- [ ] `loadControllers` goes through `collectConstants`, and controller keys stay the same for nested and dashed directories (`admin/users`).
- [ ] A test covers a nested controller, plus a `concerns/` file and a non-controller export under `app/controllers`.
