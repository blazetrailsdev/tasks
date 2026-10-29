---
title: "registerX registries gain a name → class read side"
status: draft
updated: 2026-10-29
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md § "Constant lookup is an import or a registry" (trails#9424, owner ruling 2026-10-28): an open set of application classes is found through its explicit registry, and each reader calls that registry directly. Today every `registerX` returns `void` and writes through ruby-compat's `registerConstant`, so there is no read side and readers still `constantize`:

- `registerModel` — `packages/activerecord/src/associations.ts`
- `registerController` — `packages/actionpack/src/action-controller/base.ts`
- `registerJob` — `packages/activejob/src/base.ts`
- `registerChannel` — `packages/actioncable/src/channel/base.ts`
- `registerConnection` — `packages/actioncable/src/connection/base.ts`

The first reader to convert is `compute_type` (`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:255-261`, trails `packages/activerecord/src/inheritance.ts:60-68`).

## Acceptance criteria

- [ ] `registerModel`, `registerJob`, `registerChannel` and `registerConnection` each keep their own map (name → class, keyed as it seats today: `klass.name` plus the Ruby name) and its package exports one name → class read beside it.
- [ ] No reader is converted in this story beyond one proof site (`compute_type`); the rest belong to `framework-constantize-calls-become-imports-or-registries`.

## Scope change (owner, 2026-10-29)

Dropping the `registerConstant` write-through moves to `framework-constantize-calls-become-imports-or-registries`: ~44 non-test files still `constantize` registered classes, and the write stops only once they read the registries. `registeredController` moves there too: actioncontroller's extra-surface `allowed` mark is only-shrink, so the read lands with its first reader (the routing controller lookup). `registeredModel` lives in `active-record.ts`, not beside `registerModel` in `associations.ts`: `inheritance.ts` (the `compute_type` reader) importing `associations.ts` closes a module-eval import cycle through the association builders, and `active-record.ts` is already its import.
