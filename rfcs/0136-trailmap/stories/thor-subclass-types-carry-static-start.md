---
title: "Thor subclasses carry the static start in their type"
status: claimed
updated: 2026-11-04
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: "2026-11-04T00:45:46Z"
assignee: "dangerous-attribute-methods-derive-from-base"
blocked-by: null
closed-reason: null
---

`Cli.start(argv)` works at runtime, but `Cli extends Thor` has no static `start` in its type, so trailmap's `lib/jobs.ts` casts. `start` is on `ThorClass` (`packages/thor/src/base.ts`) and not on the `Thor` class declaration.

Expected: `SomeThorSubclass.start(argv)` typechecks in trails, with a type test. Then remove the cast from `lib/jobs.ts` and `test/lib/jobs.test.ts` in trailmap.
