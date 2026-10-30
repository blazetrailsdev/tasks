---
title: "TopLevel moves to ruby-compat and replaces RCLASS_CONST_TBL"
status: done
updated: 2026-10-30
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-lookup
packages: ["ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9508
claim: "2026-10-30T20:01:49Z"
assignee: "top-level-moves-to-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

RFC 0213 § "Seating". `TopLevel` is in `packages/activesupport/src/namespaces.ts`, and `RCLASS_CONST_TBL` in `packages/ruby-compat/src/variable.ts`. Zeitwerk has no ActiveSupport dependency, so the root namespace must live lower.

## Acceptance criteria

- `TopLevel` is exported from ruby-compat and re-exported by activesupport.
- `registerConstant`, `registeredConstant`, `isRegisteredConstant`, `unregisterConstant` and `rbModRemoveConst` read and write `TopLevel`; `RCLASS_CONST_TBL` is gone.
- The plain-node entry-module import passes in both directions on built `dist`.
