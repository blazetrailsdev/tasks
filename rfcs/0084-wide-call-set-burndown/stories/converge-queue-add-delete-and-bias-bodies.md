---
title: "converge-queue-add-delete-and-bias-bodies"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6390
claim: "2026-08-12T00:25:59Z"
assignee: "converge-queue-add-delete-and-bias-bodies"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #6279, which routed the `Queue` bodies through the
ported `synchronize` but deliberately left their contents untouched. Three
pre-existing divergences inside those bodies
(`packages/activerecord/src/connection-adapters/abstract/connection-pool/queue.ts`):

- `add` (`queue.rb:35-38`) always `@queue.push element` and THEN `@cond.signal`.
  The port signals first and pushes only when no waiter took it. This is the
  `order:signal,push` row already in
  `call-mismatches-exclude/.../queue.json`.
- `delete` (`queue.rb:43-46`) is Ruby's `Array#delete`, which removes EVERY
  equal element. The port does `indexOf` + `splice`, i.e. the first match only.
- `with_a_bias_for`'s ensure calls `new_cond.broadcast_on_biased`
  (`queue.rb:189`) to wake the remaining sleepers. The port calls
  `newCond.transferWaitersTo(previousCond)` instead — a trails-only method with
  no Ruby counterpart.

The first two are only observable under Rails' threading model, which is why
the port drifted; the third is invented surface.

## Acceptance criteria

- [ ] `add` pushes then signals, in Rails' order; the `order:signal,push`
      baseline row is DELETED, not reworded.
- [ ] `delete` removes every equal element, as `Array#delete` does.
- [ ] `with_a_bias_for` wakes remaining sleepers through a ported
      `broadcast_on_biased`; `transferWaitersTo` is removed or justified as a
      language shortcoming at its call site.
- [ ] SQLite, MySQL and PostgreSQL lanes green.
