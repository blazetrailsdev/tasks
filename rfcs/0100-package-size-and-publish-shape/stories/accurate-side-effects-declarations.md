---
title: "Declare accurate sideEffects arrays"
status: draft
updated: 2026-08-11
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages:
  [
    "activerecord",
    "activemodel",
    "activesupport",
    "arel",
    "date",
    "i18n",
    "globalid",
    "did-you-mean",
  ]
deps: []
deps-rfc: []
est-loc: 120
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**No package in the repo declares `sideEffects`** — `grep -rn "sideEffects"
packages/*/package.json` returns nothing across all 19 packages. Without it a
bundler must assume every module is side-effecting and cannot drop an
unreferenced one, so subsystems an app never touches stay in its bundle.

Measured cost in the 1,904,049 B baseline bundle of
`import { Base } from "@blazetrails/activerecord"`:
`migration` 43,351 B · `encryption/` 37,037 B · `tasks/` 34,578 B — ~115 KB
that a bundler could not prove was safe to drop.

The trap: `sideEffects: false` is **wrong** for this codebase. Much of AR _is_
registration side effects — the adapter registry
(`packages/activerecord/src/connection-adapters.ts:144-165` calls `register()`
at module scope), type registration, trailtie wiring. A blanket `false` would
silently drop registrations and produce a bundle that fails at runtime, not at
build time, which is the worst possible failure mode.

The only acceptable form here is the accurate array — enumerating the modules
that really do run side effects on import.

## Acceptance criteria

1. Every module with a module-scope side effect is identified and enumerated;
   the audit method is written down (not "we looked").
2. `sideEffects` is added as an **array** to `@blazetrails/activerecord` and to
   each workspace dep in its closure (activemodel, activesupport, arel, date,
   i18n, globalid, did-you-mean). `sideEffects: false` is only acceptable for a
   package proven to have none.
3. A runtime smoke test proves nothing was dropped: an app bundled with
   `--minify` still connects, defines a model with associations and enums, runs
   a migration, and round-trips a record.
4. Measured bundle reduction reported in the PR body, from the same
   `esbuild --metafile` harness as the baseline.
