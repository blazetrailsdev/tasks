---
title: "Retire activerecord test-support ar-db-slots or record it as test tooling"
status: in-progress
updated: 2026-09-23
rfc: "0151-activesupport-autoload-slot-registry"
cluster: autoload
packages:
  - activerecord
deps:
  - "converge-arel-node-slots-onto-autoload"
deps-rfc: []
est-loc: 60
priority: 8
pr: tasks#160
claim: "2026-09-23T14:38:45Z"
assignee: "converge-activerecord-support-db-slots"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/support/ar-db-slots.ts` lives under `src/support/**`, which sits outside both compare populations. It is test tooling, not a port of a Rails constant. Decide whether it becomes an `autoload` registration like the rest, or is plain test-harness state that needs no slot. The latter is likely when the cycle it breaks is test-only.

## Acceptance criteria

- `ar-db-slots.ts` is either migrated onto `autoload` (meeting the TDZ entry-module check), or replaced by test-harness state with no slot module and no cycle.
- `support/ar-db-slots.trails.test.ts` still covers the behaviour, under its current name.
