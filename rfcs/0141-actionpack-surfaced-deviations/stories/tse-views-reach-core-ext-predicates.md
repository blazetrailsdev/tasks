---
title: "TSE views can call ActiveSupport core-ext predicates"
status: draft
updated: 2026-11-24
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionview"]
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

A Rails view calls `params[:search].present?` directly. A `.tse` view resolves bare names against locals, the view and `TopLevel` (`packages/tse-compiler/lib/emit-js.ts`, the emitted `__lookup`), so ActiveSupport's free functions (`isPresent`, `isBlank`, `presence`, `safeJoin`) are unreachable. `examples/electron-writebook/app/helpers/application-helper.ts` adds a receipted `isPresent` helper; `safeJoin` calls were rewritten as loops.

## Acceptance criteria

- A `.tse` template can call ActiveSupport's core-ext predicates (`isPresent`, `isBlank`, `presence`) and ActionView's `safeJoin` without an app helper, by a mechanism ratified for the view lookup.
- `examples/electron-writebook`'s `isPresent` helper and its `CONVERGEABLE tse-views-reach-core-ext-predicates` receipt are deleted.
