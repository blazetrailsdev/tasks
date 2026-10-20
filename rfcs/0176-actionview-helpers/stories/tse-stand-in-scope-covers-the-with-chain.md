---
title: "TSE typed stand-in binds every name the run-time with chain resolves"
status: in-progress
updated: 2026-10-20
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9125
claim: "2026-10-20T13:14:09Z"
assignee: "tse-stand-in-scope-covers-the-with-chain"
blocked-by: null
closed-reason: null
---

## Context

Before templates switch to tsc-emitted JS (`actionview-template-compile-loads-precompiled-module`), the typed stand-in that `trails-tsc` generates has to resolve every name the run-time `with` chain resolves today.

- Run-time scope: `packages/actionview/src/template.ts:409`. It nests `with (TopLevel) { with (this) { with (__yield) { with (localAssigns | __strictLocals) { localsCode() … } } } }`, plus `kwargsCode` for strict locals.
- Stand-in scope: `virtualizeTse` / `shimScope` / `TseScope` in `packages/trails-tsc/src/plugins/tse.ts`, filled by `templateScope` and `bindCheckedTypes` in `packages/trails-tsc/src/build-views.ts`. It covers helpers, controller assigns and partial locals.

## Acceptance criteria

- List every name source the `with` chain supplies (TopLevel constants, view-instance helpers and assigns, `yield` / `content_for` sections, locals, strict-locals kwargs, `_iteration` / `_counter` partial locals). For each, record whether the stand-in binds it explicitly.
- Close each gap in the stand-in generator so the emitted JS needs no `with`.
- A test harness renders the existing actionview template fixtures through emitted stand-in JS and compares the output with the current eval path. No differences.
