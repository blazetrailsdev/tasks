---
title: "A Ruby predicate must not be satisfied by a getter that returns a non-boolean"
status: in-progress
updated: 2026-09-23
rfc: "0156-parity-beyond-name-presence"
cluster: "denominator"
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: trails#8002
claim: "2026-09-23T16:38:24Z"
assignee: "reconcile-skip-registers-with-open-stories"
blocked-by: null
closed-reason: null
---

## Context

A predicate `foo?` offers `isFoo`, bare `foo`, and `fooQ` as TS candidates (`scripts/parity/conventions.ts:1469-1478`), and a match is by name with no look at the member's kind or type. `ConnectionPool#active_connection?` (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb`) scores matched against `get activeConnection(): DatabaseAdapter | null` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:364`), which is 0155's `pool-active-connection-predicate-is-a-getter`.

CLAUDE.md notes a Ruby predicate may return a value, so the check cannot be "must be boolean". It can be "the bare-name candidate is a getter or property whose declared type excludes `boolean` AND the Ruby file defines no bare `foo` sibling".

## Acceptance criteria

- The TS extractor records, for an accessor or property, whether its declared type admits `boolean`.
- A predicate row matched only through the bare candidate by such a member is reported as a kind mismatch, in its own list, not as missing.
- `active_connection?` appears in that list.
- Report-only in this story. The PR body gives the count per package and a hand verdict on a sample of at least 30, so a follow-up can decide on a gate.
