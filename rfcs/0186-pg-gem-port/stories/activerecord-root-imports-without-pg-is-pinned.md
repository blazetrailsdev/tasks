---
title: "A committed plain-node check pins that activerecord's root imports without pg"
status: claimed
updated: 2026-11-21
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-21T00:56:32Z"
assignee: "activerecord-root-imports-without-pg-is-pinned"
blocked-by: null
closed-reason: null
---

## Context

trails#10414 verified the story `pg-activerecord-loads-the-package-as-an-optional-peer` (acceptance criterion 3) only by hand. A plain-node import of the built `packages/activerecord/dist/index.js`, under a resolve hook that hides both `pg` and `@blazetrails/pg`, succeeds. `await ConnectionAdapters.load("postgresql")` followed by `ConnectionAdapters.resolve("postgresql")` raises `LoadError: Error loading the 'postgresql' Active Record adapter. Missing a package it depends on? Cannot find package '@blazetrails/pg'`.

The Rails source for that raise is `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters.rb:42-56`. Nothing committed pins this, so a stray `import "pg"` or `@blazetrails/pg` import reachable from the root would regress it silently. vitest cannot catch it, because it enters the funnel module first.

## Acceptance criteria

- [ ] A committed check, as a script or dx-test run in CI against the built `dist/`, runs a plain-node import of `@blazetrails/activerecord` with `pg` and `@blazetrails/pg` unresolvable. It asserts that the import succeeds and that `load` followed by `resolve` for `postgresql` raises that `LoadError` message.
- [ ] The check fails on a tree where the activerecord root statically imports `@blazetrails/pg`.
