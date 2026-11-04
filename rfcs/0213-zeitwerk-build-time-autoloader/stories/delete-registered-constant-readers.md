---
title: "Delete isRegisteredConstant / registeredConstant; ruby-compat callers read constGet / constDefined"
status: draft
updated: 2026-11-04
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9688 deleted `unregisterConstant`. Two sibling exports from the same family are still in place: `isRegisteredConstant(name)` and `registeredConstant(name)` (`packages/ruby-compat/src/variable.ts`). Both are exported from `index.ts` and carry `@noRailsEquivalent PERMANENT`. Each reads `TopLevel`'s table directly. That makes them a second spelling of MRI's `rb_const_defined` (`vendor/ruby/v3.3.11/variable.c:3527`) and `rb_const_get` (`variable.c:3674`) on `rb_cObject`, both of which ruby-compat already ports as `constDefined` (`include.ts`) and `constGet` (`variable.ts`).

The trails#9688 PR moved every caller outside ruby-compat onto `constDefined` / `constGet`. The callers left are all inside ruby-compat:

- `include.ts:183-184`: inside `constDefined` itself, its first-segment fallback to `TopLevel`'s table.
- `include.ts:1218`: `c === registeredConstant("Set")`.
- `psych/visitors/yaml-tree.ts:169`: `registeredConstant("DateTime")`. This is a soft read where Psych names `DateTime` directly.
- `marshal.ts:411`: `registeredConstant(rbModToS(rbObjClass(obj)))`.
- Tests: `variable.trails.test.ts` and `load.trails.test.ts`.

## Acceptance criteria

- The `include.ts:1218` and `marshal.ts:411` callers read through `constGet(Object, …)`, or through a direct import where the name is a literal and an import can reach it. This follows CLAUDE.md § "Constant lookup is an import or a registry".
- `yaml-tree.ts` takes the arm the Psych source takes for `DateTime`. Cite the vendored psych `yaml_tree.rb` line.
- `constDefined`'s first-segment fallback reads `TopLevel` directly, with no exported helper.
- `isRegisteredConstant` and `registeredConstant` are deleted along with their `index.ts` exports. Tests use `constDefined` / `constGet`.
- `parity:api:extra:gate` for ruby-compat stays at or below its mark, and `total` drops by the deleted names.
