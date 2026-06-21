---
title: "new Model(attrs) and deepDup-based dup should be dirty against column defaults (Rails parity)"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 3780
claim: "2026-06-21T11:50:43Z"
assignee: "new-record-dirty-against-defaults-on-construct-and-dup"
blocked-by: null
---

## Context

Surfaced while implementing `dup-initialize-dup-convergence` (PR #3701).

In Rails, a new record built by assignment is dirty against column defaults:
`Topic.new(attrs).changes` and `Topic.first.dup.changes` both return the full
`[default, value]` set. Rails `dup` relies on this via `Core#init_attributes`
(`@attributes.deep_dup` + `reset(primary_key)`), so the duped new_record reports
all non-default attributes as changed.

Trails diverges: `new Topic(attrs)` produces a CLEAN record (the constructor
snapshots the initial attrs as the baseline), and `_attributes.deepDup()` of a
loaded record likewise yields `{}` changes (loaded attrs are `FromDatabase` with
`original == value`). Only the `assignAttributes` (FromUser) path tracks changes.

Because of this, `Persistence#dup` (packages/activerecord/src/persistence.ts)
could NOT mirror Rails' `init_attributes` deep_dup faithfully — it instead
constructs `new ctor({})` and replays `assignAttributes(attrs)` to reproduce
Rails' observable `changes`. This is documented in the `dup` docstring as an
intentional divergence, but the root cause (constructor / deepDup change-tracking
not matching Rails new-record dirtiness) remains.

Evidence: `dup.test.ts > dup with changes` only passes via the assignAttributes
replay; the deep_dup approach yields empty `changes` (verified locally).

## Acceptance criteria

- [x] `new Model(attrs).changes` matches Rails (dirty against column defaults for
      assigned attributes) — `Topic.new(title: "x").changed?` is true.
- [x] `_attributes.deepDup()` of a loaded record, when the record becomes a
      new_record (dup), reports changes-vs-default like Rails.
- [x] Converge `Persistence#dup` to Rails' `init_attributes` (deep_dup + reset
      pk) instead of the `new ctor({}) + assignAttributes` replay, keeping
      `dup.test.ts` green (esp. `dup with changes`).
- [x] No regressions in dirty / persistence / dup suites.
