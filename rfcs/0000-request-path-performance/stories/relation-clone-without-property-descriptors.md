---
title: "Relation#clone copies state without a property descriptor per key"
status: ready
updated: 2026-11-13
rfc: "0000-request-path-performance"
cluster: request-perf
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/relation.ts` `clone()` (about `:1679`) calls
`Object.getOwnPropertyDescriptor(this, key)` for every own key. It is the
largest single allocation site on the twelve-dollar request path: **6.7%** of
all bytes, spread across `spawn` (`relation/spawn-methods`) and the `select`,
`limit` and `order` query methods. Every scope step, such as
`Post.withDetails().newestFirst().limit(20)`, clones. Rails'
`Relation#initialize_copy` (`activerecord/lib/active_record/relation.rb`) does
`@values = @values.dup` plus a reset, with no reflection.

## Acceptance criteria

- `clone` copies the values hash and the known instance state directly,
  following `initialize_copy`.
- Relation tests stay green, including the ones that depend on cloned
  accessors.
- A sampling heap profile under the twelve-dollar load shows
  `getOwnPropertyDescriptor` below 1% of allocated bytes, and the story records
  the before and after CPU per request.
