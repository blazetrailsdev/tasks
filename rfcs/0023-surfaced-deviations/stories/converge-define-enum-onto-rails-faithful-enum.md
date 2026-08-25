---
title: "Converge declare/defineEnum onto Rails-faithful _enum (remove integer-storing defineEnum)"
status: done
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 3269
claim: "2026-06-14T17:24:37Z"
assignee: "converge-define-enum-onto-rails-faithful-enum"
blocked-by: null
---

## Context

Surfaced while working `enum-assert-valid-value-only-on-setter`. The codebase
has **two** enum implementations in `packages/activerecord/src/enum.ts`:

- `_enum` (the `Base.enum` macro) — **Rails-faithful**. Registers an `EnumType`
  in the attribute set, so the getter returns the **label string**
  (`book.status # => "published"`) and `assertValidValue` is enforced on every
  write path (setter, `writeAttribute`, mass-assignment).
- `defineEnum` — **fidelity violation**. Stores the raw **integer**
  (`book.status # => 0`), registers no `EnumType`, and therefore enforces
  `assertValidValue` on **no** path. Used by `declare`'s `defineEnum:` form and
  ~96 call sites (73 in `enum.test.ts`).

`defineEnum` diverges from Rails (Rails enum getters always return the label).
The two paths should converge on the Rails-faithful `_enum` semantics and
`defineEnum` should be removed (or made a thin alias). Too big for the
`enum-assert-valid-value-only-on-setter` PR (~96 call sites, many test
rewrites), so filed separately.

## Acceptance criteria

- `declare`'s enum form and any remaining `defineEnum` call sites route through
  the Rails-faithful `_enum` semantics (label-stored, `EnumType`-registered).
- `assertValidValue` enforced on setter, `writeAttribute`, and mass-assignment
  for all enum attributes.
- `defineEnum` removed or reduced to a thin compatibility shim.
- Test names continue to match Rails verbatim.
