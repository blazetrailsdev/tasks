---
title: "frozen statuses, per-class enum redefinition, status_change"
status: ready
updated: 2026-07-06
rfc: "0050-enum-fidelity"
cluster: null
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

Surfaced converging `enum.test.ts` to the canonical `Book` model (RFC 0050,
PR #4410 enum-canonical-book-gaps). Three related enum-metadata gaps in
`packages/activerecord/src/enum.ts` remain `it.skip`-ped in
`packages/activerecord/src/enum.test.ts`:

- "attempting to modify enum raises error" — Rails freezes `Book.statuses`;
  trails' pluralized mapping accessor returns a fresh mutable copy.
- "enums are distinct per class" / "enums are inheritable" — per-class vs
  inherited enum redefinition semantics.
- `status_change` accessor (old→new pair) is absent for enum columns.

## Acceptance criteria

- [ ] `Book.statuses` (and peers) is frozen so mutation raises, per Rails.
- [ ] Enum redefinition is distinct-per-class and inheritable per Rails.
- [ ] Enum columns expose `{name}Change`; un-skip the corresponding
      `enum.test.ts` cases (drop `it.skip` → `it`).
