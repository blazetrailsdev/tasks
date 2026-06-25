---
title: "aggregations.test.ts redefines orders without billing/shipping cols, poisons autosave-association on shared worker DB"
status: in-progress
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 7
pr: 4134
claim: "2026-06-25T16:42:30Z"
assignee: "harden-orders-table-shared-db-collision"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Diagnosed during PR #3331 CI. `aggregations.test.ts:303` (and :402) calls
`defineSchema({ orders: { amount: "integer", status: "string" } })` — an
`orders` table WITHOUT the canonical `name` / `billing_customer_id` /
`shipping_customer_id` columns (TEST_SCHEMA `orders`). `autosave-association.test.ts`
(`makeOrderModels`, belongs_to billing/shipping) relies on the canonical
`orders` table and does NOT recreate it. When the two files land on the same
pooled worker DB under parallel forks, autosave's `Order.save()` cannot persist
the FK columns → `association("billing").loadTarget()` returns null →
`TypeError: Cannot read properties of null (reading 'id')`
(autosave-association.test.ts:2057/2077/2099).

Verified nondeterministic: with different fork scheduling the victim shifts
(autosave passes; `core.test.ts`/`counter-cache.test.ts` fail instead), and all
pass in isolation. Same offender class as the documented posts/items/people
collisions. Companion to RFC 0028 flake-elimination-as-ci-cost.

## Acceptance criteria

- [ ] Stop `aggregations.test.ts` poisoning the shared `orders` table —
      either rebuild canonical (`defineSchema(..., { dropExisting: true })`
      pattern) or use a bespoke table name, matching the fix pattern used for
      the other shared-table flakes.
- [ ] autosave-association + aggregations co-scheduled on one worker DB pass
      reliably.
- [ ] No test-name changes.
