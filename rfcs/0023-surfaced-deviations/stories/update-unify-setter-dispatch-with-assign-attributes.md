---
title: "Unify #update/#update! on public_send-equivalent setter dispatch"
status: draft
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`#update` / `#update!` assign via a raw `writeAttribute` loop
(`assignUpdateAttributes`, packages/activerecord/src/persistence.ts:606) instead
of Rails' setter dispatch. Rails' `assign_attributes` routes **every** key through
`public_send("#{key}=")` (`vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:36-48`,
`_assign_attribute`).

trails keeps the raw loop deliberately — `Base#assignAttributes` wraps every
`writeAttribute` failure in `AttributeAssignmentError`, which is more aggressive
than Rails, and the raw loop preserves original error classes. But it leaves two
assignment paths where Rails has one: plain columns go through raw
`writeAttribute`, while only nested-attribute writers (`<assoc>Attributes=`) are
routed through their generated setter by `assignUpdateAttribute`
(persistence.ts:597+). A column with a custom writer would be silently missed.

This is recorded as an inline `TODO: unify on public_send-equivalent setter
dispatch if/when a custom column writer is introduced` in `update()`. No such
column exists today, so it is latent rather than currently broken. Confirmed
still present after #4972, which restored the `assign_attributes` prelude
(empty guard + sanitizer) but intentionally left the loop itself alone.

Depends on resolving the `AttributeAssignmentError` wrap divergence — see
`assign-attributes-error-wrap-diverges-from-rails`.

## Acceptance criteria

- [ ] `#update` / `#update!` dispatch every key through its setter, matching
      `_assign_attribute`'s `public_send("#{key}=")`.
- [ ] A model with a custom column writer (`set foo(v)`) has that writer invoked
      by `update`, with a test proving it.
- [ ] Original error classes are still preserved (no blanket
      `AttributeAssignmentError` wrap regression) — the reason the raw loop exists.
- [ ] Remove the TODO comment in `update()` once unified.
