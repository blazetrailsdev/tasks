---
title: "registerX registries gain a name → class read side"
status: in-progress
updated: 2026-10-29
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9466
claim: "2026-10-29T23:39:32Z"
assignee: "register-x-registries-gain-a-read-side"
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

- [ ] Each `registerX` keeps its own map (name → class, keyed as it seats today: `klass.name` plus the Ruby name) and its package exports one name → class read beside it.
- [ ] The registries stop writing through `registerConstant`.
- [ ] No reader is converted in this story beyond one proof site (`compute_type`); the rest belong to `framework-constantize-calls-become-imports-or-registries`.
